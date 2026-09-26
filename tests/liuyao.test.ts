import { describe, expect, it } from 'vitest';
import type { LineValue } from '../src/lib/cast';
import { hexagramFromTrigrams } from '../src/lib/iching';
import {
  ADVANCE_PAIRS,
  BRANCH_HANZI,
  PALACE_ORDER,
  branchesClash,
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
