import { describe, expect, it } from 'vitest';
import type { LineValue } from '../src/lib/cast';
import { hexagramFromTrigrams } from '../src/lib/iching';
import {
  BRANCH_HANZI,
  PALACE_ORDER,
  hiddenSpirits,
  liuyaoChart,
  mutualHexagram,
  najia,
  palaceOf,
  palaceSequence,
  sixSpirits,
  voidBranches,
} from '../src/lib/liuyao';
import type { TrigramKey } from '../src/types/schema';

// Nguồn: Chu Hy, 周易本義 (Chu Dịch bản nghĩa), phần 卦歌 — "分宫卦象次序"
// (bản Văn Uyên Các, Kanripo KR1a0032_000, tờ 16b–17a). Chép nguyên văn tên quẻ.
const PALACE_VERSE = `
乾為天　　天風姤　　天山遯　　天地否　　風地觀　　山地剥　　火地晋　　火天大有
坎為水　　水澤節　　水雷屯　　水火既濟　澤火革　　雷火豐　　地火明夷　地水師
艮為山　　山火賁　　山天大畜　山澤損　　火澤睽　　天澤履　　風澤中孚　風山漸
震為雷　　雷地豫　　雷水解　　雷風恒　　地風升　　水風井　　澤風大過　澤雷隨
巽為風　　風天小畜　風火家人　風雷益　　天雷无妄　火雷噬嗑　山雷頥　　山風蠱
離為火　　火山旅　　火風鼎　　火水未濟　山水䝉　　風水渙　　天水訟　　天火同人
坤為地　　地雷復　　地澤臨　　地天泰　　雷天大壯　澤天夬　　水天需　　水地比
兌為澤　　澤水困　　澤地萃　　澤山咸　　水山蹇　　地山謙　　雷山小過　雷澤歸妹
`;

const IMAGE: Record<string, TrigramKey> = {
  天: 'qian', 澤: 'dui', 火: 'li', 雷: 'zhen', 風: 'xun', 水: 'kan', 山: 'gen', 地: 'kun',
};
const NAME: Record<string, TrigramKey> = {
  乾: 'qian', 兌: 'dui', 離: 'li', 震: 'zhen', 巽: 'xun', 坎: 'kan', 艮: 'gen', 坤: 'kun',
};

/** Tên quẻ → số King Wen: "X為Y" là quẻ thuần; còn lại hai chữ đầu là tượng quái trên, quái dưới. */
function verseNameToNumber(name: string): number {
  if (name[1] === '為') {
    const t = NAME[name[0]];
    return hexagramFromTrigrams(t, t);
  }
  return hexagramFromTrigrams(IMAGE[name[1]], IMAGE[name[0]]);
}

const verseRows = PALACE_VERSE.trim()
  .split('\n')
  .map((row) => row.split(/\s+/u).filter(Boolean).map(verseNameToNumber));

const moving = (lines: LineValue[]) => lines;
const still = (bin: string): LineValue[] => [...bin].map((c) => (c === '1' ? 7 : 8));

describe('bát cung', () => {
  it('thứ tự 64 quẻ trong tám cung khớp "分宫卦象次序" của Chu Hy', () => {
    expect(verseRows).toHaveLength(8);
    expect(verseRows.flat()).toHaveLength(64);
    expect(new Set(verseRows.flat()).size).toBe(64);
    expect(PALACE_ORDER.map(palaceSequence)).toEqual(verseRows);
    verseRows.forEach((row, p) =>
      row.forEach((n, i) => {
        const info = palaceOf(n);
        expect(info.trigram).toBe(PALACE_ORDER[p]);
        expect(info.index).toBe(i);
      }),
    );
  });

  it('thế, ứng theo đời quẻ', () => {
    const shiYing = (n: number) => [palaceOf(n).generation, palaceOf(n).shi, palaceOf(n).ying];
    expect(shiYing(1)).toEqual(['pure', 6, 3]);
    expect(shiYing(44)).toEqual(['gen1', 1, 4]);
    expect(shiYing(12)).toEqual(['gen3', 3, 6]);
    expect(shiYing(23)).toEqual(['gen5', 5, 2]);
    expect(shiYing(35)).toEqual(['wandering', 4, 1]);
    expect(shiYing(14)).toEqual(['returning', 3, 6]);
    expect(palaceOf(8).trigram).toBe('kun'); // Thủy Địa Tỷ: Khôn quy hồn
    expect(palaceOf(8).elementLabel).toBe('Thổ');
  });
});

