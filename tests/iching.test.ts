import { describe, expect, it } from 'vitest';
import { TRIGRAM_KEYS, type LinePosition, type TrigramKey } from '../src/types/schema';
import {
  TRIGRAM_BINARY, distanceToStage, hexagramBinary, hexagramFromBinary, hexagramFromTrigrams,
  lineYinYang, linesOfTier, nextInSequence, oppositeHexagram, opposingLine, previousInSequence,
  reversedHexagram, tierOfLine, trigramsOf,
} from '../src/lib/iching';

const ALL = Array.from({ length: 64 }, (_, i) => i + 1);

describe('tám quái', () => {
  it('binary duy nhất, đúng hình tượng', () => {
    expect(new Set(Object.values(TRIGRAM_BINARY)).size).toBe(8);
    // Chấn: một dương ở dưới. Cấn: một dương ở trên. Đoài: một âm ở trên. Tốn: một âm ở dưới.
    expect(TRIGRAM_BINARY.zhen).toBe('100');
    expect(TRIGRAM_BINARY.gen).toBe('001');
    expect(TRIGRAM_BINARY.dui).toBe('110');
    expect(TRIGRAM_BINARY.xun).toBe('011');
  });
});

describe('ghép quái → King Wen (toàn bộ bảng 8×8)', () => {
  it('64 cặp cho 64 số khác nhau, phủ đủ 1..64', () => {
    const nums = TRIGRAM_KEYS.flatMap((i) => TRIGRAM_KEYS.map((o) => hexagramFromTrigrams(i, o)));
    expect(nums).toHaveLength(64);
    expect([...nums].sort((a, b) => a - b)).toEqual(ALL);
  });

  it('round-trip: số → quái → số, cho mọi quẻ', () => {
    for (const n of ALL) {
      const { lower, upper } = trigramsOf(n);
      expect(hexagramFromTrigrams(lower, upper)).toBe(n);
      expect(hexagramBinary(n)).toBe(TRIGRAM_BINARY[lower] + TRIGRAM_BINARY[upper]);
      expect(hexagramFromBinary(hexagramBinary(n))).toBe(n);
    }
  });

  // Đối chiếu độc lập: tên quẻ Hán Việt ↔ (nội quái, ngoại quái), theo Wikipedia.
  const SPOT: [number, string, TrigramKey, TrigramKey][] = [
    [1, 'Thuần Càn', 'qian', 'qian'], [2, 'Thuần Khôn', 'kun', 'kun'],
    [3, 'Thủy Lôi Truân', 'zhen', 'kan'], [4, 'Sơn Thủy Mông', 'kan', 'gen'],
    [5, 'Thủy Thiên Nhu', 'qian', 'kan'], [6, 'Thiên Thủy Tụng', 'kan', 'qian'],
    [7, 'Địa Thủy Sư', 'kan', 'kun'], [8, 'Thủy Địa Tỷ', 'kun', 'kan'],
    [11, 'Địa Thiên Thái', 'qian', 'kun'], [12, 'Thiên Địa Bĩ', 'kun', 'qian'],
    [17, 'Trạch Lôi Tùy', 'zhen', 'dui'], [18, 'Sơn Phong Cổ', 'xun', 'gen'],
    [28, 'Trạch Phong Đại Quá', 'xun', 'dui'], [29, 'Thuần Khảm', 'kan', 'kan'],
    [30, 'Thuần Ly', 'li', 'li'], [31, 'Trạch Sơn Hàm', 'gen', 'dui'],
    [32, 'Lôi Phong Hằng', 'xun', 'zhen'], [38, 'Hỏa Trạch Khuê', 'dui', 'li'],
    [42, 'Phong Lôi Ích', 'zhen', 'xun'], [49, 'Trạch Hỏa Cách', 'li', 'dui'],
    [50, 'Hỏa Phong Đỉnh', 'xun', 'li'], [51, 'Thuần Chấn', 'zhen', 'zhen'],
    [52, 'Thuần Cấn', 'gen', 'gen'], [57, 'Thuần Tốn', 'xun', 'xun'],
    [58, 'Thuần Đoài', 'dui', 'dui'], [61, 'Phong Trạch Trung Phu', 'dui', 'xun'],
    [62, 'Lôi Sơn Tiểu Quá', 'gen', 'zhen'], [63, 'Thủy Hỏa Ký Tế', 'li', 'kan'],
    [64, 'Hỏa Thủy Vị Tế', 'kan', 'li'],
  ];
  it.each(SPOT)('quẻ %i %s', (n, _name, inner, outer) => {
    expect(hexagramFromTrigrams(inner, outer)).toBe(n);
  });

  // Tính chất cấu trúc của thứ tự King Wen: mỗi cặp (2k−1, 2k) là quẻ đảo của
  // nhau; nếu quẻ đối xứng (đảo vẫn là chính nó) thì là quẻ bàng thông.
  it('tính chất cặp King Wen đúng cho cả 32 cặp', () => {
    for (let k = 1; k <= 32; k++) {
      const a = 2 * k - 1;
      const b = 2 * k;
      const rev = reversedHexagram(a);
      expect(b).toBe(rev === a ? oppositeHexagram(a) : rev);
    }
  });
});

