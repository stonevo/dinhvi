import { hexagramFromBinary } from './iching';

// Gieo quẻ bằng ba đồng xu. Đây là NƠI DUY NHẤT trong app dùng nguồn ngẫu nhiên
// (tests/no-randomness.test.ts kiểm điều này). Mọi hàm khác nhận "bit" từ ngoài
// vào nên kiểm thử được.

/** 6 = lão âm (động), 7 = thiếu dương, 8 = thiếu âm, 9 = lão dương (động). */
export type LineValue = 6 | 7 | 8 | 9;
export type BitSource = () => 0 | 1;

/** Một bit ngẫu nhiên không lệch, từ bộ sinh số mật mã của trình duyệt. */
export const cryptoBit: BitSource = () => {
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] & 1) as 0 | 1;
};

/** Tung ba đồng xu: mặt ngửa = 3, mặt sấp = 2; tổng 6..9. */
export function tossCoins(bit: BitSource = cryptoBit): { coins: (2 | 3)[]; value: LineValue } {
  const coins = [bit(), bit(), bit()].map((b) => (b ? 3 : 2) as 2 | 3);
  return { coins, value: (coins[0] + coins[1] + coins[2]) as LineValue };
}

export const isYang = (v: LineValue) => v === 7 || v === 9;
export const isMoving = (v: LineValue) => v === 6 || v === 9;

export type CastReading = {
  /** Quẻ chính (bản quẻ). */
  primary: number;
  /** Vị trí các hào động, 1..6 từ dưới lên. */
  moving: number[];
  /** Quẻ biến khi có hào động; null nếu không có. */
  transformed: number | null;
};

/** Đọc sáu giá trị hào (từ dưới lên) thành quẻ chính, hào động, quẻ biến. */
export function readCast(values: LineValue[]): CastReading {
  if (values.length !== 6) throw new RangeError(`Cần đủ 6 hào (có ${values.length})`);
  const primary = hexagramFromBinary(values.map((v) => (isYang(v) ? '1' : '0')).join(''));
  const moving = values.flatMap((v, i) => (isMoving(v) ? [i + 1] : []));
  const transformed = moving.length
    ? hexagramFromBinary(values.map((v) => (isMoving(v) ? !isYang(v) : isYang(v)) ? '1' : '0').join(''))
    : null;
  return { primary, moving, transformed };
}
