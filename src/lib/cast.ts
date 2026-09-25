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

/**
 * Đoạn nên đọc trước cho một lần gieo, theo quy tắc của Chu Hy (Dịch học khải mông):
 * - 0 hào động: lời quẻ chính.
 * - 1 hào động: lời hào đó.
 * - 2 hào động: lời hai hào đó ở quẻ chính, hào trên là chính.
 * - 3 hào động: lời quẻ chính và lời quẻ biến, quẻ chính là chính.
 * - 4 hào động: lời hai hào không động ở quẻ biến, hào dưới là chính.
 * - 5 hào động: lời hào không động ở quẻ biến.
 * - 6 hào động: Càn/Khôn đọc Dụng cửu/Dụng lục; quẻ khác đọc lời quẻ biến.
 */
export type CastFocus =
  | { kind: 'judgment'; hexagrams: number[] }
  | { kind: 'lines'; hexagram: number; lines: number[]; main: number }
  | { kind: 'allMoving'; hexagram: number };

export function castFocus({ primary, moving, transformed }: CastReading): CastFocus {
  const still = [1, 2, 3, 4, 5, 6].filter((p) => !moving.includes(p));
  switch (moving.length) {
    case 0:
      return { kind: 'judgment', hexagrams: [primary] };
    case 1:
    case 2:
      return { kind: 'lines', hexagram: primary, lines: moving, main: moving[moving.length - 1] };
    case 3:
      return { kind: 'judgment', hexagrams: [primary, transformed!] };
    case 4:
    case 5:
      return { kind: 'lines', hexagram: transformed!, lines: still, main: still[0] };
    default:
      return primary === 1 || primary === 2
        ? { kind: 'allMoving', hexagram: primary }
        : { kind: 'judgment', hexagrams: [transformed!] };
  }
}