describe('Tự quái', () => {
  it('trước / sau', () => {
    expect(previousInSequence(1)).toBeNull();
    expect(previousInSequence(4)).toBe(3);
    expect(nextInSequence(63)).toBe(64);
    expect(nextInSequence(64)).toBeNull();
  });
  it('từ chối số ngoài 1..64', () => {
    expect(() => previousInSequence(0)).toThrow(RangeError);
    expect(() => nextInSequence(65)).toThrow(RangeError);
    expect(() => hexagramBinary(2.5)).toThrow(RangeError);
  });
});

describe('bàng thông', () => {
  it.each([[1, 2], [3, 50], [4, 49], [5, 35], [6, 36], [7, 13], [8, 14], [11, 12], [29, 30], [63, 64], [27, 28], [61, 62]])(
    '%i ↔ %i', (a, b) => {
      expect(oppositeHexagram(a)).toBe(b);
      expect(oppositeHexagram(b)).toBe(a);
    },
  );
  it('là phép đối hợp, không có điểm bất động', () => {
    for (const n of ALL) {
      expect(oppositeHexagram(oppositeHexagram(n))).toBe(n);
      expect(oppositeHexagram(n)).not.toBe(n);
    }
  });
});

describe('hào', () => {
  it('hào đối 7 − n', () => {
    expect(([1, 2, 3, 4, 5, 6] as LinePosition[]).map(opposingLine)).toEqual([6, 5, 4, 3, 2, 1]);
  });
  it('tầng ↔ hào', () => {
    expect(([1, 2, 3, 4, 5, 6] as LinePosition[]).map(tierOfLine)).toEqual(
      ['earth', 'earth', 'human', 'human', 'heaven', 'heaven'],
    );
    for (const t of ['earth', 'human', 'heaven'] as const) {
      for (const l of linesOfTier(t)) expect(tierOfLine(l)).toBe(t);
    }
  });
  it('âm dương từng hào', () => {
    expect(lineYinYang(3, 1)).toBe('yang'); // Truân: hào 1 dương (Chấn)
    expect(lineYinYang(3, 2)).toBe('yin');
    expect(lineYinYang(3, 5)).toBe('yang'); // hào 5 dương (Khảm)
  });
  it('khoảng cách tới giai đoạn nhân chứng', () => {
    expect(distanceToStage(3, 'rising')).toBe(0);
    expect(distanceToStage(1, 'rising')).toBe(1);
    expect(distanceToStage(3, 'peak')).toBe(2);
    expect(distanceToStage(3, 'ending')).toBe(3);
  });
});
