import type { TrigramKey } from '../types/schema';

// Đồ hình Kinh Dịch: thứ tự và phương vị (nguồn: bài trong public/data/diagrams.json).
// Quy ước vẽ theo lối xưa: phương Nam ở trên, Đông bên trái.

export type Direction = 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE';

/** Thứ tự Tiên thiên: Càn 1, Đoài 2, Ly 3, Chấn 4, Tốn 5, Khảm 6, Cấn 7, Khôn 8. */
export const XIANTIAN_ORDER: readonly TrigramKey[] = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];

export const XIANTIAN_DIRECTION: Record<TrigramKey, Direction> = {
  qian: 'S', kun: 'N', li: 'E', kan: 'W', dui: 'SE', zhen: 'NE', xun: 'SW', gen: 'NW',
};

export const HOUTIAN_DIRECTION: Record<TrigramKey, Direction> = {
  li: 'S', kan: 'N', zhen: 'E', dui: 'W', xun: 'SE', kun: 'SW', qian: 'NW', gen: 'NE',
};

/** Góc (độ, SVG: 0 = phải, 90 = xuống) của mỗi phương khi Nam ở trên, Đông bên trái. */
export const DIRECTION_ANGLE: Record<Direction, number> = {
  S: -90, SW: -45, W: 0, NW: 45, N: 90, NE: 135, E: 180, SE: -135,
};

/**
 * Số thứ tự Phục Hy (Càn 1 … Khôn 64) của quẻ có `binary` (hào sơ → hào thượng,
 * 1 = dương): hào sơ là chữ số cao nhất.
 */
export function fuxiIndex(binary: string): number {
  return 64 - parseInt(binary, 2);
}

/** `binary` của quẻ thứ `i` (1..64) theo thứ tự Phục Hy. */
export function binaryOfFuxi(i: number): string {
  return (64 - i).toString(2).padStart(6, '0');
}

/**
 * Góc (độ, SVG) của quẻ thứ `i` trên vòng tròn: Càn ở đỉnh, 1→32 đi xuống bên
 * trái (qua phương Đông) tới Phục ở đáy; 33→64 từ Cấu ở đỉnh đi xuống bên phải tới Khôn.
 */
export function circleAngle(i: number): number {
  const step = 180 / 32;
  return i <= 32 ? -90 - (i - 0.5) * step : -90 + (i - 32 - 0.5) * step;
}

/**
 * Hình vuông 8×8: số thứ tự Phục Hy của ô hàng `r`, cột `c` (1..8, tính từ trên
 * xuống, từ trái sang). Khôn ở góc trên trái, Càn ở góc dưới phải.
 */
export function squareIndex(r: number, c: number): number {
  return 64 - (r - 1) * 8 - (c - 1);
}

/** Hà đồ: mỗi phương một cặp số sinh – thành. */
export const HETU: { dir: 'N' | 'S' | 'E' | 'W' | 'C'; inner: number; outer: number }[] = [
  { dir: 'N', inner: 1, outer: 6 },
  { dir: 'S', inner: 2, outer: 7 },
  { dir: 'E', inner: 3, outer: 8 },
  { dir: 'W', inner: 4, outer: 9 },
  { dir: 'C', inner: 5, outer: 10 },
];

/** Lạc thư: ô vuông 3×3 (Nam ở trên, Đông bên trái). */
export const LUOSHU: number[][] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];
