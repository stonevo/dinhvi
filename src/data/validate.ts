import { z } from 'zod';
import {
  hexagramCommentarySchema, hexagramSchema, lineTierSchema, trigramSchema, TRIGRAM_KEYS,
  type CommentaryPart, type Hexagram, type HexagramCommentary, type Line, type LinePosition, type LineTier, type Trigram,
} from '../types/schema';
import {
  TRIGRAM_BINARY, hexagramBinary, lineYinYang, oppositeHexagram, tierOfLine, trigramsOf,
} from '../lib/iching';

// Kiểm tra toàn vẹn dữ liệu tĩnh. Dùng chung cho test, script CLI và loader.

/** Mọi quẻ đều đã viết kỹ đủ 6 hào; hào draft chỉ được phép khi kiểm từng phần. */
export const ALL_HEXAGRAMS = Array.from({ length: 64 }, (_, i) => i + 1);

const ORDINAL: Record<number, string> = { 2: 'nhị', 3: 'tam', 4: 'tứ', 5: 'ngũ' };

/** Tên hào theo truyền thống: Sơ cửu, Lục nhị, Cửu tam, …, Thượng lục. */
export function lineLabel(position: LinePosition, yinYang: 'yin' | 'yang'): string {
  const num = yinYang === 'yang' ? 'cửu' : 'lục';
  if (position === 1) return `Sơ ${num}`;
  if (position === 6) return `Thượng ${num}`;
  return `${num === 'cửu' ? 'Cửu' : 'Lục'} ${ORDINAL[position]}`;
}

/** Nhãn hào chữ Hán: 初九, 六二, …, 上六. */
export function lineLabelHan(position: LinePosition, yinYang: 'yin' | 'yang'): string {
  const num = yinYang === 'yang' ? '九' : '六';
  if (position === 1) return `初${num}`;
  if (position === 6) return `上${num}`;
  return num + '二三四五'[position - 2];
}

