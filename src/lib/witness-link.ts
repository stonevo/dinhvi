import { z } from 'zod';
import { WITNESS_STAGES } from '../types/schema';

// Hỏi nhân chứng qua đường link, không cần server: câu hỏi nằm trong link,
// câu trả lời là một mã ngắn người hỏi dán lại vào app.

const requestSchema = z.object({
  v: z.literal(1),
  /** Tên người hỏi (tùy chọn) để nhân chứng biết ai đang hỏi. */
  asker: z.string().max(80),
  /** Việc đang hỏi, ví dụ "công việc" (tùy chọn). */
  topic: z.string().max(80),
});
export type WitnessRequest = z.infer<typeof requestSchema>;

const answerSchema = z.object({
  v: z.literal(1),
  who: z.string().max(80),
  stage: z.enum(WITNESS_STAGES),
  note: z.string().max(500),
  at: z.string(),
});
export type WitnessAnswer = z.infer<typeof answerSchema>;

export const ANSWER_PREFIX = 'DV1-';

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeRequest(r: Omit<WitnessRequest, 'v'>): string {
  return toBase64Url(JSON.stringify({ v: 1, asker: r.asker.trim(), topic: r.topic.trim() }));
}

export function decodeRequest(code: string): WitnessRequest | null {
  try {
    return requestSchema.parse(JSON.parse(fromBase64Url(code)));
  } catch {
    return null;
  }
}

/** Đường link cho nhân chứng, dựa trên địa chỉ app hiện tại. */
export function requestUrl(baseUrl: string, r: Omit<WitnessRequest, 'v'>): string {
  return `${baseUrl.replace(/#.*$/, '')}#/witness?r=${encodeRequest(r)}`;
}

export function encodeAnswer(a: Omit<WitnessAnswer, 'v'>): string {
  return ANSWER_PREFIX + toBase64Url(JSON.stringify({ v: 1, ...a, who: a.who.trim(), note: a.note.trim() }));
}

/** Đọc mã trả lời; chấp nhận khoảng trắng/xuống dòng thừa khi dán. */
export function decodeAnswer(code: string): WitnessAnswer | null {
  const clean = code.replace(/\s+/g, '');
  if (!clean.startsWith(ANSWER_PREFIX)) return null;
  try {
    return answerSchema.parse(JSON.parse(fromBase64Url(clean.slice(ANSWER_PREFIX.length))));
  } catch {
    return null;
  }
}
