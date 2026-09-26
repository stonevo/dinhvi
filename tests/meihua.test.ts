import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  analyze,
  byNumber,
  byNumbers,
  byNumberString,
  byText,
  byTime,
  monthElementOfLunarMonth,
  movingLineFromNumber,
  quocNguLetterCount,
  relationToThe,
  seasonalStrength,
  trigramFromNumber,
} from '../src/lib/meihua';

// Số Tiên thiên: Càn 1, Đoài 2, Ly 3, Chấn 4, Tốn 5, Khảm 6, Cấn 7, Khôn 8.
const strokesJson = JSON.parse(readFileSync('public/data/strokes.json', 'utf8')) as Record<string, number>;
const strokes = (ch: string) => strokesJson[ch];

describe('chia dư', () => {
  it('mod 8 dư 0 → Khôn (8); mod 6 dư 0 → hào 6', () => {
    expect(trigramFromNumber(8)).toBe('kun');
    expect(trigramFromNumber(16)).toBe('kun');
    expect(trigramFromNumber(9)).toBe('qian');
    expect(movingLineFromNumber(6)).toBe(6);
    expect(movingLineFromNumber(12)).toBe(6);
    expect(movingLineFromNumber(7)).toBe(1);
  });

  it('byNumbers(16, 8): 16 mod 8 = 0 → Khôn, 8 → Khôn, 24 mod 6 = 0 → hào 6', () => {
    const c = byNumbers(16, 8);
    expect([c.upper, c.lower, c.movingLine]).toEqual(['kun', 'kun', 6]);
    // Khôn thuần (2), hào 6 đổi: 000000 → 000001 = Cấn trên Khôn = Bác (23).
    const a = analyze(c);
    expect(a.primary).toBe(2);
    expect(a.transformed).toBe(23);
  });
});

describe('byTime — ví dụ Quán mai (觀梅占) trong sách', () => {
  // Năm Thìn (5), tháng 12, ngày 17, giờ Thân (9).
  // Trên: 5 + 12 + 17 = 34; 34 mod 8 = 2 → Đoài.
  // Dưới: 34 + 9 = 43; 43 mod 8 = 3 → Ly.   Hào: 43 mod 6 = 1.
  // → Trạch Hỏa Cách (49), hào 1 động, biến Trạch Sơn Hàm (31), hỗ Thiên Phong Cấu (44).
  const c = byTime({ yearBranchNumber: 5, lunarMonth: 12, lunarDay: 17, hourBranchNumber: 9 });

  it('lập quẻ', () => {
    expect(c).toMatchObject({ method: 'time', upperSum: 34, lowerSum: 43, movingSum: 43 });
    expect([c.upper, c.lower, c.movingLine]).toEqual(['dui', 'li', 1]);
  });

  it('phân tích Thể/Dụng và đủ các quan hệ', () => {
    const a = analyze(c, { monthElement: 'tho' });
    expect([a.primary, a.transformed, a.mutual]).toEqual([49, 31, 44]);
    // Hào 1 ở quái dưới → Dụng = Ly (Hỏa), Thể = Đoài (Kim).
    expect(a.thePosition).toBe('upper');
    expect(a.the).toEqual({ trigram: 'dui', element: 'kim' });
    // Hỏa khắc Kim → Dụng khắc Thể.
    expect(a.dung.trigram).toBe('li');
    expect(a.dung.relation.key).toBe('dung-khac-the');
    expect(a.dung.relation.verdict).toBe('hung');
    // 101110: hỗ dưới = hào 2-4 "011" Tốn (Mộc): Kim khắc Mộc → Thể khắc Dụng.
    expect(a.mutualLowerRole.trigram).toBe('xun');
    expect(a.mutualLowerRole.relation.key).toBe('the-khac-dung');
    // hỗ trên = hào 3-5 "111" Càn (Kim): cùng Kim → Tỷ hòa.
    expect(a.mutualUpperRole.trigram).toBe('qian');
    expect(a.mutualUpperRole.relation.key).toBe('ty-hoa');
    // Biến: hào 1 đổi → quái dưới 001 Cấn (Thổ): Thổ sinh Kim → Dụng sinh Thể (cát lớn).
    expect(a.changed.trigram).toBe('gen');
    expect(a.changed.relation).toMatchObject({ key: 'dung-sinh-the', label: 'Dụng sinh Thể', verdict: 'cat-lon' });
    // Tháng Thổ sinh Kim → Thể tướng.
    expect(a.theStrength).toMatchObject({ key: 'tuong', label: 'Tướng' });
  });
});

