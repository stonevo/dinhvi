// Các ví dụ cổ ở 梅花易數 卷一 (zh.wikisource.org/wiki/梅花易數/卷一), chép đầu vào và quẻ theo sách.
// Phần lập quẻ (quái trên/dưới, hào động, hỗ, biến, Thể) phải khớp sách bằng quy tắc chung.
// Phần cát/hung: `verdict()` là quy ước của app; ví dụ nào sách đoán khác thì ghi chú, KHÔNG sửa engine cho khớp.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hexagramFromTrigrams } from '../src/lib/iching';
import { analyze, byNumbers, byObject, byTime, verdict, type MeihuaCast } from '../src/lib/meihua';
import { findTuong } from '../src/lib/meihuaTuong';
import { meihuaTuongSchema, type TrigramKey } from '../src/types/schema';

const G: Record<string, TrigramKey> = { 乾: 'qian', 兌: 'dui', 離: 'li', 震: 'zhen', 巽: 'xun', 坎: 'kan', 艮: 'gen', 坤: 'kun' };

interface Classic {
  id: string;
  title: string;
  cast: () => MeihuaCast;
  /** Theo sách: trên, dưới, hào động, hỗ [trên, dưới], biến [trên, dưới], Thể. */
  book: { upper: string; lower: string; moving: number; mutual: [string, string]; changed: [string, string]; the: string };
  /** Sách đoán thế nào (tóm tắt), và mức app tính ra. */
  bookOutcome: 'cat' | 'hung' | 'khong-luan';
  appLevel: string;
  note?: string;
}