describe('nạp giáp, lục thân, phục thần — Thiên Phong Cấu (44)', () => {
  const chart = liuyaoChart({ lines: still('011111'), day: { stem: 0, branch: 0 }, month: { stem: 2, branch: 2 } });

  it('cung Càn Kim, Thế 1 Ứng 4', () => {
    expect(chart.primary.number).toBe(44);
    expect(chart.palace.label).toBe('Càn');
    expect(chart.palace.elementLabel).toBe('Kim');
    expect(chart.lines.filter((l) => l.shi).map((l) => l.position)).toEqual([1]);
    expect(chart.lines.filter((l) => l.ying).map((l) => l.position)).toEqual([4]);
  });

  it('chi các hào 丑亥酉午申戌 và lục thân', () => {
    expect(najia(44).map((l) => BRANCH_HANZI[l.branch]).join('')).toBe('丑亥酉午申戌');
    expect(chart.lines.map((l) => l.hanzi)).toEqual(['辛丑', '辛亥', '辛酉', '壬午', '壬申', '壬戌']);
    expect(chart.lines.map((l) => l.liuqinLabel)).toEqual([
      'Phụ Mẫu', 'Tử Tôn', 'Huynh Đệ', 'Quan Quỷ', 'Huynh Đệ', 'Phụ Mẫu',
    ]);
  });

  it('thiếu Thê Tài → phục thần Dần Mộc dưới hào 2 (phi thần Hợi Thủy Tử Tôn)', () => {
    expect(chart.missing.map((m) => m.key)).toEqual(['wealth']);
    expect(chart.hidden).toHaveLength(1);
    const h = chart.hidden[0];
    expect(h).toMatchObject({ liuqin: 'wealth', position: 2, stem: 0, branch: 2, element: 'wood' });
    expect(h.flying).toMatchObject({ liuqin: 'child', branch: 11 });
    expect(chart.lines[1].hidden).toEqual([h]);
    expect(hiddenSpirits(1)).toEqual([]);
  });

  it('nhật thần, nguyệt lệnh, không vong trên từng hào (ngày Giáp Tý, tháng Bính Dần)', () => {
    expect(chart.day.label).toBe('Giáp Tý');
    expect(chart.void.labels).toEqual(['Tuất', 'Hợi']);
    expect(chart.lines.map((l) => l.void)).toEqual([false, true, false, false, false, true]);
    expect(chart.lines[3].day.relation).toBe('khac'); // Thủy khắc Hỏa
    expect(chart.lines[1].day.relation).toBe('tyhoa');
    expect(chart.lines[2].day.relation).toBe('tiet'); // Kim sinh Thủy
    expect(chart.lines[0].month.relation).toBe('khac'); // Mộc khắc Thổ
    expect(chart.lines[3].month.relation).toBe('sinh'); // Mộc sinh Hỏa
    expect(chart.lines[4].month.relation).toBe('hao'); // Kim khắc Mộc
  });
});

describe('lục thần', () => {
  it('ngày Giáp bắt đầu Thanh Long', () => {
    expect(sixSpirits(0)).toEqual(['greenDragon', 'vermilionBird', 'hookChen', 'soaringSnake', 'whiteTiger', 'blackTortoise']);
  });
  it('ngày Nhâm bắt đầu Huyền Vũ', () => {
    const chart = liuyaoChart({ lines: still('111111'), day: { stem: 8, branch: 0 }, month: { stem: 0, branch: 0 } });
    expect(chart.lines.map((l) => l.spiritLabel)).toEqual([
      'Huyền Vũ', 'Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ',
    ]);
  });
  it('Mậu → Câu Trần, Kỷ → Đằng Xà, Tân → Bạch Hổ, Đinh → Chu Tước', () => {
    expect([4, 5, 7, 3].map((s) => sixSpirits(s)[0])).toEqual(['hookChen', 'soaringSnake', 'whiteTiger', 'vermilionBird']);
  });
});

describe('không vong', () => {
  it('theo tuần giáp', () => {
    expect(voidBranches({ stem: 0, branch: 0 })).toEqual([10, 11]); // Giáp Tý → Tuất Hợi
    expect(voidBranches({ stem: 6, branch: 6 })).toEqual([10, 11]); // Canh Ngọ cùng tuần
    expect(voidBranches({ stem: 0, branch: 10 })).toEqual([8, 9]); // Giáp Tuất → Thân Dậu
    expect(voidBranches({ stem: 9, branch: 11 })).toEqual([0, 1]); // Quý Hợi (tuần Giáp Dần) → Tý Sửu
  });
  it('từ chối can chi lệch âm dương', () => {
    expect(() => voidBranches({ stem: 0, branch: 1 })).toThrow();
  });
});