const HAN_PUNCT = /[，。、：；！？]/;
/** Số chữ Hán (bỏ dấu câu). */
export const hanCount = (s: string) => [...s].filter((ch) => !HAN_PUNCT.test(ch)).length;
/** Số âm tiết Hán Việt (bỏ dấu câu và ngoặc). */
export const syllableCount = (s: string) =>
  s.replace(/[“”"‘’.,:;!?()—–]/g, ' ').split(/\s+/).filter(Boolean).length;

function zodErrors(prefix: string, err: z.ZodError): string[] {
  return err.issues.map((i) => `${prefix}${i.path.length ? '.' + i.path.join('.') : ''}: ${i.message}`);
}

/** Hào đã viết kỹ (không draft) thì mọi trường phải đủ. */
function completeLineErrors(prefix: string, l: Line): string[] {
  const e: string[] = [];
  if (l.behavioralSignals.length < 3 || l.behavioralSignals.length > 5)
    e.push(`${prefix}.behavioralSignals: cần 3–5 dấu hiệu (có ${l.behavioralSignals.length})`);
  if (l.reflectionQuestions.length < 2 || l.reflectionQuestions.length > 4)
    e.push(`${prefix}.reflectionQuestions: cần 2–4 câu (có ${l.reflectionQuestions.length})`);
  for (const f of ['characteristicRisk', 'commonFailure', 'traditionalCounsel', 'whatTendsToFollow'] as const)
    if (!l[f].trim()) e.push(`${prefix}.${f}: trống`);
  return e;
}

export type HexagramCheckOptions = {
  /** false = cho phép tập con (kiểm từng phần). Mặc định đòi đủ 64. */
  requireAll?: boolean;
  /** Các quẻ bắt buộc không có hào draft. Mặc định: cả 64. */
  requireComplete?: number[];
};

export function validateHexagrams(raw: unknown, opts: HexagramCheckOptions = {}): string[] {
  const { requireAll = true, requireComplete = ALL_HEXAGRAMS } = opts;
  const parsed = z.array(hexagramSchema).safeParse(raw);
  if (!parsed.success) return zodErrors('hexagrams', parsed.error);
  const list: Hexagram[] = parsed.data;
  const errors: string[] = [];

  const nums = list.map((h) => h.kingWenNumber);
  if (new Set(nums).size !== nums.length) errors.push('kingWenNumber bị trùng');
  if (new Set(list.map((h) => h.binary)).size !== list.length) errors.push('binary bị trùng');
  if (requireAll) {
    if (list.length !== 64) errors.push(`cần đủ 64 quẻ (có ${list.length})`);
    const missing = Array.from({ length: 64 }, (_, i) => i + 1).filter((n) => !nums.includes(n));
    if (missing.length) errors.push(`thiếu quẻ: ${missing.join(', ')}`);
  }
  for (let i = 1; i < nums.length; i++)
    if (nums[i] <= nums[i - 1]) errors.push(`quẻ không theo thứ tự King Wen tại vị trí ${i}`);

  for (const h of list) {
    const p = `#${h.kingWenNumber}`;
    const expectedBin = hexagramBinary(h.kingWenNumber);
    if (h.binary !== expectedBin) errors.push(`${p}.binary: ${h.binary} ≠ ${expectedBin}`);
    const { lower, upper } = trigramsOf(h.kingWenNumber);
    if (h.lowerTrigram !== lower) errors.push(`${p}.lowerTrigram: ${h.lowerTrigram} ≠ ${lower}`);
    if (h.upperTrigram !== upper) errors.push(`${p}.upperTrigram: ${h.upperTrigram} ≠ ${upper}`);
    if (TRIGRAM_BINARY[h.lowerTrigram] + TRIGRAM_BINARY[h.upperTrigram] !== h.binary)
      errors.push(`${p}: lowerTrigram/upperTrigram không khớp binary`);
    const quote = /^“([^”]+)”/.exec(h.judgment)?.[1];
    if (!quote) errors.push(`${p}.judgment: cần mở đầu bằng phiên âm lời quẻ trong ngoặc kép`);
    else if (hanCount(h.judgmentHan) !== syllableCount(quote))
      errors.push(`${p}: số chữ Hán lời quẻ (${hanCount(h.judgmentHan)}) ≠ số âm tiết (${syllableCount(quote)})`);
    const useLabel = h.kingWenNumber === 1 ? 'Dụng cửu' : h.kingWenNumber === 2 ? 'Dụng lục' : null;
    if (!useLabel && h.allMoving) errors.push(`${p}.allMoving: chỉ Càn và Khôn có Dụng cửu / Dụng lục`);
    if (useLabel && requireAll && !h.allMoving) errors.push(`${p}.allMoving: thiếu ${useLabel}`);
    if (useLabel && h.allMoving) {
      if (!h.allMoving.original.startsWith(`${useLabel}:`)) errors.push(`${p}.allMoving.original: cần mở đầu bằng "${useLabel}:"`);
      const hanLabel = h.kingWenNumber === 1 ? '用九' : '用六';
      if (!h.allMoving.originalHan.startsWith(`${hanLabel}：`)) errors.push(`${p}.allMoving.originalHan: cần mở đầu bằng "${hanLabel}："`);
    }
    const opp = oppositeHexagram(h.kingWenNumber);
    if (h.oppositeHexagram !== opp) errors.push(`${p}.oppositeHexagram: ${h.oppositeHexagram} ≠ ${opp}`);

    h.lines.forEach((l, i) => {
      const lp = `${p}.lines[${i}]`;
      const pos = (i + 1) as LinePosition;
      if (l.position !== pos) errors.push(`${lp}.position: ${l.position} ≠ ${pos}`);
      const yy = lineYinYang(h.kingWenNumber, pos);
      if (l.yinYang !== yy) errors.push(`${lp}.yinYang: ${l.yinYang} ≠ ${yy}`);
      if (l.tier !== tierOfLine(pos)) errors.push(`${lp}.tier: ${l.tier} ≠ ${tierOfLine(pos)}`);
      const label = lineLabel(pos, yy);
      if (!l.original.normalize('NFC').startsWith(`${label}:`))
        errors.push(`${lp}.original: cần mở đầu bằng "${label}:" — "${l.original}"`);
      const labelHan = lineLabelHan(pos, yy);
      if (!l.originalHan.startsWith(`${labelHan}：`))
        errors.push(`${lp}.originalHan: cần mở đầu bằng "${labelHan}：" — "${l.originalHan}"`);
      else if (hanCount(l.originalHan.slice(labelHan.length + 1)) !== syllableCount(l.original.slice(label.length + 1)))
        errors.push(`${lp}: số chữ Hán (${hanCount(l.originalHan.slice(labelHan.length + 1))}) ≠ số âm tiết (${syllableCount(l.original.slice(label.length + 1))})`);
      if (!l.draft) errors.push(...completeLineErrors(lp, l));
      else if (requireComplete.includes(h.kingWenNumber)) errors.push(`${lp}: hào còn draft`);
    });
  }

  return errors;
}

export function validateTrigrams(raw: unknown): string[] {
  const parsed = z.array(trigramSchema).safeParse(raw);
  if (!parsed.success) return zodErrors('trigrams', parsed.error);
  const list: Trigram[] = parsed.data;
  const errors: string[] = [];
  if (list.length !== 8) errors.push(`cần đủ 8 quái (có ${list.length})`);
  const keys = list.map((t) => t.key);
  for (const k of TRIGRAM_KEYS) if (!keys.includes(k)) errors.push(`thiếu quái ${k}`);
  for (const t of list)
    if (t.binary !== TRIGRAM_BINARY[t.key]) errors.push(`${t.key}.binary: ${t.binary} ≠ ${TRIGRAM_BINARY[t.key]}`);
  return errors;
}

export function validateLineTiers(raw: unknown): string[] {
  const parsed = z.array(lineTierSchema).safeParse(raw);
  if (!parsed.success) return zodErrors('lineTiers', parsed.error);
  const list: LineTier[] = parsed.data;
  const errors: string[] = [];
  if (list.length !== 6) errors.push(`cần đủ 6 hào (có ${list.length})`);
  list.forEach((t, i) => {
    if (t.position !== i + 1) errors.push(`lineTiers[${i}].position: ${t.position} ≠ ${i + 1}`);
    if (t.tier !== tierOfLine(t.position)) errors.push(`lineTiers[${i}].tier sai`);
    for (const q of t.checklist)
      if (!q.question.trim().endsWith('?')) errors.push(`${q.id}: câu kiểm chứng cần kết thúc bằng "?"`);
  });
  const ids = list.flatMap((t) => t.checklist.map((q) => q.id));
  if (new Set(ids).size !== ids.length) errors.push('id câu kiểm chứng bị trùng');
  return errors;
}

/** Kinh & Truyện: đủ 64 quẻ theo thứ tự, Dụng cửu/Dụng lục chỉ ở Càn, Khôn, và phần tiếng Việt không trống. */
export function validateCommentary(raw: unknown): string[] {
  const parsed = z.array(hexagramCommentarySchema).safeParse(raw);
  if (!parsed.success) return zodErrors('commentary', parsed.error);
  const list: HexagramCommentary[] = parsed.data;
  const errors: string[] = [];
  if (list.length !== 64) errors.push(`cần đủ 64 quẻ (có ${list.length})`);
  const need = (where: string, p: CommentaryPart) => {
    for (const k of ['literal', 'image', 'explain'] as const) if (!p[k].trim()) errors.push(`${where}.${k} trống`);
  };
  list.forEach((c, i) => {
    const n = c.kingWenNumber;
    if (n !== i + 1) errors.push(`commentary[${i}]: quẻ ${n} sai thứ tự`);
    if (Boolean(c.allMoving) !== (n === 1 || n === 2)) errors.push(`quẻ ${n}: allMoving chỉ có ở Càn, Khôn`);
    need(`quẻ ${n}.judgment`, c.judgment);
    if (!c.judgment.tuan.trim()) errors.push(`quẻ ${n}.judgment.tuan trống`);
    c.lines.forEach((l, j) => need(`quẻ ${n}.hào ${j + 1}`, l));
    if (c.allMoving) need(`quẻ ${n}.allMoving`, c.allMoving);
    if (Boolean(c.wenyan) !== (n === 1 || n === 2)) errors.push(`quẻ ${n}: Văn ngôn chỉ có ở Càn, Khôn`);
    c.wenyan?.forEach((w, j) => {
      if (!w.title.trim()) errors.push(`quẻ ${n}.văn ngôn ${j + 1}.title trống`);
      if (!w.vi.trim()) errors.push(`quẻ ${n}.văn ngôn ${j + 1}.vi trống`);
      if (!w.explain.trim()) errors.push(`quẻ ${n}.văn ngôn ${j + 1}.explain trống`);
    });
  });
  return errors;
}