const CLASSICS: Classic[] = [
  {
    id: 'quan-mai', title: '觀梅占',
    cast: () => byTime({ yearBranchNumber: 5, lunarMonth: 12, lunarDay: 17, hourBranchNumber: 9 }),
    book: { upper: '兌', lower: '離', moving: 1, mutual: ['乾', '巽'], changed: ['兌', '艮'], the: '兌' },
    bookOutcome: 'hung', appLevel: 'hung',
    note: 'Sách: cô gái ngã bị thương (用克體), nhưng biến Cấn sinh Thể nên không đến nỗi nặng.',
  },
  {
    id: 'mau-don', title: '牡丹占',
    cast: () => byTime({ yearBranchNumber: 6, lunarMonth: 3, lunarDay: 16, hourBranchNumber: 4 }),
    book: { upper: '乾', lower: '巽', moving: 5, mutual: ['乾', '乾'], changed: ['離', '巽'], the: '巽' },
    bookOutcome: 'hung', appLevel: 'dai-hung',
  },
  {
    id: 'lan-da-khau-mon', title: '鄰夜扣門借物占',
    // Hai loạt tiếng gõ 1 và 5 làm trên / dưới; hào = 1 + 5 + giờ Dậu 10.
    cast: () => byNumbers(1, 5, 10),
    book: { upper: '乾', lower: '巽', moving: 4, mutual: ['乾', '乾'], changed: ['巽', '巽'], the: '巽' },
    bookOutcome: 'khong-luan', appLevel: 'dai-hung',
    note: 'Sách không đoán cát hung, chỉ dùng tượng để đoán vật được hỏi mượn.',
  },
  {
    id: 'kim-nhat-dong-tinh', title: '今日動靜如何',
    // Sáu chữ: thanh điệu 今平1 日入4 動去3 = 8 (trên), 靜去3 如平1 何平1 = 5 (dưới); hào 13, không cộng giờ.
    // App chưa có bảng thanh điệu chữ Hán nên đưa thẳng hai tổng vào.
    cast: () => byNumbers(8, 5),
    book: { upper: '坤', lower: '巽', moving: 1, mutual: ['震', '兌'], changed: ['坤', '乾'], the: '坤' },
    bookOutcome: 'cat', appLevel: 'dai-hung',
    note: 'Sách (卷二 · 卦斷遺論) tự nói ví dụ này đoán theo tượng (có người mời ăn), không theo Thể – Dụng.',
  },
  {
    id: 'tay-lam-tu', title: '西林寺牌額占',
    // Sách đếm 西 7 nét, 林 8 nét. strokes.json (cách đếm hiện đại) cho 西 6 nét nên byText ra quẻ khác;
    // ở đây đưa thẳng số nét theo sách.
    cast: () => byNumbers(7, 8),
    book: { upper: '艮', lower: '坤', moving: 3, mutual: ['坤', '坤'], changed: ['艮', '艮'], the: '艮' },
    bookOutcome: 'hung', appLevel: 'cat',
    note: 'Sách (卷二 · 卦斷遺論): tỷ hòa (đều Thổ) mà vẫn đoán hung theo lý, không theo Thể – Dụng.',
  },
  {
    id: 'lao-nhan', title: '老人有憂色占',
    cast: () => byObject('qian', 'xun', 4), // người già = Càn, từ hướng Tốn, giờ Mão
    book: { upper: '乾', lower: '巽', moving: 4, mutual: ['乾', '乾'], changed: ['巽', '巽'], the: '巽' },
    bookOutcome: 'hung', appLevel: 'dai-hung',
    note: 'Sách không ghi quẻ biến; tính theo quy tắc ra 巽為風.',
  },
  {
    id: 'thieu-nien', title: '少年有喜色占',
    cast: () => byObject('gen', 'li', 7), // thiếu niên = Cấn, từ hướng Ly, giờ Ngọ
    book: { upper: '艮', lower: '離', moving: 5, mutual: ['震', '坎'], changed: ['巽', '離'], the: '離' },
    bookOutcome: 'cat', appLevel: 'binh',
    note: 'Sách (卦斷遺論): Thể sinh Dụng nhưng 互震、變巽 đều sinh Thể nên cát. Sách chỉ nêu hỗ Chấn, không tính hỗ Khảm (khắc Thể); app tính cả hai hỗ nên ra bình.',
  },
  {
    id: 'nguu-ai-minh', title: '牛哀鳴占',
    cast: () => byObject('kun', 'kan', 7), // trâu = Khôn, hướng Khảm, giờ Ngọ
    book: { upper: '坤', lower: '坎', moving: 3, mutual: ['坤', '震'], changed: ['坤', '巽'], the: '坤' },
    bookOutcome: 'hung', appLevel: 'hung',
  },
  {
    id: 'ke-bi-minh', title: '雞悲鳴占',
    cast: () => byObject('xun', 'qian', 4), // gà = Tốn, hướng Càn, giờ Mão
    book: { upper: '巽', lower: '乾', moving: 4, mutual: ['離', '兌'], changed: ['乾', '乾'], the: '乾' },
    bookOutcome: 'hung', appLevel: 'binh',
    note: 'Sách: Thể khắc Dụng nhưng 互離克體 nên đoán hung. App: Thể khắc Dụng +1, hỗ Ly khắc Thể −1, hỗ Đoài và biến Càn tỷ hòa → bình.',
  },
  {
    id: 'kho-chi', title: '枯枝墜地占',
    cast: () => byObject('li', 'dui', 5), // cành khô = Ly, hướng Đoài, giờ Thìn
    book: { upper: '離', lower: '兌', moving: 4, mutual: ['坎', '離'], changed: ['艮', '兌'], the: '兌' },
    bookOutcome: 'hung', appLevel: 'hung',
  },
];

describe('ví dụ cổ 卷一: lập quẻ khớp sách bằng quy tắc chung', () => {
  for (const c of CLASSICS) {
    it(`${c.title} (${c.id})`, () => {
      const cast = c.cast();
      const a = analyze(cast);
      const b = c.book;
      expect([cast.upper, cast.lower, cast.movingLine]).toEqual([G[b.upper], G[b.lower], b.moving]);
      expect([a.mutualUpper, a.mutualLower]).toEqual([G[b.mutual[0]], G[b.mutual[1]]]);
      expect(a.transformed).toBe(hexagramFromTrigrams(G[b.changed[1]], G[b.changed[0]]));
      expect(a.the.trigram).toBe(G[b.the]);
    });
  }
});