describe('quan hệ Thể sinh Dụng', () => {
  it('byNumbers(6, 2, giờ Dần 3): Khảm trên, Đoài dưới, 6+2+3 = 11 mod 6 = 5', () => {
    const c = byNumbers(6, 2, 3);
    expect([c.upper, c.lower, c.movingLine]).toEqual(['kan', 'dui', 5]);
    const a = analyze(c);
    expect(a.primary).toBe(60); // Thủy Trạch Tiết
    // Hào 5 ở quái trên → Dụng = Khảm (Thủy), Thể = Đoài (Kim); Kim sinh Thủy.
    expect(a.thePosition).toBe('lower');
    expect(a.dung.relation).toMatchObject({ key: 'the-sinh-dung', verdict: 'hao' });
  });

  it('byNumbers không cộng giờ khi không truyền', () => {
    // 6 + 2 = 8 mod 6 = 2.
    expect(byNumbers(6, 2).movingLine).toBe(2);
  });

  it('relationToThe cho đủ năm loại', () => {
    expect(relationToThe('kim', 'tho').key).toBe('dung-sinh-the');
    expect(relationToThe('kim', 'moc').key).toBe('the-khac-dung');
    expect(relationToThe('kim', 'kim').key).toBe('ty-hoa');
    expect(relationToThe('kim', 'thuy').key).toBe('the-sinh-dung');
    expect(relationToThe('kim', 'hoa').key).toBe('dung-khac-the');
  });
});

describe('vượng tướng hưu tù tử', () => {
  it('Thể Kim theo từng hành tháng', () => {
    expect(seasonalStrength('kim', 'kim')).toBe('vuong');
    expect(seasonalStrength('kim', 'tho')).toBe('tuong');
    expect(seasonalStrength('kim', 'thuy')).toBe('huu');
    expect(seasonalStrength('kim', 'moc')).toBe('tu-imprisoned');
    expect(seasonalStrength('kim', 'hoa')).toBe('tu-dead');
  });

  it('hành tháng âm lịch', () => {
    expect([1, 3, 4, 7, 10, 12].map(monthElementOfLunarMonth)).toEqual(['moc', 'tho', 'hoa', 'kim', 'thuy', 'tho']);
  });
});

describe('byNumberString', () => {
  it('số điện thoại 10 chữ số', () => {
    // "0912345678": nửa đầu 0+9+1+2+3 = 15 → 15 mod 8 = 7 Cấn;
    // nửa sau 4+5+6+7+8 = 30 → 30 mod 8 = 6 Khảm; hào 45 mod 6 = 3.
    const c = byNumberString('091 234 5678');
    expect(c).toMatchObject({ method: 'number-string', upperSum: 15, lowerSum: 30, movingSum: 45 });
    expect([c.upper, c.lower, c.movingLine]).toEqual(['gen', 'kan', 3]);
    expect(analyze(c).primary).toBe(4); // Sơn Thủy Mông
    // Thêm giờ Tý (1): 46 mod 6 = 4.
    expect(byNumberString('0912345678', 1).movingLine).toBe(4);
  });

  it('độ dài lẻ: nửa đầu ngắn hơn', () => {
    // "12345": "12" = 3 Ly; "345" = 12 mod 8 = 4 Chấn; 15 mod 6 = 3 → Hỏa Lôi Phệ Hạp (21).
    const c = byNumberString('12345');
    expect([c.upper, c.lower, c.movingLine]).toEqual(['li', 'zhen', 3]);
    expect(analyze(c).primary).toBe(21);
  });

  it('một chữ số dùng lệ "một số" và cần giờ', () => {
    // 5 → Tốn; 5 + giờ Ngọ 7 = 12 mod 8 = 4 Chấn; 12 mod 6 = 0 → hào 6.
    const c = byNumberString('5', 7);
    expect(c.method).toBe('number-single');
    expect([c.upper, c.lower, c.movingLine]).toEqual(['xun', 'zhen', 6]);
    expect(byNumber(5, 7)).toMatchObject({ upper: 'xun', lower: 'zhen', movingLine: 6 });
    expect(() => byNumberString('5')).toThrow();
  });
});