describe('quẻ hỗ', () => {
  it('hào 2-4 dưới, 3-5 trên', () => {
    expect(mutualHexagram(1)).toBe(1);
    expect(mutualHexagram(2)).toBe(2);
    expect(mutualHexagram(44)).toBe(1); // Cấu hỗ Càn
    expect(mutualHexagram(63)).toBe(64); // Ký Tế hỗ Vị Tế
    expect(mutualHexagram(3)).toBe(23); // Truân hỗ Bác
    expect(mutualHexagram(11)).toBe(54); // Thái hỗ Quy Muội
  });
});

describe('hào động', () => {
  it('Càn động hào 1 → Cấu: hào hóa Tân Sửu Thổ, lục thân theo cung Càn', () => {
    const chart = liuyaoChart({ lines: moving([9, 7, 7, 7, 7, 7]), day: { stem: 0, branch: 0 }, month: { stem: 0, branch: 0 } });
    expect(chart.primary.number).toBe(1);
    expect(chart.transformed?.number).toBe(44);
    expect(chart.moving).toEqual([1]);
    expect(chart.lines[0].hanzi).toBe('甲子');
    expect(chart.lines[0].liuqinLabel).toBe('Tử Tôn');
    expect(chart.lines[0].changed).toMatchObject({ yang: false, hanzi: '辛丑', liuqin: 'parent', liuqinLabel: 'Phụ Mẫu' });
    expect(chart.lines.slice(1).every((l) => l.changed === null)).toBe(true);
  });

  it('lục thân hào hóa theo cung quẻ chính, không theo cung quẻ biến', () => {
    // Cấu (Càn Kim) động hào 4 → Tốn (cung Tốn Mộc). Hào 4 hóa Tân Mùi Thổ:
    // theo Càn Kim là Phụ Mẫu (theo Tốn Mộc sẽ là Thê Tài).
    const chart = liuyaoChart({ lines: moving([8, 7, 7, 9, 7, 7]), day: { stem: 0, branch: 0 }, month: { stem: 0, branch: 0 } });
    expect(chart.transformed?.number).toBe(57);
    expect(chart.transformed?.palace.trigram).toBe('xun');
    expect(chart.lines[3].changed).toMatchObject({ hanzi: '辛未', liuqin: 'parent' });
  });

  it('không hào động → không có quẻ biến', () => {
    const chart = liuyaoChart({ lines: still('111111'), day: { stem: 0, branch: 0 }, month: { stem: 0, branch: 0 } });
    expect(chart.transformed).toBeNull();
    expect(JSON.parse(JSON.stringify(chart))).toEqual(chart);
  });
});

describe('dụng thần', () => {
  const base = { lines: still('011111'), day: { stem: 0, branch: 0 }, month: { stem: 0, branch: 0 } };
  it('theo chủ đề', () => {
    expect(liuyaoChart({ ...base, topic: 'work' }).useGod).toMatchObject({ key: 'officer', positions: [4] });
    const money = liuyaoChart({ ...base, topic: 'money' }).useGod!;
    expect(money.key).toBe('wealth');
    expect(money.positions).toEqual([]);
    expect(money.hidden[0].position).toBe(2);
    expect(liuyaoChart({ ...base, topic: 'love', askerGender: 'male' }).useGod!.key).toBe('wealth');
    expect(liuyaoChart({ ...base, topic: 'love', askerGender: 'female' }).useGod!.key).toBe('officer');
    const health = liuyaoChart({ ...base, topic: 'health' }).useGod!;
    expect(health).toMatchObject({ key: 'self', positions: [1] });
    expect(health.notes.map((n) => n.key)).toEqual(['officer', 'child']);
    expect(liuyaoChart({ ...base, topic: 'travel' }).useGod!.notes.map((n) => n.key)).toEqual(['parent']);
    expect(liuyaoChart({ ...base, topic: 'study' }).useGod).toMatchObject({ key: 'parent', positions: [1, 6] });
  });
  it('người dùng ghi đè', () => {
    const g = liuyaoChart({ ...base, topic: 'work', useGod: 'child' }).useGod!;
    expect(g).toMatchObject({ key: 'child', positions: [2], overridden: true });
    expect(liuyaoChart(base).useGod).toBeNull();
  });
});
