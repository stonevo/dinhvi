import { z } from 'zod';
import {
  hexagramSchema, lineTierSchema, trigramSchema, TRIGRAM_KEYS,
  type Hexagram, type Line, type LinePosition, type LineTier, type Trigram,
} from '../types/schema';
import {
  TRIGRAM_BINARY, hexagramBinary, lineYinYang, oppositeHexagram, tierOfLine, trigramsOf,
} from '../lib/iching';
import { lintDocument } from '../lib/lint';

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

function zodErrors(prefix: string, err: z.ZodError): string[] {
  return err.issues.map((i) => `${prefix}${i.path.length ? '.' + i.path.join('.') : ''}: ${i.message}`);
}

function lintErrors(file: string, doc: unknown): string[] {
  return lintDocument(doc, file).map((v) => `${v.path}: ${v.rule} — "${v.text}"`);
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
      if (!l.draft) errors.push(...completeLineErrors(lp, l));
      else if (requireComplete.includes(h.kingWenNumber)) errors.push(`${lp}: hào còn draft`);
    });
  }

  errors.push(...lintErrors('hexagrams.json', list));
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
  errors.push(...lintErrors('trigrams.json', list));
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
  errors.push(...lintErrors('lineTiers.json', list));
  return errors;
}
