// Máy chủ trung gian "Diễn giải bằng AI" của Định Vị (Cloudflare Worker, gói miễn phí).
//
// POST /answer  (Authorization: Bearer <Firebase ID token>, body: ReadingInput)
//   → 200 { text, provider: "gemini" | "workers-ai" }
//   → 503 { unavailable: true, retryAt }   cả hai dịch vụ đều hết lượt: app dùng tóm lược tĩnh
//   → 429 { limit: true }                  người này đã hỏi đủ số lần trong ngày
//
// Thứ tự: Gemini (gói miễn phí) → Workers AI → hết. Khi một dịch vụ báo hết lượt, lưu thời điểm
// mở lượt lại vào KV để các yêu cầu sau bỏ qua nó cho tới lúc đó.
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { SYSTEM_PROMPT, buildUserPrompt, geminiRetryAt, nextUtcMidnight, userDayKey, validateInput } from './logic';

export interface Env {
  AI: Ai;
  STATE: KVNamespace;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  WORKERS_AI_MODEL: string;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
  DAILY_LIMIT_PER_USER: string;
}

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

class Unavailable extends Error {
  constructor(readonly retryAt: Date) {
    super('unavailable');
  }
}

function cors(env: Env, origin: string | null): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return origin && allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' }
    : {};
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } });

async function blockedUntil(env: Env, provider: string, now: Date): Promise<Date | null> {
  const v = await env.STATE.get(`block:${provider}`);
  return v && new Date(v) > now ? new Date(v) : null;
}

async function block(env: Env, provider: string, until: Date, now: Date) {
  const ttl = Math.max(60, Math.ceil((until.getTime() - now.getTime()) / 1000));
  await env.STATE.put(`block:${provider}`, until.toISOString(), { expirationTtl: ttl });
}

async function askGemini(env: Env, user: string, now: Date): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Unavailable(new Date(now.getTime() + 3_600_000));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });
  if (res.status === 429) throw new Unavailable(geminiRetryAt(now, await res.json().catch(() => null)));
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!text) throw new Error('gemini: empty');
  return text;
}

async function askWorkersAi(env: Env, user: string, now: Date): Promise<string> {
  try {
    const out = (await env.AI.run(env.WORKERS_AI_MODEL as Parameters<Ai['run']>[0], {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
      max_tokens: 900,
      temperature: 0.4,
    } as never)) as { response?: string };
    const text = out.response?.trim();
    if (!text) throw new Error('workers-ai: empty');
    return text;
  } catch (e) {
    // Hết hạn mức neuron miễn phí trong ngày (mã 4006): mở lại lúc 00:00 UTC.
    if (/4006|neuron|daily free allocation/i.test(String(e))) throw new Unavailable(nextUtcMidnight(now));
    throw e;
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(env, req.headers.get('origin'));
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'POST' || new URL(req.url).pathname !== '/answer') return json({ error: 'not found' }, 404, h);

    // Chỉ người đã đăng nhập Google (Firebase) mới được hỏi.
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'unauthorized' }, 401, h);
    let uid: string;
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
        audience: env.FIREBASE_PROJECT_ID,
      });
      uid = String(payload.sub);
    } catch {
      return json({ error: 'unauthorized' }, 401, h);
    }

    const input = validateInput(await req.json().catch(() => null));
    if (!input) return json({ error: 'bad request' }, 400, h);

    const now = new Date();
    const dayKey = userDayKey(uid, now);
    const used = Number((await env.STATE.get(dayKey)) ?? '0');
    if (used >= Number(env.DAILY_LIMIT_PER_USER)) return json({ limit: true, retryAt: nextUtcMidnight(now).toISOString() }, 429, h);

    const user = buildUserPrompt(input);
    const providers: [string, (env: Env, user: string, now: Date) => Promise<string>][] = [
      ['gemini', askGemini],
      ['workers-ai', askWorkersAi],
    ];
    let soonest: Date | null = null as Date | null;
    const earliest = (d: Date) => {
      if (!soonest || d < soonest) soonest = d;
    };
    for (const [name, ask] of providers) {
      const until = await blockedUntil(env, name, now);
      if (until) {
        earliest(until);
        continue;
      }
      try {
        const text = await ask(env, user, now);
        await env.STATE.put(dayKey, String(used + 1), { expirationTtl: 2 * 86_400 });
        return json({ text, provider: name }, 200, h);
      } catch (e) {
        if (e instanceof Unavailable) {
          await block(env, name, e.retryAt, now);
          earliest(e.retryAt);
        }
        // Lỗi khác (mạng, 5xx): thử dịch vụ kế tiếp, không khoá.
      }
    }
    return json({ unavailable: true, retryAt: soonest?.toISOString() ?? null }, 503, h);
  },
};