describe('byText — chữ Hán', () => {
  it('2 chữ 梅花 (số nét lấy từ strokes.json)', () => {
    // 梅 11 → 11 mod 8 = 3 Ly; 花 8 → Khôn; hào 19 mod 6 = 1 → Hỏa Địa Tấn (35).
    expect([strokes('梅'), strokes('花')]).toEqual([11, 8]);
    const c = byText('梅花', { strokes });
    expect(c).toMatchObject({ method: 'text-han', upperSum: 11, lowerSum: 8, movingSum: 19 });
    expect([c.upper, c.lower, c.movingLine]).toEqual(['li', 'kun', 1]);
    expect(analyze(c).primary).toBe(35);
  });

  it('3 chữ 天地人: 1 chữ trên, 2 chữ dưới', () => {
    // 天 4 → Chấn; 地 6 + 人 2 = 8 → Khôn; 12 mod 6 = 0 → hào 6 → Lôi Địa Dự (16).
    const c = byText('天地人', { strokes });
    expect([c.upper, c.lower, c.movingLine]).toEqual(['zhen', 'kun', 6]);
    expect(analyze(c).primary).toBe(16);
  });

  it('1 chữ: nét trái/phải hoặc lệ giờ', () => {
    // 梅: trái 木 4, phải 每 7 → Chấn / Cấn, 11 mod 6 = 5.
    const lr = byText('梅', { singleCharLeftRight: [4, 7] });
    expect(lr).toMatchObject({ method: 'text-han-single-left-right', upper: 'zhen', lower: 'gen', movingLine: 5 });
    // 11 → Ly; 11 + giờ Tý 1 = 12 → Chấn; 12 mod 6 → hào 6.
    const h = byText('梅', { strokes, hourBranchNumber: 1 });
    expect(h).toMatchObject({ method: 'text-han-single-hour', upper: 'li', lower: 'zhen', movingLine: 6 });
    expect(() => byText('梅', { strokes })).toThrow();
  });

  it('báo lỗi khi thiếu số nét', () => {
    expect(() => byText('梅花')).toThrow();
  });
});

describe('byText — Quốc ngữ (chuyển thể)', () => {
  it('đếm chữ cái bỏ dấu', () => {
    expect(quocNguLetterCount('Nguyễn')).toBe(6);
    expect(quocNguLetterCount('Đức')).toBe(3);
    expect(quocNguLetterCount('Hưng')).toBe(4);
  });

  it('"Hưng Thịnh": Hung 4 → Chấn; Thinh 5 → Tốn; 9 mod 6 = 3 → Lôi Phong Hằng (32)', () => {
    const c = byText('Hưng Thịnh');
    expect(c.method).toBe('text-quocngu-adapted');
    expect(c.note).toMatch(/hiện đại/);
    expect(c.note).toMatch(/KHÔNG có trong sách/);
    expect([c.upper, c.lower, c.movingLine]).toEqual(['zhen', 'xun', 3]);
    expect(analyze(c).primary).toBe(32);
  });

  it('3 âm tiết: "Nguyễn Văn Đức" = 6 | 3 + 3 → Khảm / Khảm, 12 mod 6 → hào 6', () => {
    const c = byText('Nguyễn  Văn, Đức');
    expect([c.upperSum, c.lowerSum, c.movingSum]).toEqual([6, 6, 12]);
    expect([c.upper, c.lower, c.movingLine]).toEqual(['kan', 'kan', 6]);
  });

  it('thêm giờ vào hào động', () => {
    // "Mai Hoa": 3 | 3, hào 6 + giờ Ngọ 7 = 13 mod 6 = 1.
    expect(byText('Mai Hoa', { hourBranchNumber: 7 }).movingLine).toBe(1);
  });

  it('không nhận văn bản lẫn chữ Hán và Latinh', () => {
    expect(() => byText('梅 hoa', { strokes })).toThrow();
  });
});
