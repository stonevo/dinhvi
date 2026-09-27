import type { LineValue } from './cast';

// Phép bói cỏ thi (đại diễn): Hệ từ thượng ch.9 và cách làm theo Chu Hy — xem bài
// Nhập môn `co-thi`. Nguồn ngẫu nhiên (chỗ chia bó) nhận từ ngoài vào để kiểm thử được.

/** Số cọng dùng: đại diễn 50, bỏ 1, dùng 49. */
export const YARROW_TOTAL = 49;

/**
 * Chọn số cọng tay trái khi chia bó `total` cọng; kết quả trong [1, total − 2].
 * Nguồn chỉ nói "chia làm hai" (中分); khoảng này là quy ước của app.
 */
export type SplitSource = (total: number) => number;

/** Một biến: chia hai, kẹp 1 cọng bên phải, đếm từng 4, giữ phần dư. */
export type YarrowChange = {
  before: number;
  left: number;
  right: number;
  /** Phần dư khi đếm từng 4 (1..4; chia hết thì 4). */
  leftRest: number;
  rightRest: number;
  /** Số cọng rút ra = 1 (kẹp) + hai phần dư. */
  removed: number;
  after: number;
};

const rest = (n: number) => (n % 4 === 0 ? 4 : n % 4);

export function yarrowChange(total: number, split: SplitSource): YarrowChange {
  const left = split(total);
  if (!Number.isInteger(left) || left < 1 || left > total - 2) throw new Error(`chia bó không hợp lệ: ${left}/${total}`);
  const right = total - left;
  const leftRest = rest(left);
  const rightRest = rest(right - 1);
  const removed = 1 + leftRest + rightRest;
  return { before: total, left, right, leftRest, rightRest, removed, after: total - removed };
}

/** Giá trị hào sau ba biến: số cọng còn lại chia 4. */
export function lineFromChanges(changes: YarrowChange[]): LineValue {
  if (changes.length !== 3) throw new Error('một hào cần đúng ba biến');
  return (changes[2].after / 4) as LineValue;
}
