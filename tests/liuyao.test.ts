import { describe, expect, it } from 'vitest';
import type { LineValue } from '../src/lib/cast';
import { hexagramFromTrigrams } from '../src/lib/iching';
import {
  ADVANCE_PAIRS,
  BRANCH_HANZI,
  PALACE_ORDER,
  TIMING_DISCLAIMER,
  branchesClash,
  branchesCombine,
  hexagramPattern,
  hiddenSpirits,
  liuyaoChart,
  monthStatus,
  mutualHexagram,
  najia,
  palaceOf,
  palaceSequence,
  progressOf,
  sixSpirits,
  suggestUseGod,
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

// ---------- Phân tích vượng suy ----------
// Nguồn từng quy tắc: docs/luc-hao-nguon.md. Phần lớn ca dưới đây lấy nguyên ví dụ
// trong 增刪卜易 (bản Wikisource); ghi chú ngay trên mỗi ca là lời đoán của sách.
// Can chi tháng chỉ cần đúng chi; can chọn bất kỳ cho hợp âm dương.
const sb = (stem: number, branch: number) => ({ stem, branch });

describe('bảng cơ sở', () => {
  it('vượng tướng hưu tù tử khớp bảng mùa xuân, mùa đông của 火珠林 và 「四季之月土旺金相」', () => {
    // 火珠林·財官輔助: 春，寅卯木旺，巳午火相，亥子水休，申酉金囚，辰戌丑未土死
    expect((['wood', 'fire', 'water', 'metal', 'earth'] as const).map((e) => monthStatus('wood', e))).toEqual([
      'wang', 'xiang', 'xiu', 'qiu', 'si',
    ]);
    // 冬，亥子水旺，寅卯木相，申酉金休，辰戌丑未土囚，巳午火死
    expect((['water', 'wood', 'metal', 'earth', 'fire'] as const).map((e) => monthStatus('water', e))).toEqual([
      'wang', 'xiang', 'xiu', 'qiu', 'si',
    ]);
    expect(monthStatus('earth', 'earth')).toBe('wang');
    expect(monthStatus('earth', 'metal')).toBe('xiang');
  });

  it('lục xung và tiến/thoái thần theo 卜筮正宗·變出進退神論', () => {
    expect([0, 1, 2, 3, 4, 5].every((b) => branchesClash(b, b + 6) && branchesClash(b + 6, b))).toBe(true);
    expect(branchesClash(0, 1)).toBe(false);
    expect(ADVANCE_PAIRS).toHaveLength(8);
    expect(progressOf(11, 0)).toBe('advance'); // 亥变子
    expect(progressOf(10, 1)).toBe('advance'); // 戌变丑 (bản 增刪卜易 trên Wikisource thiếu cặp này)
    expect(progressOf(0, 11)).toBe('retreat'); // 子变亥
    expect(progressOf(1, 10)).toBe('retreat'); // 丑变戌
    expect(progressOf(0, 1)).toBeNull(); // Tý hóa Sửu: hợp, không phải tiến
  });
});

describe('nguyệt phá, hóa tiến, xung hào động — 增刪卜易·月破章 (亥月己丑日, 兌 hóa 訟)', () => {
  // Sách: 「官逢月破，世遇旬空」, 「世動化進神」, 「沖空則實」.
  // 兌 từ dưới lên: 巳(động) 卯 丑 亥 酉 未(động, Thế). Ngày Kỷ Sửu thuộc tuần Giáp Thân → Ngọ Mùi không.
  const chart = liuyaoChart({ lines: [9, 7, 8, 7, 7, 6], day: sb(5, 1), month: sb(1, 11), topic: 'work' });
  const a = chart.assessment.lines;

  it('an đúng quẻ', () => {
    expect(chart.primary.number).toBe(58);
    expect(chart.transformed?.number).toBe(6);
    expect(chart.lines.map((l) => l.branchLabel)).toEqual(['Tỵ', 'Mão', 'Sửu', 'Hợi', 'Dậu', 'Mùi']);
  });

  it('hào 1 Tỵ Quan Quỷ bị tháng Hợi xung → nguyệt phá; động nên không phải chân phá; hóa Dần hồi đầu sinh', () => {
    expect(a[0].month.break?.kind).toBe('broken');
    expect(a[0].month.status).toBe('si'); // Thủy khắc Hỏa
    expect(a[0].change).toMatchObject({ branch: 2, relation: 'returnSheng', progress: null });
  });

  it('hào 6 Mùi (Thế) động hóa Tuất: tiến thần; tuần không nhưng động → giả không; bị ngày Sửu xung', () => {
    expect(a[5].change?.progress).toBe('advance');
    expect(a[5].void).toMatchObject({ kind: 'false' });
    expect(a[5].void!.reasons).toContain('phát động');
    expect(a[5].day.clash?.kind).toBe('movingClashed');
  });

  it('dụng thần Quan Quỷ ở hào 1', () => {
    expect(chart.assessment.useGod).toMatchObject({ key: 'officer', positions: [1], primary: 1 });
  });
});

describe('nguyệt phá hóa không, hóa thoái — 增刪卜易·月破章 (辰月戊子日, 乾 hóa 夬)', () => {
  // Sách: 「父母持世，破而化空」, 「化月建，爲退」.
  const chart = liuyaoChart({ lines: [7, 7, 7, 7, 7, 9], day: sb(4, 0), month: sb(2, 4) });
  const top = chart.assessment.lines[5];
  it('Tuất bị tháng Thìn xung, động hóa Mùi: thoái thần, hóa không (tuần Giáp Thân → Ngọ Mùi)', () => {
    expect(top.month.break?.kind).toBe('broken');
    expect(top.change).toMatchObject({ branch: 7, progress: 'retreat', void: true, monthBreak: false });
    expect(top.strength.reasons.map((r) => r.key)).toEqual(
      expect.arrayContaining(['month-break-broken', 'change-retreat', 'change-void']),
    );
  });
});

describe('ám động, tiến thần — 增刪卜易·進神退神章 (申月癸卯日, 恆 hóa 大過)', () => {
  // Sách: 「酉金官星持世旺相，當時卯日沖之而暗動，又得九五爻上官進神」.
  const chart = liuyaoChart({ lines: [8, 7, 7, 7, 6, 8], day: sb(9, 3), month: sb(8, 8), topic: 'work' });
  const a = chart.assessment.lines;
  it('an đúng quẻ, Thế hào 3', () => {
    expect(chart.primary.number).toBe(32);
    expect(chart.transformed?.number).toBe(28);
    expect(chart.palace.shi).toBe(3);
  });
  it('hào 3 Dậu tĩnh, vượng ở tháng Thân, bị ngày Mão xung → ám động', () => {
    expect(a[2].month.status).toBe('wang');
    expect(a[2].day.clash?.kind).toBe('hiddenMove');
  });
  it('hào 5 Thân hóa Dậu: tiến thần', () => {
    expect(a[4].change?.progress).toBe('advance');
  });
  it('Quan Quỷ ở hào 3 và 5: chọn hào vượng nhất', () => {
    // Hào 3: vượng +1, ám động +1 = 2. Hào 5: vượng +1, động +1, tiến thần +1 = 3.
    const ug = chart.assessment.useGod!;
    expect(ug.positions).toEqual([3, 5]);
    expect(a[2].strength.score).toBe(2);
    expect(a[4].strength.score).toBe(3);
    expect(ug.primary).toBe(5);
    expect(ug.notes.map((n) => n.key)).toContain('pick-strongest');
  });
});

describe('ám động do nhật thần cùng hành — 增刪卜易·暗動章 (寅月己未日, 坤 hóa 師)', () => {
  // Sách: 「酉金子孫，雖則春令休囚，得日辰生之，二爻巳火動而克金，得未日沖動丑土，土動生金」.
  const chart = liuyaoChart({ lines: [8, 6, 8, 8, 8, 8], day: sb(5, 7), month: sb(2, 2), useGod: 'child' });
  const a = chart.assessment.lines;
  it('hào 4 Sửu hưu tù (tử) mùa xuân nhưng ngày Mùi cùng hành → ám động', () => {
    expect(a[3].month.status).toBe('si');
    expect(a[3].day.clash?.kind).toBe('hiddenMove');
  });
  it('hào 6 Dậu Tử Tôn: tháng Dần tù, ngày Mùi sinh, hào 2 Tỵ động khắc, Sửu ám động sinh', () => {
    expect(a[5].month.status).toBe('qiu');
    expect(a[5].day.relation).toBe('sinh');
    expect(a[5].movingAttack).toEqual([2]);
    expect(a[5].movingSupport).toEqual([4]);
    // −1 (tù) +1 (nhật sinh) −1 (Tỵ khắc) +1 (Sửu sinh) = 0
    expect(chart.assessment.useGod!.verdict).toMatchObject({ key: 'balanced', score: 0 });
  });
  it('nguyên thần Huynh Đệ (Thổ) ám động, kỵ thần Phụ Mẫu (Hỏa) động → tham sinh vong khắc', () => {
    const ug = chart.assessment.useGod!;
    expect(ug.yuan).toMatchObject({ liuqin: 'brother', moving: false, hiddenMove: true });
    expect(ug.ji).toMatchObject({ liuqin: 'parent', moving: true });
    expect(ug.chou).toMatchObject({ liuqin: 'officer', moving: false });
    expect(ug.notes.map((n) => n.key)).toContain('greed-for-sheng');
  });
});

describe('dụng thần hào Thế, nguyên/kỵ/cừu — 增刪卜易·元神忌神衰旺章 (巳月乙未日, 大過 hóa 鼎)', () => {
  // Sách: 「自占病世爻亥水爲用神，被未土忌神動而克水，幸得酉金元神亦動…
  // 其如亥水月沖日克，值月破而被克，雖有生扶生之不起」 → cuối cùng chết.
  const chart = liuyaoChart({ lines: [8, 7, 7, 7, 9, 6], day: sb(1, 7), month: sb(5, 5), topic: 'health' });
  const ug = chart.assessment.useGod!;
  it('an đúng quẻ, Thế hào 4 Hợi', () => {
    expect(chart.primary.number).toBe(28);
    expect(chart.transformed?.number).toBe(50);
    expect(ug).toMatchObject({ key: 'self', liuqin: 'parent', element: 'water', positions: [4], primary: 4 });
  });
  it('Hợi: tháng Tỵ xung (nguyệt phá, có hào động sinh nên chưa là chân phá), ngày Mùi khắc', () => {
    const l = chart.assessment.lines[3];
    expect(l.month.break?.kind).toBe('broken');
    expect(l.month.status).toBe('qiu');
    expect(l.day.relation).toBe('khac');
    expect(l.movingSupport).toEqual([5]);
    // Hào 6 Mùi động khắc; hào 1 Sửu tĩnh bị ngày Mùi xung, tướng ở tháng Tỵ → ám động, cũng khắc Hợi.
    // (Sách chỉ nói Mùi; ám động Sửu là hệ quả của 暗動章, sách không nhắc tới.)
    expect(chart.assessment.lines[0].day.clash?.kind).toBe('hiddenMove');
    expect(l.movingAttack).toEqual([1, 6]);
    // −1 tù −1 nguyệt phá −1 nhật khắc +1 Dậu sinh −1 Sửu khắc −1 Mùi khắc = −4
    expect(ug.verdict).toMatchObject({ key: 'weak', score: -4 });
  });
  it('nguyên thần Kim (Quan Quỷ hào 3, 5 động), kỵ thần Thổ (Thê Tài hào 1, 6 động), cừu thần Hỏa vắng', () => {
    expect(ug.yuan).toMatchObject({ liuqin: 'officer', moving: true });
    expect(ug.yuan.lines.map((l) => l.position)).toEqual([3, 5]);
    expect(ug.ji).toMatchObject({ liuqin: 'wealth', moving: true });
    expect(ug.ji.lines.map((l) => l.position)).toEqual([1, 6]);
    expect(ug.chou).toMatchObject({ liuqin: 'child', element: 'fire', present: false });
    expect(ug.notes.map((n) => n.key)).toContain('greed-for-sheng');
  });
});

describe('tuần không, hồi đầu khắc, hóa không — 增刪卜易·旬空章 (辰月乙卯日, 家人 hóa 賁)', () => {
  // Sách: 「丑財持世遇旬空，雖有巳火之生，巳火又化回頭之克」; 「三月之丑土財爻有气，古法有气不爲空」.
  const chart = liuyaoChart({ lines: [7, 8, 7, 8, 9, 7], day: sb(1, 3), month: sb(4, 4), topic: 'money' });
  const a = chart.assessment.lines;
  it('ngày Ất Mão thuộc tuần Giáp Dần → Tý Sửu không', () => {
    expect(chart.primary.number).toBe(37);
    expect(chart.void.labels).toEqual(['Tý', 'Sửu']);
  });
  it('hào 2 Sửu Thê Tài: vượng ở tháng Thìn → giả không', () => {
    expect(a[1].month.status).toBe('wang');
    expect(a[1].void?.kind).toBe('false');
    expect(a[1].movingSupport).toEqual([5]);
  });
  it('hào 5 Tỵ hóa Tý: hồi đầu khắc, hóa không', () => {
    expect(a[4].change).toMatchObject({ branch: 0, relation: 'returnKe', void: true });
  });
});

describe('hồi đầu sinh, hào động bị xung — 增刪卜易·動散章 (丑月丁酉日, 渙 hóa 坎)', () => {
  // Sách: 「卯木父爻發動而生世，又化子水回頭生」, 「此非卯動酉日沖之？何當散也」.
  const chart = liuyaoChart({ lines: [8, 7, 8, 8, 7, 9], day: sb(3, 9), month: sb(9, 1) });
  it('hào 6 Mão hóa Tý: hồi đầu sinh; ngày Dậu xung hào động: không coi là nhật phá', () => {
    expect(chart.primary.number).toBe(59);
    const top = chart.assessment.lines[5];
    expect(top.change).toMatchObject({ branch: 0, relation: 'returnSheng' });
    expect(top.day.clash?.kind).toBe('movingClashed');
    expect(top.strength.reasons.find((r) => r.key === 'day-clash-movingClashed')?.effect).toBe(0);
  });
});

describe('hóa tiến kiêm hóa phá, hóa thoái — 增刪卜易·進神退神章 (戌月己卯日, 同人 hóa 解)', () => {
  // Sách: 「丑土化破」, 「丑土化進神」, và Mão (Phụ Mẫu) 「化退神」.
  const chart = liuyaoChart({ lines: [9, 6, 9, 7, 9, 9], day: sb(5, 3), month: sb(0, 10) });
  const a = chart.assessment.lines;
  it('hào 2 Sửu hóa Thìn: tiến thần, hóa phá (Thìn bị tháng Tuất xung), hóa mộ nhưng cùng hành nên chỉ ghi chú', () => {
    expect(chart.primary.number).toBe(13);
    expect(chart.transformed?.number).toBe(40);
    expect(a[1].change).toMatchObject({ branch: 4, progress: 'advance', monthBreak: true, tomb: true });
    expect(a[1].strength.reasons.find((r) => r.key === 'change-tomb')?.effect).toBe(0);
  });
  it('hào 1 Mão hóa Dần: thoái thần', () => {
    expect(a[0].change?.progress).toBe('retreat');
  });
});

describe('nhật phá, chân không (ca dựng tay: 乾 tĩnh, tháng Hợi, ngày Giáp Tý)', () => {
  // Tháng Hợi (Thủy), ngày Tý (Thủy), tuần Giáp Tý → Tuất Hợi không.
  const chart = liuyaoChart({ lines: [7, 7, 7, 7, 7, 7], day: sb(0, 0), month: sb(3, 11) });
  const a = chart.assessment.lines;
  it('hào 4 Ngọ: tử ở tháng Thủy, tĩnh, bị ngày Tý xung → nhật phá', () => {
    expect(a[3].month.status).toBe('si');
    expect(a[3].day.clash?.kind).toBe('dayBreak');
    expect(a[3].strength.key).toBe('weak');
  });
  it('hào 6 Tuất: tù ở tháng Hợi, tĩnh, không được sinh phù, tuần không → chân không', () => {
    expect(a[5].month.status).toBe('qiu');
    expect(a[5].void).toMatchObject({ kind: 'true' });
  });
  it('hào 1 Tý lâm nhật thần, vượng ở tháng Hợi', () => {
    expect(a[0].day.sameBranch).toBe(true);
    expect(a[0].strength.reasons.map((r) => r.key)).toEqual(['month-wang', 'day-same']);
  });
});

describe('chân phá, phá mà không phá (ca dựng tay)', () => {
  it('hào tĩnh bị nguyệt phá, lại tuần không, không được sinh → chân phá', () => {
    // 乾 tĩnh, tháng Thìn xung Tuất (hào 6), ngày Giáp Tý: Tuất không; ngày Tý Thủy không sinh Thổ.
    const a = liuyaoChart({ lines: [7, 7, 7, 7, 7, 7], day: sb(0, 0), month: sb(2, 4) }).assessment.lines;
    expect(a[5].month.break?.kind).toBe('trueBroken');
    expect(a[5].void?.kind).toBe('true'); // tĩnh mà gặp nguyệt phá
  });
  it('hào bị nguyệt phá nhưng lâm nhật thần → phá mà không phá (日辰章: 酉月卯日 爻臨卯木)', () => {
    // 乾: hào 2 Dần. Tháng Thân xung Dần, ngày Canh Dần.
    const a = liuyaoChart({ lines: [7, 7, 7, 7, 7, 7], day: sb(6, 2), month: sb(4, 8) }).assessment.lines;
    expect(a[1].month.break?.kind).toBe('brokenNotBroken');
  });
});

describe('phục thần — 增刪卜易·飛伏神章', () => {
  it('姤 hỏi Tài, tháng Dần: nguyệt kiến là Tài → lấy làm dụng thần; phục thần Dần dưới Hợi: phi lai sinh phục', () => {
    // Sách: 「如於寅卯月占者，則以日月爲用神」, 「亥水而生寅木，謂之飛來生伏得長生」.
    const chart = liuyaoChart({ lines: still('011111'), day: sb(0, 0), month: sb(2, 2), topic: 'money' });
    const ug = chart.assessment.useGod!;
    expect(ug.positions).toEqual([]);
    expect(ug.standIns).toMatchObject([{ pillar: 'month', branch: 2 }]);
    expect(ug.verdict.key).toBe('strong');
    const h = ug.hidden[0];
    expect(h).toMatchObject({ position: 2, branch: 2, monthStatus: 'wang', verdict: 'usable' });
    expect(h.useful.map((r) => r.key)).toEqual(
      expect.arrayContaining(['hidden-pillar-sheng', 'hidden-strong', 'hidden-flying-sheng', 'hidden-flying-weak']),
    );
    expect(h.useless).toEqual([]);
  });

  it('遯 hỏi Tử Tôn: Tý Thủy dưới Thìn Thổ vượng → phi khắc phục, phục thần vô dụng', () => {
    // Sách: 「此乃飛來克伏…名爲伏神受制，有用亦無用矣，卽作凶推」.
    // Tháng Sửu: Thổ vượng (phi thần Thìn vượng, không bị xung), Thủy tử. Ngày Bính Ngọ xung Tý,
    // Hỏa không khắc Thổ. Tuần Giáp Thìn → Dần Mão không (không chạm Thìn, Tý). Tý Thủy mộ tại Thìn (chính phi thần).
    // Không điều kiện hữu dụng nào: nhật nguyệt không sinh Tý, Tý không vượng, phi thần không sinh,
    // không hào động, phi thần không bị xung khắc, không không/phá/hưu tù/mộ tuyệt.
    const chart = liuyaoChart({ lines: still('001111'), day: sb(2, 6), month: sb(3, 1), useGod: 'child' });
    expect(chart.primary.number).toBe(33);
    const ug = chart.assessment.useGod!;
    const h = ug.hidden[0];
    expect(h).toMatchObject({ position: 1, branch: 0, monthStatus: 'si', verdict: 'unusable' });
    expect(h.useless.map((r) => r.key)).toEqual([
      'hidden-weak', // tử ở tháng Thổ
      'hidden-pillar-hits', // ngày Ngọ xung
      'hidden-pillar-hits', // tháng Sửu khắc
      'hidden-flying-ke', // Thìn vượng khắc Tý
      'hidden-tomb', // Thủy mộ tại Thìn
    ]);
    expect(h.useful).toEqual([]);
    expect(ug.standIns).toEqual([]);
    expect(ug.verdict.key).toBe('weak');
  });
});

describe('gợi ý dụng thần kèm nguồn', () => {
  it('mỗi chủ đề có trích dẫn; nguồn đi vào chart.useGod', () => {
    expect(suggestUseGod('health').source).toContain('世應論用神');
    expect(suggestUseGod('work').source).toContain('用神章');
    expect(suggestUseGod('study').notes.map((n) => n.key)).toEqual(['officer']);
    const chart = liuyaoChart({ lines: still('011111'), day: sb(0, 0), month: sb(0, 0), topic: 'travel' });
    expect(chart.useGod!.source).toContain('出行章');
  });

  it('assessment JSON hóa được, không ngẫu nhiên', () => {
    const input = { lines: [9, 6, 9, 7, 9, 9] as LineValue[], day: sb(5, 3), month: sb(0, 10), topic: 'work' as const };
    const c1 = liuyaoChart(input);
    expect(JSON.parse(JSON.stringify(c1))).toEqual(c1);
    expect(liuyaoChart(input)).toEqual(c1);
  });
});

// ---------- Lục hợp, tam hợp, tam hình, mộ, phản/phục ngâm, ứng kỳ ----------
// Nguồn: docs/luc-hao-nguon.md mục 10–15. Ca có tên chương là ví dụ nguyên văn của sách;
// ghi chú ngay trên mỗi ca là lời đoán của sách.

const hintBranches = (chart: ReturnType<typeof liuyaoChart>, key: string) =>
  chart.assessment.timing!.hints.filter((h) => h.key === key).flatMap((h) => h.branches);

describe('bảng lục hợp, quẻ lục hợp / lục xung', () => {
  it('lục hợp Tý-Sửu, Dần-Hợi, Mão-Tuất, Thìn-Dậu, Tỵ-Thân, Ngọ-Mùi', () => {
    const pairs = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
    for (const [a, b] of pairs) expect(branchesCombine(a, b) && branchesCombine(b, a)).toBe(true);
    expect(branchesCombine(0, 6)).toBe(false);
    expect(branchesCombine(2, 5)).toBe(false);
  });
  it('否, 泰, 復 là lục hợp; 乾, 无妄, 大壯, 坤 là lục xung (增刪卜易·六合章: 天地否卦內外六爻自相和合)', () => {
    expect([12, 11, 24].map(hexagramPattern)).toEqual(['sixHe', 'sixHe', 'sixHe']);
    expect([1, 25, 34, 2].map(hexagramPattern)).toEqual(['sixClash', 'sixClash', 'sixClash', 'sixClash']);
    expect(hexagramPattern(44)).toBeNull();
  });
});

describe('hợp bán, Tý Mão hình — 增刪卜易·六合章 (申月丙子日, 明夷 hóa 小過)', () => {
  // Sách: 「合住必有事絆，不能動身」, 「夫應不去者，世動而逢合也」; 「卯木子孫申月絕之，子日刑之」.
  const chart = liuyaoChart({ lines: [9, 8, 7, 6, 8, 8], day: sb(2, 0), month: sb(6, 8) });
  const a = chart.assessment.lines;
  it('an đúng quẻ, Thế hào 4 Sửu', () => {
    expect(chart.primary.number).toBe(36);
    expect(chart.transformed?.number).toBe(62);
    expect(chart.palace.shi).toBe(4);
  });
  it('hào 4 Sửu động gặp ngày Tý hợp → hợp bán, chờ ngày xung khai', () => {
    expect(a[3].he).toMatchObject({ day: true, state: 'heBan' });
    expect(a[3].he.reasons[0]).toMatchObject({ key: 'he-ban', source: expect.stringContaining('六合章') });
  });
  it('ngày Tý với hào 1 Mão động: Tý Mão tương hình', () => {
    const x = chart.assessment.xing.find((i) => i.kind === 'ziMao')!;
    expect(x).toMatchObject({ status: 'complete', active: true });
    expect(x.positions).toContain(1);
    expect(x.members.map((m) => m.source).sort()).toEqual(['day', 'moving']);
  });
});

describe('lục xung biến lục hợp — 增刪卜易·六合章 (未月丁巳日, 離 hóa 旅)', () => {
  // Sách: 「因得屢驗六沖變合，散而復聚，離而必合，此婚一定還成」.
  const chart = liuyaoChart({ lines: [9, 8, 7, 7, 8, 7], day: sb(3, 5), month: sb(7, 7) });
  it('離 lục xung → 旅 lục hợp: xung trung phùng hợp', () => {
    expect(chart.transformed?.number).toBe(56);
    const h = chart.assessment.hexagram;
    expect(h).toMatchObject({ primary: 'sixClash', transformed: 'sixHe', transition: 'clashToHe' });
    expect(h.patterns).toContain('chongZhongFengHe');
    expect(h.reasons.find((r) => r.key === 'hex-clashToHe')?.effect).toBe(1);
  });
});

describe('lục hợp biến lục hợp, tam hình mà sách bỏ qua — 增刪卜易·六合章 (卯月甲寅日, 困 hóa 節)', () => {
  // Sách: 「亥水子孫化申金生之」, kết luận 「六合萬載安然」 — không nhắc tam hình.
  const chart = liuyaoChart({ lines: [6, 7, 8, 9, 7, 8], day: sb(0, 2), month: sb(1, 3) });
  it('困 → 節: lục hợp biến lục hợp', () => {
    expect(chart.primary.number).toBe(47);
    expect(chart.transformed?.number).toBe(60);
    expect(chart.assessment.hexagram.transition).toBe('heToHe');
  });
  it('Dần (hào 1 động, ngày) hóa Tỵ, Hợi hóa Thân: đủ tam hình Dần Tỵ Thân nhưng chỉ là ghi chú (effect 0)', () => {
    const x = chart.assessment.xing.find((i) => i.kind === 'yinSiShen')!;
    expect(x).toMatchObject({ status: 'complete', active: true });
    expect(x.reasons.every((r) => r.effect === 0)).toBe(true);
    expect(x.weight).toContain('增刪卜易');
  });
});

describe('tam hợp nội ngoại — 增刪卜易·六合章 (卯月丁巳日, 離 hóa 坤)', () => {
  // Sách: 「內卦爲我村，亥卯未合成木局，外卦爲人村，巳酉丑合金局來克木，幸衰金不克旺木」, 「況系六沖卦變六沖」.
  const chart = liuyaoChart({ lines: [9, 8, 9, 9, 8, 9], day: sb(3, 5), month: sb(1, 3) });
  const byEl = (e: string) => chart.assessment.sanHe.find((s) => s.element === e)!;
  it('nội quái: Hợi (3), Mão (1) động, Mão hóa Mùi → Mộc cục thành', () => {
    const wood = byEl('wood');
    expect(wood).toMatchObject({ status: 'formed', half: 'inner', missing: null });
    expect(wood.members.map((m) => [m.branch, m.source, m.position])).toEqual([
      [11, 'moving', 3], [3, 'moving', 1], [7, 'changed', 1],
    ]);
  });
  it('ngoại quái: Tỵ (6), Dậu (4) động, Dậu hóa Sửu → Kim cục thành', () => {
    const metal = byEl('metal');
    expect(metal).toMatchObject({ status: 'formed', half: 'outer' });
    expect(metal.members.find((m) => m.branch === 1)).toMatchObject({ source: 'changed', position: 4 });
  });
  it('tháng Mão: Mộc vượng, Kim tù (衰金不克旺木); lục xung biến lục xung', () => {
    expect(monthStatus('wood', 'wood')).toBe('wang');
    expect(monthStatus('wood', 'metal')).toBe('qiu');
    expect(chart.assessment.hexagram.transition).toBe('clashToClash');
  });
});

describe('hư nhất đãi dụng (tam hợp) — 增刪卜易·增刪黃金策千金賦章 (酉月乙巳日, 萃 hóa 否)', () => {
  // Sách: 「巳日沖動亥月與發動之未爻﹐欲成三合﹐因少卯字﹐明年卯月必升﹐此乃虛一待用」.
  const chart = liuyaoChart({ lines: [8, 8, 8, 7, 7, 6], day: sb(1, 5), month: sb(3, 9), topic: 'work' });
  it('Hợi ám động (ngày Tỵ xung, tướng ở tháng Dậu), Mùi động, Mão chỉ là hào tĩnh → chờ ngày/tháng Mão', () => {
    expect(chart.primary.number).toBe(45);
    expect(chart.assessment.lines[3].day.clash?.kind).toBe('hiddenMove');
    const wood = chart.assessment.sanHe.find((s) => s.element === 'wood')!;
    expect(wood).toMatchObject({ status: 'staticMember', missing: 3 });
    expect(wood.members.map((m) => m.source)).toEqual(['hiddenMove', 'static', 'moving']);
  });
  it('Mộc cục sinh Quan Quỷ Tỵ Hỏa (dụng thần) → cục nguyên thần; ứng kỳ có chi Mão', () => {
    const wood = chart.assessment.sanHe.find((s) => s.element === 'wood')!;
    expect(wood.useGodRole?.role).toBe('yuan');
    expect(hintBranches(chart, 'sanhe-static')).toEqual([3]);
  });
});

describe('tam hợp chờ hào tĩnh trị nhật — 卜筮正宗·十八問答第四問 (巳日, 乾 hóa 需)', () => {
  // Sách: 「寅午戌三合官局生世，此缺必得．内少寅字发动，须寅日递呈可也．后果验此虚一待用也」.
  const chart = liuyaoChart({ lines: [7, 7, 7, 9, 7, 9], day: sb(3, 5), month: sb(9, 9) });
  it('Ngọ (4), Tuất (6) động; Dần (2) tĩnh → chờ ngày Dần; Thế Tuất ở trong cục', () => {
    expect(chart.transformed?.number).toBe(5);
    const fire = chart.assessment.sanHe.find((s) => s.element === 'fire')!;
    expect(fire).toMatchObject({ status: 'staticMember', missing: 2, includesShi: true });
    expect(fire.waits[0].branches).toEqual([2]);
  });
});

describe('xung trung phùng hợp, hào phản ngâm — 增刪卜易·六沖章 (午月丙辰日, 恆 hóa 豫)', () => {
  // Sách: 「世爻酉金化卯相沖及反復之卦，幸辰日合之，沖中逢合，又得戌土爲財，暗動生世」.
  // 卜筮正宗·十八問答第十一問 cùng quẻ: 「正谓反吟卦也」.
  const chart = liuyaoChart({ lines: [8, 9, 9, 7, 8, 8], day: sb(2, 4), month: sb(0, 6) });
  const a = chart.assessment.lines;
  it('hào 3 Dậu (Thế) hóa Mão hồi đầu xung, ngày Thìn hợp → xung trung phùng hợp', () => {
    expect(chart.palace.shi).toBe(3);
    expect(a[2].change).toMatchObject({ branch: 3, fanYin: true, fuYin: false });
    expect(a[2].he.day).toBe(true);
    expect(a[2].he.patterns).toEqual(['chongZhongFengHe']);
  });
  it('Tuất (hào 6) ám động; nội quái Tốn biến Khôn: hào phản ngâm', () => {
    expect(a[5].day.clash?.kind).toBe('hiddenMove');
    expect(chart.assessment.hexagram.inner.fanYin).toBe('branch');
    expect(chart.assessment.hexagram.fanYin).toBe('inner');
  });
});

describe('lục hợp biến lục xung — 增刪卜易·六沖章 (巳月甲寅日, 否 hóa 乾)', () => {
  // Sách: 「獨嫌卦變六沖，合而變沖，不久之兆」.
  const chart = liuyaoChart({ lines: [6, 6, 6, 7, 7, 7], day: sb(0, 2), month: sb(5, 5) });
  it('hợp xứ phùng xung ở cấp quẻ', () => {
    expect(chart.assessment.hexagram).toMatchObject({ primary: 'sixHe', transformed: 'sixClash', transition: 'heToClash' });
    expect(chart.assessment.hexagram.patterns).toContain('heChuFengChong');
  });
});

describe('nội ngoại phản ngâm — 增刪卜易·六沖章 (申月己卯日, 巽 hóa 坤)', () => {
  // Sách: 「六沖亂室」; 卜筮正宗·十八問答第十三問 cùng quẻ: 「内外爻见反吟，乱冲乱击」.
  const chart = liuyaoChart({ lines: [8, 9, 9, 8, 9, 9], day: sb(5, 3), month: sb(6, 8) });
  it('hai quái Tốn → Khôn: ba chi đều xung', () => {
    const h = chart.assessment.hexagram;
    expect(h.fanYin).toBe('both');
    expect([h.inner.fanYin, h.outer.fanYin]).toEqual(['branch', 'branch']);
    expect(h.transition).toBe('clashToClash');
  });
});

describe('phản ngâm với dụng thần — 增刪卜易·反伏章', () => {
  it('卯月壬申日 比 hóa 井: nội quái phản ngâm, Thế Quan Quỷ Mão hóa Dậu hồi đầu xung khắc → hung', () => {
    // Sách: 「因內卦反伏，事有反復，不宜世爻絕於申日又化回頭沖克，此行不吉」.
    const chart = liuyaoChart({ lines: [8, 6, 6, 8, 7, 8], day: sb(8, 8), month: sb(1, 3), topic: 'work' });
    expect(chart.transformed?.number).toBe(48);
    expect(chart.assessment.hexagram.inner.fanYin).toBe('branch');
    const ug = chart.assessment.useGod!;
    expect(ug.primary).toBe(3);
    expect(ug.relationReasons.find((r) => r.key === 'fan-yin-use-god-hit')?.effect).toBe(-1);
  });
  it('卯月己亥日 臨 hóa 中孚: ngoại quái phản ngâm, Quan Quỷ không hóa xung khắc → phản phục mà vẫn thành', () => {
    // Sách: 「許之卽升…復任江西者，外卦反伏，去之而復反也」.
    const chart = liuyaoChart({ lines: [7, 7, 8, 8, 6, 6], day: sb(5, 11), month: sb(1, 3), topic: 'work' });
    expect(chart.transformed?.number).toBe(61);
    expect(chart.assessment.hexagram.outer.fanYin).toBe('branch');
    expect(chart.assessment.useGod!.relationReasons.map((r) => r.key)).toContain('fan-yin-use-god-ok');
  });
  it('卜筮正宗·反吟卦定例: 姤 hóa 小畜 là quái phản ngâm (Càn–Tốn đổi chỗ)', () => {
    const chart = liuyaoChart({ lines: [6, 7, 7, 9, 7, 7], day: sb(0, 0), month: sb(0, 0) });
    expect(chart.transformed?.number).toBe(9);
    const h = chart.assessment.hexagram;
    expect([h.inner.fanYin, h.outer.fanYin]).toEqual(['trigram', 'trigram']);
  });
});

describe('phục ngâm — 增刪卜易·反伏章, 卜筮正宗·伏吟卦定例', () => {
  it('申月癸巳日 姤 hóa 恆: ngoại quái Càn → Chấn, chi y nguyên; ứng kỳ có chi Thìn (xung Tuất)', () => {
    // Sách: 「獨憂卦得伏吟…伏吟欲歸而不能，辰年可歸」.
    const chart = liuyaoChart({ lines: [8, 7, 7, 7, 9, 9], day: sb(9, 5), month: sb(6, 8), useGod: 'parent' });
    expect(chart.transformed?.number).toBe(32);
    expect(chart.assessment.hexagram).toMatchObject({ fuYin: 'outer', fanYin: 'none' });
    expect(chart.assessment.lines[5].change?.fuYin).toBe(true);
    expect(chart.assessment.useGod!.primary).toBe(6);
    expect(hintBranches(chart, 'fu-yin-open')).toEqual([4]);
  });
  it('无妄 hóa 大壯: nội ngoại phục ngâm (卜筮正宗·十八問答第六問)', () => {
    const chart = liuyaoChart({ lines: [7, 6, 6, 7, 9, 9], day: sb(1, 3), month: sb(6, 8) });
    expect(chart.transformed?.number).toBe(34);
    expect(chart.assessment.hexagram.fuYin).toBe('both');
  });
});

describe('tùy quỷ nhập mộ — 增刪卜易·隨鬼入墓章', () => {
  it('申月戊辰日 同人 (vợ hỏi bệnh chồng): Hợi Quan Quỷ trì Thế mộ ở ngày Thìn, tướng ở tháng Thân → mộ không thật; tuần không chờ ngày Tỵ', () => {
    // Sách: 「古法斷之必死﹐予曰﹕不獨不死﹐明日愈…明日己巳沖起亥水」.
    const chart = liuyaoChart({ lines: [7, 8, 7, 7, 9, 7], day: sb(4, 4), month: sb(6, 8), topic: 'love', askerGender: 'female' });
    expect(chart.primary.number).toBe(13);
    const t = chart.assessment.lines[2].tomb!;
    expect(t).toMatchObject({ branch: 4, kinds: ['day'], withGhost: true, genuine: false, openBranch: 10 });
    expect(chart.assessment.useGod!.primary).toBe(3);
    expect(hintBranches(chart, 'void-fill')).toEqual([11, 5]);
  });
  it('申月己丑日 恆 (tự hỏi bệnh): Dậu Quan Quỷ trì Thế mộ ở ngày Sửu, vượng → mộ không thật; chờ ngày Mùi xung khai', () => {
    // Sách: 「因世爻旺相﹐許未日愈﹐果起牀於未日者﹐沖開丑墓之日而出也」.
    const chart = liuyaoChart({ lines: [8, 7, 7, 7, 8, 8], day: sb(5, 1), month: sb(8, 8), topic: 'health' });
    const t = chart.assessment.lines[2].tomb!;
    expect(t).toMatchObject({ kinds: ['day'], withGhost: true, genuine: false });
    expect(t.reasons[0]).toContain('vượng');
    expect(hintBranches(chart, 'tomb-open')).toEqual([7]);
  });
  it('未月戊辰日 蠱: Dậu nhập động mộ (Sửu động) và hóa mộ, nhưng Sửu bị tháng Mùi xung phá → dễ ra', () => {
    // Sách: 「世爻隨鬼入動墓﹐又動而化墓﹐古以爲凶﹐予以爲吉。日月生世﹐丑墓月破﹐破羅破网﹐容易而出」.
    const chart = liuyaoChart({ lines: [6, 7, 9, 8, 8, 7], day: sb(4, 4), month: sb(7, 7), useGod: 'self' });
    expect(chart.primary.number).toBe(18);
    expect(chart.transformed?.number).toBe(41);
    const t = chart.assessment.lines[2].tomb!;
    expect(t).toMatchObject({ kinds: ['moving', 'change'], movingPositions: [1], withGhost: true, genuine: false });
    expect(t.reasons.join(' ')).toContain('xung phá');
  });
  it('戌月甲寅日 小過 (hỏi thi): Ngọ nhập nguyệt mộ, động mộ, hóa mộ; nhật nguyệt hợp thành Hỏa cục; chờ Thìn xung khai', () => {
    // Sách: 「世爻隨官入三墓﹐動墓﹐化墓﹐又入月德之墓﹐明歲辰年沖開墓庫…日月合成官局旺相當時」.
    const chart = liuyaoChart({ lines: [8, 8, 7, 9, 8, 6], day: sb(0, 2), month: sb(0, 10), useGod: 'self' });
    expect(chart.primary.number).toBe(62);
    const t = chart.assessment.lines[3].tomb!;
    expect(t).toMatchObject({ kinds: ['month', 'moving', 'change'], withGhost: true, genuine: false });
    const fire = chart.assessment.sanHe.find((s) => s.element === 'fire')!;
    expect(fire).toMatchObject({ status: 'formed', useGodRole: { role: 'useGod' } });
    // Dần có cả ở nhật thần lẫn hào biến (Tuất hóa Dần); engine ưu tiên hào biến, Tuất có cả hào động lẫn nguyệt kiến.
    expect(fire.members.map((m) => m.source)).toEqual(['changed', 'moving', 'moving']);
    expect(hintBranches(chart, 'tomb-open')).toEqual([4]);
  });
  it('ca dựng tay: hào hưu tù, bị hào động khắc, mộ không bị phá → nhập mộ thật', () => {
    // 乾 động hào 1 (Tý hóa Sửu), tháng Tý, ngày Giáp Tuất: Ngọ (hào 4) tử ở tháng Thủy, bị Tý động khắc, mộ ở ngày Tuất.
    const chart = liuyaoChart({ lines: [9, 7, 7, 7, 7, 7], day: sb(0, 10), month: sb(0, 0), useGod: 'officer' });
    const t = chart.assessment.lines[3].tomb!;
    expect(t).toMatchObject({ kinds: ['day'], genuine: true, withGhost: false });
    expect(chart.assessment.useGod!.relationReasons.find((r) => r.key === 'tomb-genuine')?.effect).toBe(-1);
  });
});

describe('tam hình — 增刪卜易·三刑章 (寅月庚申日, 家人 hóa 離), 卜筮正宗·十八問答第十四問', () => {
  // 增刪卜易: 「巳火子孫旣當春令，子孫旺相許之可治，後死於寅日寅時…獨此一卦」 — chính tác giả nói hiếm khi nghiệm.
  const chart = liuyaoChart({ lines: [7, 8, 7, 6, 9, 7], day: sb(6, 8), month: sb(4, 2), useGod: 'child' });
  it('tháng Dần, ngày Thân, Tỵ Tử Tôn (hào 5 động) đủ tam hình Dần Tỵ Thân', () => {
    expect(chart.primary.number).toBe(37);
    const x = chart.assessment.xing.find((i) => i.kind === 'yinSiShen')!;
    expect(x).toMatchObject({ status: 'complete', active: true, involvesUseGod: true });
    expect(x.members.map((m) => m.source)).toEqual(['month', 'moving', 'day']);
  });
  it('dụng thần vượng tướng nên engine chỉ ghi chú (effect 0) theo quy tắc của sách', () => {
    const r = chart.assessment.useGod!.relationReasons.find((i) => i.key.startsWith('xing-use-god'))!;
    expect(r).toMatchObject({ key: 'xing-use-god-note', effect: 0 });
  });
});

describe('tam hình thiếu một chi — 增刪卜易·增刪黃金策千金賦章 (巳月未日, 困 hóa 兌)', () => {
  // Sách: 「世爻寅木化出巳爻﹐寅能刑巳﹐三刑少申字﹐防申日之危﹐果卒於申日」.
  it('Dần động hóa Tỵ, thiếu Thân → hư nhất đãi dụng, chờ ngày Thân', () => {
    const chart = liuyaoChart({ lines: [6, 7, 8, 7, 7, 8], day: sb(1, 7), month: sb(5, 5) });
    const x = chart.assessment.xing.find((i) => i.kind === 'yinSiShen')!;
    expect(x).toMatchObject({ status: 'virtual', missing: 8 });
    expect(x.weight).toContain('黃金策');
  });
});

describe('tự hình, hợp khởi, hợp trung đới khắc (ca dựng tay)', () => {
  it('乾 tĩnh, ngày Ngọ: hào 4 Ngọ gặp Ngọ → tự hình (điều kiện là quy ước engine)', () => {
    const chart = liuyaoChart({ lines: still('111111'), day: sb(0, 6), month: sb(0, 0) });
    const x = chart.assessment.xing.find((i) => i.kind === 'self')!;
    expect(x).toMatchObject({ branches: [6], positions: [4], active: false });
    expect(x.reasons[0].source).toContain('quy ước của engine');
  });
  it('乾 tĩnh, ngày Sửu: hào 1 Tý tĩnh gặp hợp → hợp khởi', () => {
    const chart = liuyaoChart({ lines: still('111111'), day: sb(1, 1), month: sb(0, 0) });
    expect(chart.assessment.lines[0].he).toMatchObject({ day: true, state: 'heQi' });
    expect(chart.assessment.lines[0].he.reasons[0].effect).toBe(1);
  });
  it('乾 động hào 1: Tý hóa Sửu → hợp trung đới khắc; tháng Tý vượng nên luận hợp (卜筮正宗·合中帶克論)', () => {
    const chart = liuyaoChart({ lines: [9, 7, 7, 7, 7, 7], day: sb(0, 0), month: sb(0, 0) });
    const he = chart.assessment.lines[0].he;
    expect(he).toMatchObject({ change: true, changeKind: 'heWithKe' });
    expect(he.reasons.find((r) => r.key === 'he-change-with-ke')?.effect).toBe(1);
  });
  it('震 động hào 4-5-6 → 益: hào 5 Thân hóa Tỵ là hóa hợp hóa trường sinh; tháng Dần thì là tam hình hội tụ', () => {
    const lines: LineValue[] = [7, 8, 8, 9, 6, 6];
    const plain = liuyaoChart({ lines, day: sb(0, 0), month: sb(0, 0) });
    expect(plain.transformed?.number).toBe(42);
    expect(plain.assessment.lines[4].change?.branch).toBe(5);
    expect(plain.assessment.lines[4].he.changeKind).toBe('heChangSheng');
    expect(plain.assessment.lines[4].he.reasons.find((r) => r.key === 'he-change-changsheng')?.effect).toBe(1);
    const yin = liuyaoChart({ lines, day: sb(0, 0), month: sb(0, 2) });
    expect(yin.assessment.lines[4].he.reasons.find((r) => r.key === 'he-change-changsheng')?.effect).toBe(-1);
  });
  it('hào tĩnh hợp hào tĩnh: không tính hợp (增刪卜易: 「兩爻皆動﹐始爲合」)', () => {
    // 否 tĩnh: ba cặp hào đều hợp nhưng không hào nào động.
    const chart = liuyaoChart({ lines: still('000111'), day: sb(0, 0), month: sb(0, 0) });
    expect(chart.assessment.lines[0].he).toMatchObject({ state: null, staticPairs: [4] });
  });
});

describe('ứng kỳ', () => {
  it('增刪卜易·月破章 辰月戊子日 乾 hóa 夬: phá mà gặp hợp (Mão), hóa Mùi (ngày Mùi về)', () => {
    // Sách: 「卯日有信﹐午未日必歸…應卯日得信者﹐破而逢合之日也。應未日歸者﹐父化未土旬空出空之日到也」.
    const chart = liuyaoChart({ lines: [7, 7, 7, 7, 7, 9], day: sb(4, 0), month: sb(2, 4), useGod: 'self' });
    const t = chart.assessment.timing!;
    expect(t.target).toMatchObject({ kind: 'line', position: 6, branch: 10 });
    expect(hintBranches(chart, 'break-fill')).toEqual([10, 3]);
    expect(hintBranches(chart, 'change-value')).toEqual([10, 7]);
    expect(t.disclaimer).toBe(TIMING_DISCLAIMER);
    expect(t.hints.every((h) => h.source.length > 0)).toBe(true);
  });
  it('增刪卜易·月破章 亥月己丑日 兌 hóa 訟: Quan Quỷ Tỵ nguyệt phá → năm/ngày thực phá Tỵ', () => {
    // Sách: 「前卦官臨月破﹐定於實破之年﹐果於巳年承襲長房世職」.
    const chart = liuyaoChart({ lines: [9, 7, 8, 7, 7, 6], day: sb(5, 1), month: sb(1, 11), topic: 'work' });
    expect(hintBranches(chart, 'break-fill')).toContain(5);
  });
  it('增刪卜易·六沖章 巳月戊戌日 益: Thìn Tài trì Thế tuần không, ngày Tuất xung → ứng ngay', () => {
    // Sách: 「辰土財爻持世，因值旬空，戌日沖空塡實，本日辰得財」.
    const chart = liuyaoChart({ lines: [7, 8, 8, 8, 7, 7], day: sb(4, 10), month: sb(5, 5), topic: 'money' });
    expect(chart.primary.number).toBe(42);
    expect(chart.assessment.useGod!.primary).toBe(3);
    const h = chart.assessment.timing!.hints.find((x) => x.key === 'void-fill')!;
    expect(h.branches).toEqual([10]);
    expect(h.label).toContain('ngay');
  });
  it('dụng thần vắng, có phục thần: gợi ý xung khai phi thần', () => {
    const chart = liuyaoChart({ lines: still('011111'), day: sb(0, 0), month: sb(0, 0), topic: 'money' });
    const t = chart.assessment.timing!;
    expect(t.target).toMatchObject({ kind: 'hidden', position: 2 });
    expect(hintBranches(chart, 'hidden-flying-open')).toEqual([5]); // phi thần Hợi → ngày Tỵ
  });
  it('không có dụng thần → timing null; các khối mới vẫn có và JSON hóa được', () => {
    const chart = liuyaoChart({ lines: [9, 8, 9, 9, 8, 9], day: sb(3, 5), month: sb(1, 3) });
    expect(chart.assessment.timing).toBeNull();
    expect(chart.assessment.sanHe.length).toBe(2);
    expect(JSON.parse(JSON.stringify(chart))).toEqual(chart);
  });
});

describe('nguồn cho mọi lý do mới', () => {
  it('mọi Reason trong các khối mới đều có source', () => {
    const inputs = [
      { lines: [9, 8, 7, 6, 8, 8] as LineValue[], day: sb(2, 0), month: sb(6, 8), topic: 'work' as const },
      { lines: [8, 9, 9, 7, 8, 8] as LineValue[], day: sb(2, 4), month: sb(0, 6), topic: 'money' as const },
      { lines: [8, 8, 7, 9, 8, 6] as LineValue[], day: sb(0, 2), month: sb(0, 10), useGod: 'self' as const },
    ];
    for (const input of inputs) {
      const a = liuyaoChart(input).assessment;
      const rs = [
        ...a.lines.flatMap((l) => l.he.reasons),
        ...a.hexagram.reasons,
        ...a.sanHe.flatMap((s) => s.reasons),
        ...a.xing.flatMap((x) => x.reasons),
        ...(a.useGod?.relationReasons ?? []),
      ];
      expect(rs.length).toBeGreaterThan(0);
      for (const r of rs) expect(r.source).toMatch(/[一-鿿]|engine/);
      for (const h of a.timing?.hints ?? []) expect(h.source.length).toBeGreaterThan(0);
      for (const l of a.lines) if (l.tomb) expect(l.tomb.source).toContain('隨鬼入墓章');
    }
  });
});
