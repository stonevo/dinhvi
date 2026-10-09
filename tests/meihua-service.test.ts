import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HOUTIAN_DIRECTION } from '../src/lib/diagrams';
import { vnParts } from '../src/lib/lunar';
import { analyze, byCount, byManual, byTime, monthElementOfBranch, TRIGRAM_ELEMENT, verdict, XIANTIAN_NUMBER } from '../src/lib/meihua';
import { castMeihua, linesOfMeihua, meihuaRecordFields } from '../src/lib/meihuaService';
import { castRecordSchema } from '../src/types/schema';

describe('monthElementOfBranch (tháng theo tiết, chi 0 = Tý)', () => {
  it('Dần Mão Mộc, Tỵ Ngọ Hỏa, Thân Dậu Kim, Hợi Tý Thủy, Thìn Tuất Sửu Mùi Thổ', () => {
    const got = Array.from({ length: 12 }, (_, b) => monthElementOfBranch(b));
    expect(got).toEqual(['thuy', 'tho', 'moc', 'moc', 'tho', 'hoa', 'hoa', 'tho', 'kim', 'kim', 'tho', 'thuy']);
  });
  it('ngoài 0–11 → RangeError', () => {
    expect(() => monthElementOfBranch(12)).toThrow(RangeError);
    expect(() => monthElementOfBranch(-1)).toThrow(RangeError);
  });
});

describe('byManual', () => {
  it('Đoài trên Ly dưới, hào 1 → giống quẻ Quán mai lập theo thời gian', () => {
    const m = analyze(byManual('dui', 'li', 1), { monthElement: 'tho' });
    const t = analyze(byTime({ yearBranchNumber: 5, lunarMonth: 12, lunarDay: 17, hourBranchNumber: 9 }), { monthElement: 'tho' });
    expect(m.primary).toBe(t.primary);
    expect(m.transformed).toBe(t.transformed);
    expect(m.mutual).toBe(t.mutual);
    expect(m.the).toEqual(t.the);
    expect(byManual('dui', 'li', 1).method).toBe('manual');
  });
});

describe('verdict (quy ước của app, không phải lời sách)', () => {
  it('Quán mai: Dụng khắc Thể −2, hỗ trên Tỷ hòa 0, hỗ dưới Thể khắc Dụng 0, biến Dụng sinh Thể +1, Thể tướng +1 → bình', () => {
    const v = verdict(analyze(byManual('dui', 'li', 1), { monthElement: 'tho' }));
    expect(v.factors.map((f) => [f.code, f.effect])).toEqual([
      ['DUNG:dung-khac-the', -2],
      ['HO_TREN:ty-hoa', 0],
      ['HO_DUOI:the-khac-dung', 0],
      ['BIEN:dung-sinh-the', 1],
      ['THE:tuong', 1],
    ]);
    expect(v.score).toBe(0);
    expect(v.level).toBe('binh');
  });
  it('không truyền tháng → không có yếu tố vượng suy', () => {
    const v = verdict(analyze(byManual('dui', 'li', 1)));
    expect(v.factors.some((f) => f.role === 'the-vuong-suy')).toBe(false);
  });
  it('mức theo điểm: Khôn trên Càn dưới hào 1 (Thể Khôn Thổ, Dụng Càn Kim: Thể sinh Dụng)', () => {
    const v = verdict(analyze(byManual('kun', 'qian', 1), { monthElement: 'hoa' }));
    expect(v.factors[0].code).toBe('DUNG:the-sinh-dung');
    expect(['dai-cat', 'cat', 'binh', 'hung', 'dai-hung']).toContain(v.level);
  });
});

