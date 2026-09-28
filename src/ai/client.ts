// "Diễn giải bằng AI" phía app: dựng nội dung đã kiểm của lần gieo, gửi máy chủ trung gian
// (worker/), nhận câu trả lời. Không có máy chủ, chưa bật, chưa đăng nhập hay hết lượt thì app
// dùng tóm lược tĩnh như cũ.
import type { StaticData } from '../data/load';
import { loadContexts, loadSummaries } from '../data/load';
import { t } from '../i18n';
import { castFocus, type CastReading } from '../lib/cast';
import { loadEngine } from '../sync/CloudSync';
import type { ContextKey } from '../types/schema';
import type { ReadingInput } from '../../worker/src/logic';
import { AI_ENDPOINT } from './config';

const ENABLED_KEY = 'dinhvi.ai';

export const aiConfigured = () => AI_ENDPOINT !== null;

/** Người dùng đã bật tính năng trên máy này (mặc định tắt: câu hỏi sẽ được gửi ra ngoài). */
export function aiEnabled(): boolean {
  try {
    return aiConfigured() && localStorage.getItem(ENABLED_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setAiEnabled(on: boolean): void {
  try {
    if (on) localStorage.setItem(ENABLED_KEY, 'on');
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* không lưu được thì coi như tắt */
  }
}

export type AiAnswer = { text: string; provider: string; at: string };

export type AiResult =
  | { kind: 'ok'; answer: AiAnswer }
  | { kind: 'unavailable'; retryAt: string | null }
  | { kind: 'limit' }
  | { kind: 'signedOut' }
  | { kind: 'error' };

/** Nội dung gửi đi: đúng các phần đã kiểm mà quy tắc đọc quẻ chọn cho lần gieo này. */
export async function buildInput(reading: CastReading, question: string, context: ContextKey | undefined, data: StaticData): Promise<ReadingInput> {
  const [summaries, contexts] = await Promise.all([loadSummaries(), loadContexts().catch(() => null)]);
  const p = data.hexagram(reading.primary);
  const ps = summaries.get(reading.primary)!;
  const focus = castFocus(reading);
  const n = reading.moving.length;
  const rule = n === 6 && focus.kind === 'allMoving' ? t('cast.focus.rule.6all') : t(`cast.focus.rule.${n}` as 'cast.focus.rule.0');
  const moving =
    focus.kind === 'lines'
      ? focus.lines.map((pos) => ({
          position: pos,
          of: data.hexagram(focus.hexagram).nameHanViet,
          line: summaries.get(focus.hexagram)!.lines[pos - 1],
          context: context ? contexts?.get(focus.hexagram)?.lines[pos - 1][context] : undefined,
        }))
      : [];
  const tr = reading.transformed ? data.hexagram(reading.transformed) : null;
  return {
    question,
    context: context ? t(`context.${context}` as 'context.work') : undefined,
    primary: { name: `${p.nameHanViet} (${p.nameVi})`, image: ps.image, time: ps.time, do: ps.do, avoid: ps.avoid },
    moving,
    transformed: tr ? { name: `${tr.nameHanViet} (${tr.nameVi})`, time: summaries.get(tr.kingWenNumber)!.time } : undefined,
    rule: focus.kind === 'allMoving' && ps.allMoving ? `${rule} ${ps.allMoving}` : rule,
  };
}

const cache = new Map<string, AiAnswer>();
export const answerKey = (at: Date, lines: number[], question: string) => `${at.toISOString()}|${lines.join('')}|${question}`;
/** Câu trả lời đã nhận cho lần gieo (để lưu kèm bản ghi khi người dùng bấm Lưu). */
export const cachedAnswer = (key: string) => cache.get(key);

export async function askAi(key: string, input: ReadingInput): Promise<AiResult> {
  const hit = cache.get(key);
  if (hit) return { kind: 'ok', answer: hit };
  if (!AI_ENDPOINT) return { kind: 'error' };
  const engine = await loadEngine()?.catch(() => null);
  const token = engine ? await engine.getIdToken().catch(() => null) : null;
  if (!token) return { kind: 'signedOut' };
  try {
    const res = await fetch(`${AI_ENDPOINT}/answer`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as { text?: string; provider?: string; retryAt?: string | null };
    if (res.ok && body.text) {
      const answer = { text: body.text, provider: body.provider ?? 'ai', at: new Date().toISOString() };
      cache.set(key, answer);
      return { kind: 'ok', answer };
    }
    if (res.status === 429) return { kind: 'limit' };
    if (res.status === 503) return { kind: 'unavailable', retryAt: body.retryAt ?? null };
    if (res.status === 401) return { kind: 'signedOut' };
    return { kind: 'error' };
  } catch {
    return { kind: 'unavailable', retryAt: null };
  }
}
