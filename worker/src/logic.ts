// Phần thuần của máy chủ AI (kiểm thử được bằng vitest ở repo gốc, tests/ai-worker.test.ts).

/** Nội dung đã kiểm của một lần gieo, do app gửi lên (không có dữ liệu cá nhân nào khác). */
export type ReadingInput = {
  question: string;
  /** Lĩnh vực đã chọn (vd. "Công việc"), có thể trống. */
  context?: string;
  primary: { name: string; image: string; time: string; do: string[]; avoid: string[] };
  /** Các hào cần đọc theo quy tắc (thường là hào động của quẻ chính): vị trí, quẻ chứa hào, tóm lược và đoạn theo lĩnh vực. */
  moving: { position: number; of?: string; line: string; context?: string }[];
  transformed?: { name: string; time: string };
  /** Quy tắc đọc quẻ theo số hào động (câu của app). */
  rule: string;
};

export const MAX_QUESTION = 500;

export function validateInput(raw: unknown): ReadingInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as ReadingInput;
  const str = (s: unknown, max = 2000) => typeof s === 'string' && s.length > 0 && s.length <= max;
  if (!str(r.question, MAX_QUESTION) || !str(r.rule) || !r.primary || !str(r.primary.name, 80)) return null;
  if (!str(r.primary.image) || !str(r.primary.time)) return null;
  if (!Array.isArray(r.primary.do) || !Array.isArray(r.primary.avoid) || !Array.isArray(r.moving) || r.moving.length > 6) return null;
  if (r.moving.some((m) => !Number.isInteger(m.position) || m.position < 1 || m.position > 6 || !str(m.line) || (m.of !== undefined && !str(m.of, 80)) || (m.context !== undefined && !str(m.context)))) return null;
  if (r.context !== undefined && !str(r.context, 60)) return null;
  if (r.transformed && (!str(r.transformed.name, 80) || !str(r.transformed.time))) return null;
  return r;
}

export const SYSTEM_PROMPT = `Bạn là người đọc quẻ Kinh Dịch cho ứng dụng tự soi "Định Vị". Người dùng vừa gieo quẻ và đặt một câu hỏi.

Viết một đoạn diễn giải bằng tiếng Việt, 150–250 chữ, trả lời THẲNG vào câu hỏi của người dùng, nối từng ý với tình huống cụ thể họ nêu.

Quy tắc bắt buộc:
- CHỈ dựa trên phần "Nội dung quẻ" được cung cấp. Không thêm ý, điển tích, lời hào hay kiến thức Kinh Dịch nào khác. Không bịa chi tiết về hoàn cảnh người dùng.
- Theo đúng "Quy tắc đọc" đã cho (đọc lời quẻ hay lời hào nào). Khi dùng ý của một hào, nói rõ "hào N".
- Giữ đúng chiều tốt / xấu / cần thận trọng của nội dung. Không hứa hẹn kết quả chắc chắn, không nói ngày giờ, không đưa lời khuyên y khoa, pháp lý, tài chính cụ thể.
- Gọi người đọc là "bạn". Văn xuôi liền mạch, không dùng tiêu đề, không gạch đầu dòng, không markdown.
- Kết thúc bằng đúng một câu hỏi để người dùng tự soi lại việc của mình.`;

export function buildUserPrompt(r: ReadingInput): string {
  const lines = [
    `Câu hỏi của người dùng: ${r.question}`,
    r.context ? `Lĩnh vực: ${r.context}` : '',
    '',
    'Nội dung quẻ:',
    `Quy tắc đọc: ${r.rule}`,
    `Quẻ chính: ${r.primary.name}. Hình quẻ: ${r.primary.image} Thời này: ${r.primary.time}`,
    `Nên: ${r.primary.do.join('; ')}. Tránh: ${r.primary.avoid.join('; ')}.`,
    ...r.moving.map((m) => `Hào ${m.position}${m.of ? ` của quẻ ${m.of}` : ''}: ${m.line}${m.context ? ` Theo lĩnh vực: ${m.context}` : ''}`),
    r.transformed ? `Quẻ biến: ${r.transformed.name}. ${r.transformed.time}` : 'Không có quẻ biến.',
  ];
  return lines.filter((l, i) => l !== '' || i === 2).join('\n');
}

// ---------- Thời điểm mở lượt lại ----------

/** Nửa đêm tiếp theo ở múi giờ `timeZone` (vd. America/Los_Angeles — Gemini mở lượt ngày theo giờ Thái Bình Dương). */
export function nextMidnightIn(now: Date, timeZone: string): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const elapsed = (Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)) * 1000;
  return new Date(now.getTime() - elapsed - now.getMilliseconds() + 86_400_000);
}

export function nextUtcMidnight(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

/**
 * Gemini trả 429: hết lượt theo phút (có retryDelay, vd. "31s") thì chờ đúng chừng ấy;
 * hết lượt theo ngày (quotaId có "PerDay") thì chờ tới nửa đêm giờ Thái Bình Dương.
 */
export function geminiRetryAt(now: Date, body: unknown): Date {
  const details = ((body as { error?: { details?: unknown[] } })?.error?.details ?? []) as Record<string, unknown>[];
  const perDay = JSON.stringify(details).includes('PerDay');
  if (perDay) return nextMidnightIn(now, 'America/Los_Angeles');
  const retry = details.find((d) => typeof d.retryDelay === 'string')?.retryDelay as string | undefined;
  const secs = retry ? parseFloat(retry) : NaN;
  return new Date(now.getTime() + (Number.isFinite(secs) ? secs * 1000 : 60_000));
}

/** Khoá đếm lượt hỏi của một người trong ngày (UTC). */
export const userDayKey = (uid: string, now: Date) => `u:${uid}:${now.toISOString().slice(0, 10)}`;