describe('castMeihua', () => {
  // 10/2/2024 15:00 giờ VN: mùng 1 Tết Giáp Thìn, giờ Thân, sau Lập xuân (tháng Dần, Mộc).
  // Trên 5+1+1 = 7 Cấn; dưới 7+9 = 16 → Khôn; hào 16 mod 6 = 4.
  const at = new Date('2024-02-10T08:00:00Z');

  it('theo thời gian dùng lịch Việt Nam', () => {
    const r = castMeihua({ method: 'time' }, at);
    expect(r.calendar.lunar).toMatchObject({ day: 1, month: 1 });
    expect([r.cast.upper, r.cast.lower, r.cast.movingLine]).toEqual(['gen', 'kun', 4]);
    expect(r.analysis.primary).toBe(23); // Sơn Địa Bác
    expect(r.analysis.transformed).toBe(35); // Hỏa Địa Tấn
    expect(r.analysis.the.trigram).toBe('kun');
    expect(r.analysis.theStrength?.key).toBe('tu-dead'); // Thổ mùa xuân: tử
    expect(r.verdict.factors.length).toBeGreaterThan(0);
  });

  it('mùa lấy theo chi tháng của vnParts', () => {
    const p = vnParts(at, { ziStartsNextDay: true });
    expect(monthElementOfBranch(p.monthCanChi.branch)).toBe('moc');
  });

  it('hai số, có/không cộng giờ', () => {
    expect(castMeihua({ method: 'numbers', a: 16, b: 8 }, at).cast.movingLine).toBe(6);
    expect(castMeihua({ method: 'numbers', a: 16, b: 8, withHour: true }, at).cast.movingLine).toBe((24 + 9) % 6 || 6);
  });

  it('nhập tay và chữ Quốc ngữ chạy qua cùng một cửa', () => {
    expect(castMeihua({ method: 'manual', upper: 'dui', lower: 'li', movingLine: 1 }, at).analysis.primary).toBe(49);
    expect(castMeihua({ method: 'text', text: 'Định Vị' }, at).inputLabel).toBe('Định Vị');
  });
});

describe('byCount (物數占: quái dưới chỉ là giờ)', () => {
  it('5 vật, giờ Thân 9: trên 5 Tốn, dưới 9 → Càn, hào 14 mod 6 = 2', () => {
    const c = byCount(5, 9);
    expect([c.upper, c.lower, c.movingLine, c.method]).toEqual(['xun', 'qian', 2, 'count']);
  });
  it('qua castMeihua: count và object', () => {
    const at = new Date('2024-02-10T08:00:00Z'); // giờ Thân
    expect(castMeihua({ method: 'count', n: 5 }, at).cast.lower).toBe('qian');
    expect(castMeihua({ method: 'object', object: 'qian', direction: 'xun' }, at).cast.movingSum).toBe(1 + 5 + 9);
  });
});

describe('trigrams.json: trường Mai Hoa đủ và khớp hằng số trong code', () => {
  const list = JSON.parse(readFileSync('public/data/trigrams.json', 'utf8')) as Array<{ key: keyof typeof XIANTIAN_NUMBER; xiantianNumber: number; element: string; houtianDirection: string }>;
  it.each(list.map((t) => [t.key, t] as const))('%s', (_k, t) => {
    expect(t.xiantianNumber).toBe(XIANTIAN_NUMBER[t.key]);
    expect(t.element).toBe(TRIGRAM_ELEMENT[t.key]);
    expect(t.houtianDirection).toBe(HOUTIAN_DIRECTION[t.key]);
  });
});

describe('lưu lịch sử: trường meihua tuỳ chọn, tương thích ngược', () => {
  const at = new Date('2024-02-10T08:00:00Z');
  const base = { id: 'x', createdAt: at.toISOString(), question: 'q', notes: '' };

  it('bản ghi cũ (không có meihua) vẫn hợp lệ', () => {
    const old = { ...base, lines: [7, 7, 7, 7, 7, 9], primary: 1, moving: [6], transformed: 43, method: 'meihua-time', methodInput: 'x' };
    expect(castRecordSchema.parse(old).meihua).toBeUndefined();
  });

  it('bản ghi mới từ castMeihua qua được schema, đủ dữ liệu dựng lại', () => {
    const input = { method: 'object', object: 'qian', direction: 'xun' } as const;
    const r = castMeihua(input, at);
    const rec = castRecordSchema.parse({ ...base, ...meihuaRecordFields(r, input) });
    expect(rec.method).toBe('meihua-number');
    expect(rec.meihua).toMatchObject({ method: 'object', upper: 'qian', lower: 'xun', the: r.analysis.the.trigram, mutualOf: 'primary' });
    expect(rec.meihua?.verdict.codes[0]).toMatch(/^DUNG:/);
    expect(rec.lines).toEqual(linesOfMeihua(r.cast));
    expect(rec.moving).toEqual([r.cast.movingLine]);
  });

  it('linesOfMeihua: Đoài/Ly hào 1 → [9 hoặc 6 ở hào 1, …]', () => {
    // Cách 49: nhị phân dưới lên 101110; hào 1 dương động → 9.
    expect(linesOfMeihua({ upper: 'dui', lower: 'li', movingLine: 1 })).toEqual([9, 8, 7, 7, 7, 8]);
  });
});