describe('ví dụ cổ: mức cát/hung của app (ghi lại, đối chiếu với sách)', () => {
  for (const c of CLASSICS) {
    it(`${c.title}: app ${c.appLevel}, sách ${c.bookOutcome}`, () => {
      expect(verdict(analyze(c.cast())).level).toBe(c.appLevel);
    });
  }

  it('mọi ví dụ app đoán khác sách đều có ghi chú', () => {
    const sign = (l: string) => (l.includes('cat') ? 'cat' : l.includes('hung') ? 'hung' : 'binh');
    for (const c of CLASSICS) {
      if (c.bookOutcome === 'khong-luan') continue;
      if (sign(c.appLevel) !== c.bookOutcome) expect(c.note, c.id).toBeTruthy();
    }
  });
});

describe('quẻ Thuần Càn / Thuần Khôn: 乾坤無互，互其變卦 (卷一 · 互卦起例)', () => {
  it('Thuần Càn hào 1 → hỗ lấy từ quẻ biến Thiên Phong Cấu (hỗ Càn/Càn)', () => {
    const a = analyze({ upper: 'qian', lower: 'qian', movingLine: 1 });
    expect(a.mutualOf).toBe('transformed');
    expect(a.transformed).toBe(44);
    expect([a.mutualUpper, a.mutualLower]).toEqual(['qian', 'qian']);
  });
  it('Thuần Khôn hào 3 → biến Địa Sơn Khiêm, hỗ của Khiêm: trên Chấn, dưới Khảm', () => {
    const a = analyze({ upper: 'kun', lower: 'kun', movingLine: 3 });
    expect(a.mutualOf).toBe('transformed');
    expect(a.transformed).toBe(15);
    expect([a.mutualUpper, a.mutualLower]).toEqual(['zhen', 'kan']);
  });
  it('quẻ khác vẫn lấy hỗ từ quẻ chính', () => {
    expect(analyze({ upper: 'dui', lower: 'li', movingLine: 1 }).mutualOf).toBe('primary');
  });
});

describe('byObject (Hậu thiên)', () => {
  it('dùng số Tiên thiên và cộng giờ: Càn 1 + Tốn 5 + Mão 4 = 10 → hào 4', () => {
    const c = byObject('qian', 'xun', 4);
    expect(c).toMatchObject({ method: 'houtian', upperSum: 1, lowerSum: 5, movingSum: 10, movingLine: 4 });
  });
  it('chi giờ ngoài 1–12 → RangeError', () => {
    expect(() => byObject('qian', 'xun', 0)).toThrow(RangeError);
  });
});

describe('ví dụ Hậu thiên: quái của vật tra được trong bảng 八卦萬物屬類', () => {
  const tuong = meihuaTuongSchema.parse(JSON.parse(readFileSync('public/data/meihua-tuong.json', 'utf8')));
  // Vật trong sách → quái sách dùng. 少年 không có nguyên chữ trong bảng: sách quy về Cấn (少男).
  it.each([
    ['老人', 'qian'],
    ['牛', 'kun'],
    ['雞', 'xun'],
    ['槁木', 'li'],
    ['少男', 'gen'],
  ] as const)('%s → %s (bảng ngắn)', (han, key) => {
    const hits = findTuong(tuong, han).filter((h) => h.category === 'short' && h.item.han === han);
    expect(hits.map((h) => h.trigram)).toEqual([key]);
  });
  it('tìm theo nghĩa tiếng Việt nháp', () => {
    expect(findTuong(tuong, 'quạt').some((h) => h.trigram === 'xun')).toBe(true);
  });
});
