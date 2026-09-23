import { TRIGRAM_KEYS, type LinePosition, type Tier, type TrigramKey } from '../types/schema';

// Cấu trúc thuần của Kinh Dịch. Mọi binary đọc từ hào dưới lên, '1' = dương.

export const TRIGRAM_BINARY: Record<TrigramKey, string> = {
  qian: '111',
  dui: '110',
  li: '101',
  zhen: '100',
  xun: '011',
  kan: '010',
  gen: '001',
  kun: '000',
};

const BINARY_TO_TRIGRAM = Object.fromEntries(
  Object.entries(TRIGRAM_BINARY).map(([k, b]) => [b, k as TrigramKey]),
) as Record<string, TrigramKey>;

// Bảng King Wen: hàng = quái trên, cột = quái dưới.
const KW_ORDER: TrigramKey[] = ['qian', 'zhen', 'kan', 'gen', 'kun', 'xun', 'li', 'dui'];
const KW_TABLE: number[][] = [
  /* trên Càn  */ [1, 25, 6, 33, 12, 44, 13, 10],
  /* trên Chấn */ [34, 51, 40, 62, 16, 32, 55, 54],
  /* trên Khảm */ [5, 3, 29, 39, 8, 48, 63, 60],
  /* trên Cấn  */ [26, 27, 4, 52, 23, 18, 22, 41],
  /* trên Khôn */ [11, 24, 7, 15, 2, 46, 36, 19],
  /* trên Tốn  */ [9, 42, 59, 53, 20, 57, 37, 61],
  /* trên Ly   */ [14, 21, 64, 56, 35, 50, 30, 38],
  /* trên Đoài */ [43, 17, 47, 31, 45, 28, 49, 58],
];

const NUMBER_TO_BINARY: string[] = new Array(65).fill('');
const BINARY_TO_NUMBER = new Map<string, number>();
for (const upper of TRIGRAM_KEYS) {
  for (const lower of TRIGRAM_KEYS) {
    const n = KW_TABLE[KW_ORDER.indexOf(upper)][KW_ORDER.indexOf(lower)];
    const bin = TRIGRAM_BINARY[lower] + TRIGRAM_BINARY[upper];
    NUMBER_TO_BINARY[n] = bin;
    BINARY_TO_NUMBER.set(bin, n);
  }
}

export function assertHexagramNumber(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > 64) throw new RangeError(`Số quẻ không hợp lệ: ${n}`);
}

/**
 * Bước 2: quái bên trong (nội quái, quái dưới) + hoàn cảnh bên ngoài
 * (ngoại quái, quái trên) → số quẻ King Wen.
 */
export function hexagramFromTrigrams(inner: TrigramKey, outer: TrigramKey): number {
  return BINARY_TO_NUMBER.get(TRIGRAM_BINARY[inner] + TRIGRAM_BINARY[outer])!;
}

export function hexagramBinary(n: number): string {
  assertHexagramNumber(n);
  return NUMBER_TO_BINARY[n];
}

export function hexagramFromBinary(bin: string): number {
  const n = BINARY_TO_NUMBER.get(bin);
  if (n === undefined) throw new RangeError(`Binary không hợp lệ: ${bin}`);
  return n;
}

export function trigramsOf(n: number): { lower: TrigramKey; upper: TrigramKey } {
  const bin = hexagramBinary(n);
  return { lower: BINARY_TO_TRIGRAM[bin.slice(0, 3)], upper: BINARY_TO_TRIGRAM[bin.slice(3)] };
}

export function trigramFromBinary(bin: string): TrigramKey {
  const k = BINARY_TO_TRIGRAM[bin];
  if (!k) throw new RangeError(`Binary quái không hợp lệ: ${bin}`);
  return k;
}

/** Tự quái: quẻ đứng trước trong thứ tự King Wen (quẻ 1 không có). */
export function previousInSequence(n: number): number | null {
  assertHexagramNumber(n);
  return n === 1 ? null : n - 1;
}

export function nextInSequence(n: number): number | null {
  assertHexagramNumber(n);
  return n === 64 ? null : n + 1;
}

/** Quẻ bàng thông (thác quái): đảo toàn bộ âm dương của sáu hào. */
export function oppositeHexagram(n: number): number {
  const inverted = [...hexagramBinary(n)].map((c) => (c === '1' ? '0' : '1')).join('');
  return BINARY_TO_NUMBER.get(inverted)!;
}

/** Quẻ đảo (tổng quái): lật ngược quẻ từ trên xuống. */
export function reversedHexagram(n: number): number {
  return BINARY_TO_NUMBER.get([...hexagramBinary(n)].reverse().join(''))!;
}

/** Hào đối trong cùng quẻ: 7 − n. */
export function opposingLine(line: LinePosition): LinePosition {
  return (7 - line) as LinePosition;
}

export function lineYinYang(n: number, line: LinePosition): 'yin' | 'yang' {
  return hexagramBinary(n)[line - 1] === '1' ? 'yang' : 'yin';
}

export function tierOfLine(line: LinePosition): Tier {
  return line <= 2 ? 'earth' : line <= 4 ? 'human' : 'heaven';
}

export function linesOfTier(tier: Tier): [LinePosition, LinePosition] {
  return tier === 'earth' ? [1, 2] : tier === 'human' ? [3, 4] : [5, 6];
}

// ---------- Giai đoạn theo lời nhân chứng ↔ hào ----------

export type WitnessStage = 'beginning' | 'rising' | 'peak' | 'turning' | 'declining' | 'ending';

/**
 * Khoảng hào tương ứng với giai đoạn một người ngoài mô tả. Quy ước (có thể
 * sửa): mới vào = 1; đang lên = 2–4 (có chỗ đứng → chuyển tiếp → gần quyền);
 * đỉnh = 5; đang chuyển / đang xuống / đang ra = 6 (qua đỉnh).
 */
export const STAGE_LINE_RANGE: Record<WitnessStage, [number, number]> = {
  beginning: [1, 1],
  rising: [2, 4],
  peak: [5, 5],
  turning: [6, 6],
  declining: [6, 6],
  ending: [6, 6],
};

/** Khoảng cách từ một hào tới khoảng hào của giai đoạn (0 nếu nằm trong). */
export function distanceToStage(line: number, stage: WitnessStage): number {
  const [lo, hi] = STAGE_LINE_RANGE[stage];
  return line < lo ? lo - line : line > hi ? line - hi : 0;
}
