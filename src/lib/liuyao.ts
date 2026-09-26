import type { TrigramKey } from '../types/schema';
import { type LineValue, isMoving, isYang, readCast } from './cast';
import { TRIGRAM_BINARY, hexagramBinary, hexagramFromBinary, trigramsOf } from './iching';

// Lục Hào (Nạp Giáp / Hỏa Châu Lâm). Mọi hàm thuần: ngày, tháng, hào đều nhận
// từ ngoài vào. Binary đọc từ hào dưới lên, '1' = dương.

// ---------- Can chi, ngũ hành ----------

/** Can: 0..9 = Giáp..Quý. Chi: 0..11 = Tý..Hợi. */
export type StemBranch = { stem: number; branch: number };

export const STEM_LABELS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const STEM_HANZI = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCH_LABELS = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;
export const BRANCH_HANZI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export const ELEMENT_LABELS: Record<Element, string> = {
  wood: 'Mộc',
  fire: 'Hỏa',
  earth: 'Thổ',
  metal: 'Kim',
  water: 'Thủy',
};

export const BRANCH_ELEMENT: Element[] = [
  'water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water',
];

export const TRIGRAM_ELEMENT: Record<TrigramKey, Element> = {
  qian: 'metal',
  dui: 'metal',
  li: 'fire',
  zhen: 'wood',
  xun: 'wood',
  kan: 'water',
  gen: 'earth',
  kun: 'earth',
};

export const TRIGRAM_LABELS: Record<TrigramKey, string> = {
  qian: 'Càn',
  dui: 'Đoài',
  li: 'Ly',
  zhen: 'Chấn',
  xun: 'Tốn',
  kan: 'Khảm',
  gen: 'Cấn',
  kun: 'Khôn',
};

const GENERATES: Record<Element, Element> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const OVERCOMES: Record<Element, Element> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

/**
 * Quan hệ của `from` tác động lên `to`:
 * sinh (from sinh to), khac (from khắc to), tyhoa (cùng hành),
 * tiet (to sinh from — from bị rút khí), hao (to khắc from — from hao lực).
 */
export type ElementRelation = 'sinh' | 'khac' | 'tyhoa' | 'tiet' | 'hao';
export const ELEMENT_RELATION_LABELS: Record<ElementRelation, string> = {
  sinh: 'sinh',
  khac: 'khắc',
  tyhoa: 'tỷ hòa',
  tiet: 'bị hào sinh (tiết)',
  hao: 'bị hào khắc',
};

export function elementRelation(from: Element, to: Element): ElementRelation {
  if (from === to) return 'tyhoa';
  if (GENERATES[from] === to) return 'sinh';
  if (OVERCOMES[from] === to) return 'khac';
  if (GENERATES[to] === from) return 'tiet';
  return 'hao';
}

function assertStemBranch(sb: StemBranch, what: string): void {
  const { stem, branch } = sb;
  if (!Number.isInteger(stem) || stem < 0 || stem > 9) throw new RangeError(`${what}: can không hợp lệ (${stem})`);
  if (!Number.isInteger(branch) || branch < 0 || branch > 11) throw new RangeError(`${what}: chi không hợp lệ (${branch})`);
  if (stem % 2 !== branch % 2) throw new RangeError(`${what}: can chi lệch âm dương (${stem}, ${branch})`);
}

export function stemBranchLabel({ stem, branch }: StemBranch): string {
  return `${STEM_LABELS[stem]} ${BRANCH_LABELS[branch]}`;
}

// ---------- Bát cung, thế ứng ----------

export type Generation = 'pure' | 'gen1' | 'gen2' | 'gen3' | 'gen4' | 'gen5' | 'wandering' | 'returning';
export const GENERATION_LABELS: Record<Generation, string> = {
  pure: 'Thuần (bát thuần)',
  gen1: 'Nhất thế',
  gen2: 'Nhị thế',
  gen3: 'Tam thế',
  gen4: 'Tứ thế',
  gen5: 'Ngũ thế',
  wandering: 'Du hồn',
  returning: 'Quy hồn',
};
const GENERATION_ORDER: Generation[] = ['pure', 'gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'wandering', 'returning'];
const SHI_OF: Record<Generation, number> = {
  pure: 6, gen1: 1, gen2: 2, gen3: 3, gen4: 4, gen5: 5, wandering: 4, returning: 3,
};

export type PalaceInfo = {
  trigram: TrigramKey;
  label: string;
  element: Element;
  elementLabel: string;
  /** Quẻ thuần đứng đầu cung. */
  pureHexagram: number;
  generation: Generation;
  generationLabel: string;
  /** Thứ tự trong cung, 0..7. */
  index: number;
  shi: number;
  ying: number;
};

const flip = (bin: string, line: number) =>
  bin.slice(0, line - 1) + (bin[line - 1] === '1' ? '0' : '1') + bin.slice(line);

/** Tám quẻ của một cung theo thứ tự: thuần, 1..5 thế, du hồn, quy hồn. */
export function palaceSequence(trigram: TrigramKey): number[] {
  const t = TRIGRAM_BINARY[trigram];
  let bin = t + t;
  const seq = [bin];
  for (let line = 1; line <= 5; line++) {
    bin = flip(bin, line);
    seq.push(bin);
  }
  const wandering = flip(bin, 4);
  seq.push(wandering);
  seq.push(t + wandering.slice(3));
  return seq.map(hexagramFromBinary);
}

/** Thứ tự cung truyền thống: Càn Khảm Cấn Chấn (dương), Tốn Ly Khôn Đoài (âm). */
export const PALACE_ORDER: TrigramKey[] = ['qian', 'kan', 'gen', 'zhen', 'xun', 'li', 'kun', 'dui'];

const PALACE_TABLE = new Map<number, { trigram: TrigramKey; index: number }>();
for (const trigram of PALACE_ORDER) {
  palaceSequence(trigram).forEach((n, index) => PALACE_TABLE.set(n, { trigram, index }));
}

export function palaceOf(n: number): PalaceInfo {
  hexagramBinary(n);
  const { trigram, index } = PALACE_TABLE.get(n)!;
  const generation = GENERATION_ORDER[index];
  const shi = SHI_OF[generation];
  const element = TRIGRAM_ELEMENT[trigram];
  return {
    trigram,
    label: TRIGRAM_LABELS[trigram],
    element,
    elementLabel: ELEMENT_LABELS[element],
    pureHexagram: hexagramFromBinary(TRIGRAM_BINARY[trigram] + TRIGRAM_BINARY[trigram]),
    generation,
    generationLabel: GENERATION_LABELS[generation],
    index,
    shi,
    ying: shi > 3 ? shi - 3 : shi + 3,
  };
}

// ---------- Nạp giáp ----------

type NajiaEntry = { stem: number; branches: [number, number, number] };
/** [nội quái (hào 1-3), ngoại quái (hào 4-6)]. */
export const NAJIA_TABLE: Record<TrigramKey, [NajiaEntry, NajiaEntry]> = {
  qian: [{ stem: 0, branches: [0, 2, 4] }, { stem: 8, branches: [6, 8, 10] }],
  kun: [{ stem: 1, branches: [7, 5, 3] }, { stem: 9, branches: [1, 11, 9] }],
  zhen: [{ stem: 6, branches: [0, 2, 4] }, { stem: 6, branches: [6, 8, 10] }],
  xun: [{ stem: 7, branches: [1, 11, 9] }, { stem: 7, branches: [7, 5, 3] }],
  kan: [{ stem: 4, branches: [2, 4, 6] }, { stem: 4, branches: [8, 10, 0] }],
  li: [{ stem: 5, branches: [3, 1, 11] }, { stem: 5, branches: [9, 7, 5] }],
  gen: [{ stem: 2, branches: [4, 6, 8] }, { stem: 2, branches: [10, 0, 2] }],
  dui: [{ stem: 3, branches: [5, 3, 1] }, { stem: 3, branches: [11, 9, 7] }],
};

export type NajiaLine = { stem: number; branch: number; element: Element };

/** Can chi nạp giáp của sáu hào (index 0 = hào 1). */
export function najia(n: number): NajiaLine[] {
  const { lower, upper } = trigramsOf(n);
  const out: NajiaLine[] = [];
  for (const [trigram, half] of [[lower, 0], [upper, 1]] as const) {
    const e = NAJIA_TABLE[trigram][half];
    for (const branch of e.branches) out.push({ stem: e.stem, branch, element: BRANCH_ELEMENT[branch] });
  }
  return out;
}

// ---------- Lục thân ----------

export type LiuQin = 'brother' | 'parent' | 'child' | 'wealth' | 'officer';
export const LIUQIN_KEYS: LiuQin[] = ['parent', 'brother', 'child', 'wealth', 'officer'];
export const LIUQIN_LABELS: Record<LiuQin, string> = {
  brother: 'Huynh Đệ',
  parent: 'Phụ Mẫu',
  child: 'Tử Tôn',
  wealth: 'Thê Tài',
  officer: 'Quan Quỷ',
};

export function liuqinOf(palaceElement: Element, lineElement: Element): LiuQin {
  switch (elementRelation(lineElement, palaceElement)) {
    case 'tyhoa':
      return 'brother';
    case 'sinh':
      return 'parent';
    case 'tiet':
      return 'child';
    case 'hao':
      return 'wealth';
    default:
      return 'officer';
  }
}

// ---------- Lục thần ----------

export type Spirit = 'greenDragon' | 'vermilionBird' | 'hookChen' | 'soaringSnake' | 'whiteTiger' | 'blackTortoise';
export const SPIRIT_ORDER: Spirit[] = ['greenDragon', 'vermilionBird', 'hookChen', 'soaringSnake', 'whiteTiger', 'blackTortoise'];
export const SPIRIT_LABELS: Record<Spirit, string> = {
  greenDragon: 'Thanh Long',
  vermilionBird: 'Chu Tước',
  hookChen: 'Câu Trần',
  soaringSnake: 'Đằng Xà',
  whiteTiger: 'Bạch Hổ',
  blackTortoise: 'Huyền Vũ',
};
const SPIRIT_START = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5];

/** Lục thần từ hào 1 lên hào 6 theo can ngày. */
export function sixSpirits(dayStem: number): Spirit[] {
  if (!Number.isInteger(dayStem) || dayStem < 0 || dayStem > 9) throw new RangeError(`Can ngày không hợp lệ: ${dayStem}`);
  const s = SPIRIT_START[dayStem];
  return [0, 1, 2, 3, 4, 5].map((i) => SPIRIT_ORDER[(s + i) % 6]);
}

// ---------- Không vong ----------

/** Hai chi không vong (tuần không) của ngày: hai chi không có trong tuần giáp chứa ngày đó. */
export function voidBranches(day: StemBranch): [number, number] {
  assertStemBranch(day, 'Ngày');
  const start = (day.branch - day.stem + 12) % 12;
  return [(start + 10) % 12, (start + 11) % 12];
}

// ---------- Quẻ hỗ ----------

/** Quẻ hỗ: hào 2-4 làm quái dưới, hào 3-5 làm quái trên. */
export function mutualHexagram(n: number): number {
  const b = hexagramBinary(n);
  return hexagramFromBinary(b.slice(1, 4) + b.slice(2, 5));
}

// ---------- Phục thần ----------

export type HiddenSpirit = {
  liuqin: LiuQin;
  liuqinLabel: string;
  position: number;
  stem: number;
  branch: number;
  element: Element;
  label: string;
  /** Phi thần: hào của quẻ chính mà phục thần nằm dưới. */
  flying: { liuqin: LiuQin; liuqinLabel: string; stem: number; branch: number; element: Element; label: string };
};

function lineLabel(l: NajiaLine): string {
  return `${STEM_LABELS[l.stem]} ${BRANCH_LABELS[l.branch]} ${ELEMENT_LABELS[l.element]}`;
}

/**
 * Lục thân vắng mặt trong quẻ → lấy từ quẻ thuần của cung ở cùng vị trí hào.
 * Nếu trong quẻ thuần lục thân đó xuất hiện hai lần thì trả về cả hai.
 */
export function hiddenSpirits(n: number): HiddenSpirit[] {
  const palace = palaceOf(n);
  const lines = najia(n);
  const present = new Set(lines.map((l) => liuqinOf(palace.element, l.element)));
  const pure = najia(palace.pureHexagram);
  const out: HiddenSpirit[] = [];
  pure.forEach((l, i) => {
    const q = liuqinOf(palace.element, l.element);
    if (present.has(q)) return;
    const f = lines[i];
    const fq = liuqinOf(palace.element, f.element);
    out.push({
      liuqin: q,
      liuqinLabel: LIUQIN_LABELS[q],
      position: i + 1,
      stem: l.stem,
      branch: l.branch,
      element: l.element,
      label: `${LIUQIN_LABELS[q]} ${lineLabel(l)}`,
      flying: { liuqin: fq, liuqinLabel: LIUQIN_LABELS[fq], stem: f.stem, branch: f.branch, element: f.element, label: `${LIUQIN_LABELS[fq]} ${lineLabel(f)}` },
    });
  });
  return out;
}

// ---------- Dụng thần ----------

export type Topic = 'work' | 'money' | 'love' | 'health' | 'travel' | 'study';
export const TOPIC_LABELS: Record<Topic, string> = {
  work: 'Công danh, công việc',
  money: 'Tiền bạc',
  love: 'Tình cảm, hôn nhân',
  health: 'Sức khỏe',
  travel: 'Đi lại, xuất hành',
  study: 'Học hành, thi cử',
};
export type Gender = 'male' | 'female';
/** Dụng thần: một lục thân, hoặc 'self' = hào Thế. */
export type UseGodKey = LiuQin | 'self';

export type UseGod = {
  key: UseGodKey;
  label: string;
  /** Vị trí hào (1..6) mang dụng thần trong quẻ chính; rỗng nếu vắng (xem phục thần). */
  positions: number[];
  /** Phục thần tương ứng nếu dụng thần vắng mặt. */
  hidden: HiddenSpirit[];
  explanation: string;
  notes: { key: LiuQin; label: string; text: string }[];
  overridden: boolean;
  /** Trích dẫn nguồn cổ thư cho cách chọn dụng thần này. */
  source: string;
};

/**
 * Nguồn cho từng loại dụng thần (xem docs/luc-hao-nguon.md).
 * 增刪卜易 = Tăng San Bốc Dịch (bản Wikisource); 卜筮正宗 = Bốc Phệ Chính Tông (bản quanxue.cn).
 */
export const USE_GOD_SOURCES: Record<UseGodKey, string> = {
  parent: '增刪卜易·用神章第八; 卜筮正宗·用神分類定例第一',
  officer: '增刪卜易·用神章第八; 卜筮正宗·用神分類定例第一',
  brother: '增刪卜易·用神章第八; 卜筮正宗·用神分類定例第一',
  wealth: '增刪卜易·用神章第八, 求財章第六十八; 卜筮正宗·用神分類定例第一',
  child: '增刪卜易·用神章第八; 卜筮正宗·用神分類定例第一',
  self: '卜筮正宗·世應論用神第二; 增刪卜易·疾病章第九十九, 出行章第九十一',
};

export function suggestUseGod(
  topic: Topic,
  askerGender?: Gender,
): Pick<UseGod, 'key' | 'explanation' | 'notes' | 'source'> {
  const note = (key: LiuQin, text: string) => ({ key, label: LIUQIN_LABELS[key], text });
  const withSource = (r: Pick<UseGod, 'key' | 'explanation' | 'notes'>) => ({ ...r, source: USE_GOD_SOURCES[r.key] });
  switch (topic) {
    case 'work':
      // 增刪卜易·用神章: 「占功名、官府……皆以官鬼爻爲用神」
      return withSource({ key: 'officer', explanation: 'Hỏi công danh, chức vị: lấy Quan Quỷ làm dụng thần.', notes: [] });
    case 'money':
      // 增刪卜易·求財章: 「公私占卜皆以財爲用神」; 子孫 là nguyên thần của Tài.
      return withSource({
        key: 'wealth',
        explanation: 'Hỏi tiền bạc, lợi lộc: lấy Thê Tài làm dụng thần.',
        notes: [note('child', 'Tử Tôn sinh Thê Tài (nguyên thần của Tài).'), note('brother', 'Huynh Đệ là kiếp tài (kỵ thần của Tài).')],
      });
    case 'love':
      // 增刪卜易·用神章: 妻占夫 → 官鬼; 占妻妾 → 妻財.
      return askerGender === 'female'
        ? withSource({ key: 'officer', explanation: 'Nữ hỏi tình duyên: lấy Quan Quỷ (chồng, người yêu) làm dụng thần.', notes: [] })
        : withSource({
            key: 'wealth',
            explanation:
              askerGender === 'male'
                ? 'Nam hỏi tình duyên: lấy Thê Tài (vợ, người yêu) làm dụng thần.'
                : 'Chưa rõ giới tính người hỏi: tạm lấy Thê Tài; nếu người hỏi là nữ thì dùng Quan Quỷ.',
            notes: [],
          });
    case 'health':
      // 卜筮正宗·世應論用神: 「凡占自己疾病……以世爻为用也」; 用神分類: 病症 → 官鬼, 药材 → 子孫.
      return withSource({
        key: 'self',
        explanation: 'Tự hỏi sức khỏe: lấy hào Thế (bản thân) làm dụng thần.',
        notes: [note('officer', 'Quan Quỷ là bệnh tật.'), note('child', 'Tử Tôn là thuốc, thầy thuốc (khắc Quan Quỷ).')],
      });
    case 'travel':
      // 卜筮正宗·世應論用神: 「或问出行吉凶……以世爻为用」; 增刪卜易·出行章: 父 là 「舟車行李」.
      return withSource({
        key: 'self',
        explanation: 'Tự hỏi đi lại: lấy hào Thế (bản thân) làm dụng thần.',
        notes: [note('parent', 'Phụ Mẫu là xe cộ, giấy tờ, hành lý.')],
      });
    case 'study':
      // 增刪卜易·用神章: 章奏、文書 → 父母; 童試章: 「父旺官興﹐堪期首選」 (thi cử xem thêm Quan Quỷ).
      return withSource({
        key: 'parent',
        explanation: 'Hỏi học hành, thi cử, văn thư: lấy Phụ Mẫu làm dụng thần.',
        notes: [note('officer', 'Thi cử: Quan Quỷ là công danh, đỗ đạt; nên vượng cùng Phụ Mẫu.')],
      });
  }
}

// ---------- Lá quẻ đầy đủ ----------

export type LineRelation = { relation: ElementRelation; label: string };

export type ChartLine = {
  position: number;
  value: LineValue;
  yang: boolean;
  moving: boolean;
  stem: number;
  branch: number;
  stemLabel: string;
  branchLabel: string;
  hanzi: string;
  element: Element;
  elementLabel: string;
  liuqin: LiuQin;
  liuqinLabel: string;
  spirit: Spirit;
  spiritLabel: string;
  shi: boolean;
  ying: boolean;
  void: boolean;
  /** Tác động của nhật thần lên hào. */
  day: LineRelation;
  /** Tác động của nguyệt lệnh lên hào. */
  month: LineRelation;
  /** Hào động hóa ra (can chi lấy từ quẻ biến, lục thân vẫn theo cung quẻ chính). */
  changed: null | {
    yang: boolean;
    stem: number;
    branch: number;
    hanzi: string;
    element: Element;
    elementLabel: string;
    liuqin: LiuQin;
    liuqinLabel: string;
    void: boolean;
    label: string;
  };
  /** Phục thần nằm dưới hào này (nếu có). */
  hidden: HiddenSpirit[];
  label: string;
};

export type TimePillar = {
  stem: number;
  branch: number;
  label: string;
  element: Element;
  elementLabel: string;
};

export type LiuyaoInput = {
  lines: LineValue[];
  day: StemBranch;
  month: StemBranch;
  topic?: Topic;
  askerGender?: Gender;
  /** Người dùng tự chọn dụng thần, ghi đè gợi ý theo chủ đề. */
  useGod?: UseGodKey;
};

export type HexagramRef = { number: number; binary: string; lower: TrigramKey; upper: TrigramKey };

export type LiuyaoChart = {
  primary: HexagramRef;
  palace: PalaceInfo;
  transformed: (HexagramRef & { palace: PalaceInfo }) | null;
  mutual: HexagramRef;
  moving: number[];
  day: TimePillar;
  month: TimePillar;
  void: { branches: [number, number]; labels: [string, string] };
  lines: ChartLine[];
  hidden: HiddenSpirit[];
  missing: { key: LiuQin; label: string }[];
  useGod: UseGod | null;
  /** Phân tích vượng suy theo nguyệt lệnh, nhật thần, hào động, tuần không (xem assessChart). */
  assessment: ChartAssessment;
};

function ref(n: number): HexagramRef {
  const { lower, upper } = trigramsOf(n);
  return { number: n, binary: hexagramBinary(n), lower, upper };
}

function pillar(sb: StemBranch): TimePillar {
  const element = BRANCH_ELEMENT[sb.branch];
  return { stem: sb.stem, branch: sb.branch, label: stemBranchLabel(sb), element, elementLabel: ELEMENT_LABELS[element] };
}

function rel(from: Element, to: Element): LineRelation {
  const relation = elementRelation(from, to);
  return { relation, label: ELEMENT_RELATION_LABELS[relation] };
}

export function liuyaoChart(input: LiuyaoInput): LiuyaoChart {
  const { lines: values, day, month, topic, askerGender } = input;
  assertStemBranch(day, 'Ngày');
  assertStemBranch(month, 'Tháng');
  const cast = readCast(values);
  const n = cast.primary;
  const palace = palaceOf(n);
  const nj = najia(n);
  const njChanged = cast.transformed ? najia(cast.transformed) : null;
  const spirits = sixSpirits(day.stem);
  const voids = voidBranches(day);
  const hidden = hiddenSpirits(n);
  const dayEl = BRANCH_ELEMENT[day.branch];
  const monthEl = BRANCH_ELEMENT[month.branch];

  const lines: ChartLine[] = values.map((value, i) => {
    const l = nj[i];
    const position = i + 1;
    const liuqin = liuqinOf(palace.element, l.element);
    const moving = isMoving(value);
    let changed: ChartLine['changed'] = null;
    if (moving && njChanged) {
      const c = njChanged[i];
      const cq = liuqinOf(palace.element, c.element);
      changed = {
        yang: !isYang(value),
        stem: c.stem,
        branch: c.branch,
        hanzi: STEM_HANZI[c.stem] + BRANCH_HANZI[c.branch],
        element: c.element,
        elementLabel: ELEMENT_LABELS[c.element],
        liuqin: cq,
        liuqinLabel: LIUQIN_LABELS[cq],
        void: voids.includes(c.branch),
        label: `${LIUQIN_LABELS[cq]} ${lineLabel(c)}`,
      };
    }
    return {
      position,
      value,
      yang: isYang(value),
      moving,
      stem: l.stem,
      branch: l.branch,
      stemLabel: STEM_LABELS[l.stem],
      branchLabel: BRANCH_LABELS[l.branch],
      hanzi: STEM_HANZI[l.stem] + BRANCH_HANZI[l.branch],
      element: l.element,
      elementLabel: ELEMENT_LABELS[l.element],
      liuqin,
      liuqinLabel: LIUQIN_LABELS[liuqin],
      spirit: spirits[i],
      spiritLabel: SPIRIT_LABELS[spirits[i]],
      shi: palace.shi === position,
      ying: palace.ying === position,
      void: voids.includes(l.branch),
      day: rel(dayEl, l.element),
      month: rel(monthEl, l.element),
      changed,
      hidden: hidden.filter((h) => h.position === position),
      label: `${LIUQIN_LABELS[liuqin]} ${lineLabel(l)}`,
    };
  });

  const present = new Set(lines.map((l) => l.liuqin));
  const missing = LIUQIN_KEYS.filter((k) => !present.has(k)).map((key) => ({ key, label: LIUQIN_LABELS[key] }));

  let useGod: UseGod | null = null;
  if (input.useGod || topic) {
    const suggestion = topic ? suggestUseGod(topic, askerGender) : null;
    const key = input.useGod ?? suggestion!.key;
    const overridden = !!input.useGod && (!suggestion || suggestion.key !== input.useGod);
    const label = key === 'self' ? 'Hào Thế (bản thân)' : LIUQIN_LABELS[key];
    const positions = key === 'self' ? [palace.shi] : lines.filter((l) => l.liuqin === key).map((l) => l.position);
    const explanation = overridden
      ? `Người dùng chọn dụng thần: ${label}.` + (suggestion ? ` (Gợi ý theo chủ đề: ${suggestion.explanation})` : '')
      : suggestion!.explanation;
    useGod = {
      key,
      label,
      positions,
      hidden: key === 'self' ? [] : hidden.filter((h) => h.liuqin === key),
      explanation,
      notes: suggestion && !overridden ? suggestion.notes : [],
      overridden,
      source: USE_GOD_SOURCES[key],
    };
  }

  const base: Omit<LiuyaoChart, 'assessment'> = {
    primary: ref(n),
    palace,
    transformed: cast.transformed ? { ...ref(cast.transformed), palace: palaceOf(cast.transformed) } : null,
    mutual: ref(mutualHexagram(n)),
    moving: cast.moving,
    day: pillar(day),
    month: pillar(month),
    void: { branches: voids, labels: [BRANCH_LABELS[voids[0]], BRANCH_LABELS[voids[1]]] },
    lines,
    hidden,
    missing,
    useGod,
  };
  return { ...base, assessment: assessChart(base) };
}


// ---------- Phân tích vượng suy (assessChart) ----------
//
// Mỗi quy tắc dưới đây có trích dẫn trong docs/luc-hao-nguon.md. Chuỗi `source`
// đi kèm mỗi lý do để giao diện có thể hiện nguồn. Riêng cách cộng điểm để ra
// kết luận "vượng / cân bằng / suy" là quy ước của engine, không có nguyên văn.

const SRC = {
  monthStatus: '火珠林·財官輔助; 卜筮正宗·旺相休囚論第十三',
  monthBreak: '卜筮正宗·月破定例; 增刪卜易·月破章第二十七',
  trueBreak: '卜筮正宗·月破論第九',
  breakNotBroken: '增刪卜易·日辰章第十七',
  day: '增刪卜易·日辰章第十七',
  hiddenMove: '增刪卜易·暗動章第二十二, 日辰章第十七; 黃金策·總斷千金賦',
  dayBreak: '增刪卜易·日辰章第十七, 六沖章第二十',
  movingClashed: '增刪卜易·動散章第二十三',
  moving: '卜筮正宗·用神發動訣',
  movingOthers: '增刪卜易·動靜生克章第十四',
  progress: '卜筮正宗·變出進退神論第十七; 增刪卜易·進神退神章第二十九',
  returnRel: '增刪卜易·動變生克沖合章第十五',
  clashBack: '增刪卜易·六沖章第二十',
  changeVoid: '增刪卜易·旬空章第二十六, 元神忌神衰旺章第十',
  changeBreak: '增刪卜易·元神忌神衰旺章第十',
  changeTomb: '增刪卜易·月將章第十六; 卜筮正宗·四生逐位論第八',
  void: '卜筮正宗·旬空論第十; 增刪卜易·旬空章第二十六',
  hidden: '增刪卜易·飛伏神章第二十八',
  standIn: '增刪卜易·飛伏神章第二十八, 月將章第十六',
  roles: '增刪卜易·用神元神忌神仇神章第九; 卜筮正宗·原忌仇神論第四',
  greed: '卜筮正宗·原忌仇神論第四; 增刪卜易·元神忌神衰旺章第十',
  pickStrongest: '增刪卜易·用神元神忌神仇神章第九',
  engine: 'Quy ước của engine (chưa tìm được nguyên văn)',
  // Lục hợp, tam hợp, tam hình, mộ, phản/phục ngâm, ứng kỳ (xem docs/luc-hao-nguon.md mục 10–15).
  he: '增刪卜易·六合章第十九',
  heBan: '增刪卜易·六合章第十九; 黃金策·總斷千金賦',
  heBothMoving: '增刪卜易·增刪黃金策千金賦章第三十四',
  heWithKe: '卜筮正宗·合中帶克論第十四',
  heClash: '卜筮正宗·合處逢沖沖中逢合論第十五, 十八問答第十一問; 增刪卜易·六沖章第二十',
  breakHe: '增刪卜易·月破章第二十七; 卜筮正宗·月破論第九',
  hexHe: '增刪卜易·六合章第十九',
  hexClash: '增刪卜易·六沖章第二十',
  hexTransition: '增刪卜易·六合章第十九, 六沖章第二十; 卜筮正宗·合處逢沖沖中逢合論第十五',
  hexDay: '卜筮正宗·十八問答第十三問',
  sanHe: '增刪卜易·六合章第十九',
  sanHeWait: '增刪卜易·增刪黃金策千金賦章第三十四, 六合章第十九; 卜筮正宗·十八問答第四問',
  sanHeEffect: '卜筮正宗·十八問答第四問; 增刪卜易·六合章第十九',
  xing: '卜筮正宗·三刑六害歌; 增刪卜易·三刑章第二十一',
  xingWeight: '增刪卜易·三刑章第二十一; 卜筮正宗·十八問答第十四問',
  xingWait: '增刪卜易·增刪黃金策千金賦章第三十四',
  selfXing: '卜筮正宗·三刑六害歌 (danh sách); điều kiện "gặp chính nó" là quy ước của engine (chưa tìm được nguyên văn)',
  tomb: '增刪卜易·隨鬼入墓章第三十, 各門類題頭總注章第又二十六',
  tombMonth: '增刪卜易·隨鬼入墓章第三十 (ví dụ 戌月甲寅日: 「又入月德之墓」)',
  tombGenuine: '增刪卜易·隨鬼入墓章第三十',
  tombJi: '黃金策·總斷千金賦; 增刪卜易·增刪黃金策千金賦章第三十四',
  fanYinTrigram: '卜筮正宗·反吟卦定例第十一',
  fanYinBranch: '卜筮正宗·反吟卦定例第十一; 增刪卜易·反伏章第二十五',
  fuYin: '卜筮正宗·伏吟卦定例第十二; 增刪卜易·反伏章第二十五',
  lineFanFu: '卜筮正宗·反吟卦定例第十一, 四生逐位論第八',
  fanYinUseGod: '卜筮正宗·十八問答第五問; 增刪卜易·反伏章第二十五',
  timing: '增刪卜易·各門類應期總注章第又二十六',
  timingVoid: '卜筮正宗·旬空論第十; 增刪卜易·各門類應期總注章第又二十六, 六沖章第二十',
  timingBreak: '增刪卜易·月破章第二十七, 各門類應期總注章第又二十六; 卜筮正宗·月破論第九',
  timingHe: '增刪卜易·各門類應期總注章第又二十六, 增刪黃金策千金賦章第三十四; 黃金策·總斷千金賦',
  timingTomb: '增刪卜易·各門類應期總注章第又二十六, 隨鬼入墓章第三十; 黃金策·總斷千金賦',
  timingHidden: '黃金策·總斷千金賦; 增刪卜易·增刪黃金策千金賦章第三十四',
  timingFuYin: '增刪卜易·反伏章第二十五',
} as const;

/** Lục xung: Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu, Thìn-Tuất, Tỵ-Hợi (增刪卜易·六沖章). */
export function branchesClash(a: number, b: number): boolean {
  return (a + 6) % 12 === b;
}

/** Vượng tướng hưu tù tử của hào so với hành của chi tháng. */
export type MonthStatus = 'wang' | 'xiang' | 'xiu' | 'qiu' | 'si';
export const MONTH_STATUS_LABELS: Record<MonthStatus, string> = {
  wang: 'Vượng',
  xiang: 'Tướng',
  xiu: 'Hưu',
  qiu: 'Tù',
  si: 'Tử',
};

/**
 * Cùng hành với tháng = vượng; tháng sinh hào = tướng; hào sinh tháng = hưu;
 * hào khắc tháng = tù; tháng khắc hào = tử. Khớp bảng bốn mùa của 火珠林 cho các
 * tháng Dần Mão / Tỵ Ngọ / Thân Dậu / Hợi Tý, và 「四季之月土旺金相」 của 卜筮正宗
 * cho tháng Thìn Tuất Sửu Mùi. Hưu/tù/tử trong tháng Thổ suy theo cùng công thức
 * (chưa tìm được nguyên văn).
 */
export function monthStatus(monthElement: Element, lineElement: Element): MonthStatus {
  switch (elementRelation(monthElement, lineElement)) {
    case 'tyhoa':
      return 'wang';
    case 'sinh':
      return 'xiang';
    case 'tiet':
      return 'xiu';
    case 'hao':
      return 'qiu';
    default:
      return 'si';
  }
}
const strongStatus = (s: MonthStatus) => s === 'wang' || s === 'xiang';

/** Tiến thần (卜筮正宗·變出進退神論第十七): Hợi→Tý, Sửu→Thìn, Dần→Mão, Thìn→Mùi, Tỵ→Ngọ, Mùi→Tuất, Thân→Dậu, Tuất→Sửu. Thoái thần là chiều ngược lại. */
export const ADVANCE_PAIRS: [number, number][] = [
  [11, 0], [1, 4], [2, 3], [4, 7], [5, 6], [7, 10], [8, 9], [10, 1],
];
export type Progress = 'advance' | 'retreat';
export const PROGRESS_LABELS: Record<Progress, string> = { advance: 'Hóa tiến thần', retreat: 'Hóa thoái thần' };

export function progressOf(from: number, to: number): Progress | null {
  if (ADVANCE_PAIRS.some(([a, b]) => a === from && b === to)) return 'advance';
  if (ADVANCE_PAIRS.some(([a, b]) => b === from && a === to)) return 'retreat';
  return null;
}

/** Mộ và tuyệt của ngũ hành (卜筮正宗·四生逐位論第八; Thủy Thổ chung). */
export const TOMB_BRANCH: Record<Element, number> = { fire: 10, metal: 1, water: 4, earth: 4, wood: 7 };
export const EXTINCTION_BRANCH: Record<Element, number> = { fire: 11, metal: 2, water: 5, earth: 5, wood: 8 };

export type Reason = {
  key: string;
  label: string;
  /** +1 thêm lực, -1 giảm lực, 0 chỉ ghi chú. */
  effect: -1 | 0 | 1;
  source: string;
};

export type Strength = 'strong' | 'balanced' | 'weak';
export const STRENGTH_LABELS: Record<Strength, string> = {
  strong: 'Vượng, có lực',
  balanced: 'Cân bằng',
  weak: 'Suy, vô lực',
};
export type StrengthVerdict = { key: Strength; label: string; score: number; reasons: Reason[] };

export type MonthBreakKind = 'broken' | 'trueBroken' | 'brokenNotBroken';
export const MONTH_BREAK_LABELS: Record<MonthBreakKind, string> = {
  broken: 'Nguyệt phá (ra khỏi tháng, đến ngày thực phá hoặc ngày hợp thì hết phá)',
  trueBroken: 'Chân phá (tĩnh, lại tuần không hoặc bị khắc, không được sinh: phá đến cùng)',
  brokenNotBroken: 'Phá mà không phá (hào lâm nhật thần)',
};

export type DayClashKind = 'hiddenMove' | 'dayBreak' | 'movingClashed';
export const DAY_CLASH_LABELS: Record<DayClashKind, string> = {
  hiddenMove: 'Ám động (tĩnh, có khí, bị nhật thần xung)',
  dayBreak: 'Nhật phá (tĩnh, hưu tù, bị nhật thần xung tán)',
  movingClashed: 'Hào động bị nhật thần xung (vượng tướng thì không tán; hưu tù hiếm khi tán)',
};

export type VoidKind = 'false' | 'true';
export const VOID_KIND_LABELS: Record<VoidKind, string> = {
  false: 'Giả không: tuần không nhưng có dụng, chờ xuất tuần hoặc ngày xung thực',
  true: 'Chân không: không đến cùng',
};

export type ChangeRelation = 'returnSheng' | 'returnKe' | 'same' | 'drain' | 'exhaust';
export const CHANGE_RELATION_LABELS: Record<ChangeRelation, string> = {
  returnSheng: 'Hồi đầu sinh',
  returnKe: 'Hồi đầu khắc',
  same: 'Hóa tỷ hòa',
  drain: 'Hóa tiết (hào động sinh hào biến)',
  exhaust: 'Hóa khắc xuất (hào động khắc hào biến)',
};

export type LineAssessment = {
  position: number;
  branch: number;
  element: Element;
  moving: boolean;
  month: {
    status: MonthStatus;
    label: string;
    /** Hào trùng chi tháng (lâm nguyệt kiến). */
    sameBranch: boolean;
    break: null | { kind: MonthBreakKind; label: string };
  };
  day: {
    relation: ElementRelation;
    label: string;
    /** Hào trùng chi ngày (lâm nhật thần). */
    sameBranch: boolean;
    clash: null | { kind: DayClashKind; label: string };
  };
  void: null | { kind: VoidKind; label: string; reasons: string[] };
  change: null | {
    branch: number;
    element: Element;
    relation: ChangeRelation;
    relationLabel: string;
    progress: Progress | null;
    progressLabel: string | null;
    /** Hóa hồi đầu xung (hào biến xung hào động). */
    clashBack: boolean;
    /** Hóa không: hào biến rơi vào tuần không. */
    void: boolean;
    /** Hóa phá: hào biến bị nguyệt kiến xung. */
    monthBreak: boolean;
    tomb: boolean;
    extinction: boolean;
    /** Hào phản ngâm: hào biến xung hào động (卜筮正宗·反吟卦定例: 「变出相冲，乃爻之反吟」). */
    fanYin: boolean;
    /** Hào phục ngâm: hào biến cùng chi với hào động (卜筮正宗·四生逐位論: 「午火帝旺于午为伏吟」). */
    fuYin: boolean;
  };
  /** Vị trí các hào động / ám động khác sinh hào này. */
  movingSupport: number[];
  /** Vị trí các hào động / ám động khác khắc hào này. */
  movingAttack: number[];
  strength: StrengthVerdict;
  /** Lục hợp của hào (hợp nhật, hợp nguyệt, hợp hào động, hóa hợp; hợp khởi / hợp bán; hợp xứ phùng xung…). Không cộng vào `strength`. */
  he: LineHarmony;
  /** Nhập mộ (nhật mộ, nguyệt mộ, động mộ, hóa mộ; tùy quỷ nhập mộ). Không cộng vào `strength`. */
  tomb: LineTomb | null;
};

/** Lục hợp: Tý-Sửu, Dần-Hợi, Mão-Tuất, Thìn-Dậu, Tỵ-Thân, Ngọ-Mùi (增刪卜易·六合章). */
export function branchesCombine(a: number, b: number): boolean {
  return (a + b) % 12 === 1;
}

export type HeState = 'heQi' | 'heBan' | 'heHao';
export const HE_STATE_LABELS: Record<HeState, string> = {
  heQi: 'Hợp khởi (tĩnh gặp hợp: tuy hưu tù cũng có ý vượng)',
  heBan: 'Hợp bán / hợp trú (động gặp hợp nhật nguyệt: bị trói, chờ ngày xung khai)',
  heHao: 'Hợp hảo (hào động hợp hào động: hòa hảo, giúp nhau)',
};
export type HeChange = 'huaFu' | 'heWithKe' | 'heChangSheng';
export const HE_CHANGE_LABELS: Record<HeChange, string> = {
  huaFu: 'Hóa hợp — hóa phù (hào biến quay lại hợp: được giúp)',
  heWithKe: 'Hợp trung đới khắc (vượng, được sinh thì luận hợp; suy, bị khắc thì luận khắc)',
  heChangSheng: 'Thân hóa Tỵ: hóa hợp hóa trường sinh, không luận khắc',
};
export type HeClashPattern = 'heChuFengChong' | 'chongZhongFengHe';
export const HE_CLASH_LABELS: Record<HeClashPattern, string> = {
  heChuFengChong: 'Hợp xứ phùng xung (đang hợp gặp xung: mưu tuy thành mà rốt cuộc tan)',
  chongZhongFengHe: 'Xung trung phùng hợp (đang xung gặp hợp: việc đã tan rồi lại thành)',
};

export type LineHarmony = {
  /** Hợp nhật thần. */
  day: boolean;
  /** Hợp nguyệt kiến. */
  month: boolean;
  /** Các hào động / ám động hợp hào này. */
  moving: number[];
  /** Hóa hợp: hào biến hợp chính hào động này. */
  change: boolean;
  state: HeState | null;
  stateLabel: string | null;
  changeKind: HeChange | null;
  changeKindLabel: string | null;
  /** Hào tĩnh hợp hào tĩnh: 增刪卜易 không tính (「兩爻皆動﹐始爲合」), chỉ liệt kê. */
  staticPairs: number[];
  patterns: HeClashPattern[];
  reasons: Reason[];
};

export type TombKind = 'day' | 'month' | 'moving' | 'change';
export const TOMB_KIND_LABELS: Record<TombKind, string> = {
  day: 'nhật mộ',
  month: 'nguyệt mộ',
  moving: 'động mộ',
  change: 'hóa mộ',
};
export type LineTomb = {
  /** Chi mộ của hành hào. */
  branch: number;
  kinds: TombKind[];
  /** Các hào động mang chi mộ (động mộ). */
  movingPositions: number[];
  /** Tùy quỷ nhập mộ: hào Thế mang Quan Quỷ nhập mộ. */
  withGhost: boolean;
  /** Nhập mộ thật (增刪卜易: chỉ khi hưu tù, bị khắc, mộ không bị phá). */
  genuine: boolean;
  reasons: string[];
  /** Chi xung khai mộ. */
  openBranch: number;
  label: string;
  source: string;
};

export type HiddenVerdict = 'usable' | 'unusable' | 'mixed';
export const HIDDEN_VERDICT_LABELS: Record<HiddenVerdict, string> = {
  usable: 'Phục thần hữu dụng (tuy không hiện cũng như hiện)',
  unusable: 'Phục thần vô dụng (tuy có như không, rốt cuộc không ra được)',
  mixed: 'Phục thần vừa có điều kiện hữu dụng vừa có điều kiện vô dụng',
};

export type HiddenAssessment = {
  position: number;
  branch: number;
  element: Element;
  label: string;
  monthStatus: MonthStatus;
  monthStatusLabel: string;
  monthBreak: boolean;
  void: null | { kind: VoidKind; label: string };
  useful: Reason[];
  useless: Reason[];
  verdict: HiddenVerdict;
  verdictLabel: string;
};

export type StandIn = { pillar: 'day' | 'month'; branch: number; label: string; source: string };

export type Role = 'yuan' | 'ji' | 'chou';
export const ROLE_LABELS: Record<Role, string> = { yuan: 'Nguyên thần', ji: 'Kỵ thần', chou: 'Cừu thần' };
const ROLE_DEFINITIONS: Record<Role, string> = {
  yuan: 'Hào sinh dụng thần.',
  ji: 'Hào khắc dụng thần.',
  chou: 'Hào khắc nguyên thần và sinh kỵ thần.',
};

export type RoleLine = {
  position: number;
  label: string;
  moving: boolean;
  hiddenMove: boolean;
  monthStatus: MonthStatus;
  monthStatusLabel: string;
  strength: Strength;
  strengthLabel: string;
  score: number;
};

export type RoleInfo = {
  role: Role;
  roleLabel: string;
  definition: string;
  liuqin: LiuQin;
  liuqinLabel: string;
  element: Element;
  present: boolean;
  moving: boolean;
  hiddenMove: boolean;
  lines: RoleLine[];
};

export type UseGodAssessment = {
  key: UseGodKey;
  label: string;
  /** Lục thân dùng để suy nguyên/kỵ/cừu (với 'self' là lục thân của hào Thế). */
  liuqin: LiuQin;
  element: Element;
  positions: number[];
  /** Hào dụng thần được chọn khi xuất hiện nhiều lần (lấy hào vượng nhất). */
  primary: number | null;
  primaryNote: string | null;
  hidden: HiddenAssessment[];
  /** Dụng thần vắng mà nhật/nguyệt kiến chính là lục thân đó → lấy nhật/nguyệt làm dụng thần. */
  standIns: StandIn[];
  verdict: StrengthVerdict;
  yuan: RoleInfo;
  ji: RoleInfo;
  chou: RoleInfo;
  notes: { key: string; label: string; source: string }[];
  /**
   * Tác động của lục hợp, tam hợp, tam hình, mộ, phản/phục ngâm, lục hợp/lục xung quẻ lên dụng thần.
   * Chỉ để hiển thị: KHÔNG cộng vào `verdict.score` (giữ tương thích; sách không cho trọng số).
   */
  relationReasons: Reason[];
};

// ---------- Quẻ lục hợp / lục xung, phản ngâm / phục ngâm ----------

export type HexPattern = 'sixHe' | 'sixClash';
export const HEX_PATTERN_LABELS: Record<HexPattern, string> = {
  sixHe: 'Quẻ lục hợp (hào 1-4, 2-5, 3-6 đều hợp)',
  sixClash: 'Quẻ lục xung (hào 1-4, 2-5, 3-6 đều xung)',
};
export type HexTransition = 'heToClash' | 'clashToHe' | 'clashToClash' | 'heToHe';
export const HEX_TRANSITION_LABELS: Record<HexTransition, string> = {
  heToClash: 'Lục hợp biến lục xung (hợp xứ phùng xung): trước hợp sau ly, được rồi lại mất',
  clashToHe: 'Lục xung biến lục hợp (xung trung phùng hợp): tan rồi lại tụ, trước khó sau dễ',
  clashToClash: 'Lục xung biến lục xung: xung tán; việc hung (quan phi) lại hợp',
  heToHe: 'Lục hợp biến lục hợp: trước sau đều hợp; nên việc cát, không nên việc hung',
};

export type FanYinKind = 'trigram' | 'branch';
export const FAN_YIN_LABELS: Record<FanYinKind, string> = {
  trigram: 'Quái phản ngâm (quái biến sang quái đối xung: Càn–Tốn, Khảm–Ly, Cấn–Khôn, Chấn–Đoài)',
  branch: 'Hào phản ngâm (ba chi của quái biến đều xung ba chi cũ: chỉ Khôn–Tốn)',
};
export type HalfPattern = {
  half: 'inner' | 'outer';
  from: TrigramKey;
  to: TrigramKey;
  /** Quái này có hào động. */
  changed: boolean;
  fanYin: FanYinKind | null;
  /** Phục ngâm: quái biến mà chi y như cũ (chỉ Càn–Chấn). */
  fuYin: boolean;
  label: string | null;
  source: string | null;
};
export type HalfScope = 'none' | 'inner' | 'outer' | 'both';

export type HexagramAssessment = {
  primary: HexPattern | null;
  primaryLabel: string | null;
  transformed: HexPattern | null;
  transformedLabel: string | null;
  transition: HexTransition | null;
  transitionLabel: string | null;
  /** Hợp xứ phùng xung / xung trung phùng hợp ở cấp quẻ (卜筮正宗·十八問答第十三問). */
  patterns: HeClashPattern[];
  inner: HalfPattern;
  outer: HalfPattern;
  fanYin: HalfScope;
  fuYin: HalfScope;
  reasons: Reason[];
};

// ---------- Tam hợp cục ----------

export type SanHeSource = 'moving' | 'hiddenMove' | 'changed' | 'day' | 'month' | 'static';
export const SAN_HE_SOURCE_LABELS: Record<SanHeSource, string> = {
  moving: 'hào động',
  hiddenMove: 'hào ám động',
  changed: 'hào biến',
  day: 'nhật thần',
  month: 'nguyệt kiến',
  static: 'hào tĩnh',
};
export type SanHeStatus = 'formed' | 'staticMember' | 'virtual';
export const SAN_HE_STATUS_LABELS: Record<SanHeStatus, string> = {
  formed: 'Thành cục',
  staticMember: 'Hai hào động, chi thứ ba chỉ là hào tĩnh: chờ ngày chi đó (sách không thống nhất có gọi là thành cục)',
  virtual: 'Hư nhất đãi dụng: thiếu một chi, chờ ngày/tháng chi đó bổ vào',
};
export type SanHeMember = {
  branch: number;
  source: SanHeSource;
  sourceLabel: string;
  /** Vị trí hào (với hào biến là vị trí hào động sinh ra nó); null cho nhật / nguyệt. */
  position: number | null;
  void: boolean;
  monthBreak: boolean;
  tomb: boolean;
};
export type SanHeRole = 'useGod' | 'yuan' | 'ji' | 'chou' | 'other';
export const SAN_HE_ROLE_LABELS: Record<SanHeRole, string> = {
  useGod: 'Cục của chính dụng thần (cát)',
  yuan: 'Cục nguyên thần sinh dụng thần (cát)',
  ji: 'Cục kỵ thần khắc dụng thần (hung)',
  chou: 'Cục cừu thần (hung)',
  other: 'Cục không phải nguyên/kỵ/cừu (dụng thần sinh hoặc khắc cục)',
};
export type TimingWait = { key: string; label: string; branches: number[]; source: string };
export type SanHeInfo = {
  element: Element;
  elementLabel: string;
  branches: [number, number, number];
  label: string;
  status: SanHeStatus;
  statusLabel: string;
  members: SanHeMember[];
  /** Chi chưa có hào động (tĩnh hoặc vắng hẳn). */
  missing: number | null;
  /** Cả cục nằm gọn trong nội quái / ngoại quái (增刪卜易 phân nội ngoại). */
  half: 'inner' | 'outer' | null;
  includesShi: boolean;
  /** Tác động của cục lên hào Thế (cục → Thế). */
  shiRelation: LineRelation;
  /** Vai trò của cục đối với dụng thần; null nếu chưa có dụng thần. */
  useGodRole: null | { role: SanHeRole; label: string; relation: LineRelation };
  waits: TimingWait[];
  reasons: Reason[];
};

// ---------- Tam hình, tự hình ----------

export type XingKind = 'yinSiShen' | 'chouXuWei' | 'ziMao' | 'self';
export const XING_LABELS: Record<XingKind, string> = {
  yinSiShen: 'Tam hình Dần Tỵ Thân',
  chouXuWei: 'Tam hình Sửu Tuất Mùi',
  ziMao: 'Tý Mão tương hình',
  self: 'Tự hình (Thìn Ngọ Dậu Hợi gặp chính nó)',
};
export type XingMember = { branch: number; source: SanHeSource; sourceLabel: string; position: number | null };
export type XingInfo = {
  kind: XingKind;
  label: string;
  branches: number[];
  status: 'complete' | 'virtual';
  members: XingMember[];
  missing: number | null;
  /** Có hào động / ám động / hào biến tham gia. */
  active: boolean;
  positions: number[];
  involvesUseGod: boolean;
  /** Mức tin cậy theo sách: 增刪卜易 hoài nghi tam hình. */
  weight: string;
  reasons: Reason[];
};

// ---------- Ứng kỳ ----------

export type TimingHint = { key: string; label: string; branches: number[]; branchLabels: string[]; source: string };
export type TimingAssessment = {
  target: { kind: 'line' | 'hidden' | 'standIn' | 'none'; position: number | null; branch: number | null; label: string };
  hints: TimingHint[];
  disclaimer: string;
};

export const TIMING_DISCLAIMER =
  'Đây là gợi ý ứng kỳ theo nguyên tắc truyền thống của sách (增刪卜易·各門類應期總注章…), không phải dự đoán. ' +
  'Một chi có thể ứng vào ngày, tháng hoặc năm; sách dặn việc xa định bằng năm tháng, việc gần ứng ngày giờ, và khi quẻ không rõ thì nên gieo lại.';

export type ChartAssessment = {
  lines: LineAssessment[];
  useGod: UseGodAssessment | null;
  /** Lục hợp / lục xung của quẻ, phản ngâm / phục ngâm. */
  hexagram: HexagramAssessment;
  /** Tam hợp cục (thành cục hoặc đang chờ). */
  sanHe: SanHeInfo[];
  /** Tam hình, Tý Mão hình, tự hình. */
  xing: XingInfo[];
  /** Gợi ý ứng kỳ cho dụng thần; null nếu chưa có dụng thần. */
  timing: TimingAssessment | null;
};

function verdictOf(reasons: Reason[]): StrengthVerdict {
  const score = reasons.reduce((a, r) => a + r.effect, 0);
  const key: Strength = score > 0 ? 'strong' : score < 0 ? 'weak' : 'balanced';
  return { key, label: STRENGTH_LABELS[key], score, reasons };
}

const reason = (key: string, label: string, effect: -1 | 0 | 1, source: string): Reason => ({ key, label, effect, source });

const ALL_ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const liuqinElement = (palaceElement: Element, q: LiuQin) => ALL_ELEMENTS.find((e) => liuqinOf(palaceElement, e) === q)!;
const elementGenerating = (e: Element) => ALL_ELEMENTS.find((x) => GENERATES[x] === e)!;
const elementOvercoming = (e: Element) => ALL_ELEMENTS.find((x) => OVERCOMES[x] === e)!;

type ChartForAssessment = Omit<LiuyaoChart, 'assessment'>;

/**
 * Hào tĩnh bị nhật thần xung mà có khí thì ám động. "Có khí": vượng tướng theo
 * nguyệt lệnh, hoặc nhật thần cùng hành (Sửu-Mùi, Thìn-Tuất: ví dụ 寅月己未日 坤之師
 * của 增刪卜易·暗動章 gọi Sửu bị Mùi xung là ám động dù Sửu hưu tù mùa xuân).
 */
function isHiddenMover(chart: ChartForAssessment, line: ChartLine): boolean {
  if (line.moving || !branchesClash(line.branch, chart.day.branch)) return false;
  return strongStatus(monthStatus(chart.month.element, line.element)) || elementRelation(chart.day.element, line.element) === 'tyhoa';
}

function assessLine(chart: ChartForAssessment, line: ChartLine, hiddenMovers: Set<number>): LineAssessment {
  const monthB = chart.month.branch;
  const dayB = chart.day.branch;
  const status = monthStatus(chart.month.element, line.element);
  const strong = strongStatus(status);
  const dayRel = elementRelation(chart.day.element, line.element);
  const daySame = line.branch === dayB;
  const isVoid = chart.void.branches.includes(line.branch);
  const reasons: Reason[] = [];

  // Hào động (và hào ám động) khác sinh / khắc; hào biến chỉ tác động hào động của chính nó.
  const movingSupport: number[] = [];
  const movingAttack: number[] = [];
  for (const o of chart.lines) {
    if (!(o.moving || hiddenMovers.has(o.position)) || o.position === line.position) continue;
    const r = elementRelation(o.element, line.element);
    if (r === 'sinh') movingSupport.push(o.position);
    else if (r === 'khac') movingAttack.push(o.position);
  }
  const daySupports = daySame || dayRel === 'sinh' || dayRel === 'tyhoa';

  // Nguyệt lệnh
  reasons.push(
    reason(
      `month-${status}`,
      `Nguyệt lệnh ${BRANCH_LABELS[monthB]}: ${MONTH_STATUS_LABELS[status]}${line.branch === monthB ? ' (lâm nguyệt kiến)' : ''}`,
      strong ? 1 : -1,
      SRC.monthStatus,
    ),
  );

  // Nguyệt phá
  let monthBreak: LineAssessment['month']['break'] = null;
  const broken = branchesClash(line.branch, monthB);
  if (broken) {
    let kind: MonthBreakKind;
    if (daySame) kind = 'brokenNotBroken';
    else if (!line.moving && !daySupports && movingSupport.length === 0 && (isVoid || dayRel === 'khac' || movingAttack.length > 0))
      kind = 'trueBroken';
    else kind = 'broken';
    monthBreak = { kind, label: MONTH_BREAK_LABELS[kind] };
    reasons.push(
      reason(
        `month-break-${kind}`,
        MONTH_BREAK_LABELS[kind],
        kind === 'brokenNotBroken' ? 0 : -1,
        kind === 'trueBroken' ? SRC.trueBreak : kind === 'brokenNotBroken' ? SRC.breakNotBroken : SRC.monthBreak,
      ),
    );
  }

  // Nhật thần
  if (daySame) reasons.push(reason('day-same', `Lâm nhật thần ${BRANCH_LABELS[dayB]}`, 1, SRC.day));
  else if (dayRel === 'tyhoa') reasons.push(reason('day-fu', `Nhật thần ${BRANCH_LABELS[dayB]} phù (cùng hành)`, 1, SRC.day));
  else if (dayRel === 'sinh') reasons.push(reason('day-sheng', `Nhật thần ${BRANCH_LABELS[dayB]} sinh`, 1, SRC.day));
  else if (dayRel === 'khac') reasons.push(reason('day-ke', `Nhật thần ${BRANCH_LABELS[dayB]} khắc`, -1, SRC.day));

  let dayClash: LineAssessment['day']['clash'] = null;
  if (branchesClash(line.branch, dayB)) {
    const kind: DayClashKind = line.moving ? 'movingClashed' : hiddenMovers.has(line.position) ? 'hiddenMove' : 'dayBreak';
    dayClash = { kind, label: DAY_CLASH_LABELS[kind] };
    reasons.push(
      reason(
        `day-clash-${kind}`,
        DAY_CLASH_LABELS[kind],
        kind === 'hiddenMove' ? 1 : kind === 'dayBreak' ? -1 : 0,
        kind === 'hiddenMove' ? SRC.hiddenMove : kind === 'dayBreak' ? SRC.dayBreak : SRC.movingClashed,
      ),
    );
  }

  if (line.moving) reasons.push(reason('moving', 'Hào phát động', 1, SRC.moving));
  const actor = (p: number) => (hiddenMovers.has(p) ? `Hào ám động ${p}` : `Hào động ${p}`);
  const actorSrc = (p: number) => (hiddenMovers.has(p) ? SRC.hiddenMove : SRC.movingOthers);
  for (const p of movingSupport) reasons.push(reason('moving-sheng', `${actor(p)} sinh`, 1, actorSrc(p)));
  for (const p of movingAttack) reasons.push(reason('moving-ke', `${actor(p)} khắc`, -1, actorSrc(p)));

  // Hào biến
  let change: LineAssessment['change'] = null;
  if (line.changed) {
    const c = line.changed;
    const rel = elementRelation(c.element, line.element);
    const relation: ChangeRelation =
      rel === 'sinh' ? 'returnSheng' : rel === 'khac' ? 'returnKe' : rel === 'tyhoa' ? 'same' : rel === 'tiet' ? 'drain' : 'exhaust';
    const progress = progressOf(line.branch, c.branch);
    const clashBack = branchesClash(line.branch, c.branch);
    const cBreak = branchesClash(c.branch, monthB);
    const tomb = TOMB_BRANCH[line.element] === c.branch;
    // 卜筮正宗·絕處逢生論: Thổ hóa Tỵ là hồi đầu sinh, không gọi hóa tuyệt.
    const extinction = EXTINCTION_BRANCH[line.element] === c.branch && relation !== 'returnSheng';
    change = {
      branch: c.branch,
      element: c.element,
      relation,
      relationLabel: CHANGE_RELATION_LABELS[relation],
      progress,
      progressLabel: progress ? PROGRESS_LABELS[progress] : null,
      clashBack,
      void: c.void,
      monthBreak: cBreak,
      tomb,
      extinction,
      fanYin: clashBack,
      fuYin: c.branch === line.branch,
    };
    const cb = BRANCH_LABELS[c.branch];
    if (relation === 'returnSheng') reasons.push(reason('change-return-sheng', `Hóa ${cb}: hồi đầu sinh`, 1, SRC.returnRel));
    if (relation === 'returnKe') reasons.push(reason('change-return-ke', `Hóa ${cb}: hồi đầu khắc`, -1, SRC.returnRel));
    if (progress === 'advance') reasons.push(reason('change-advance', `${BRANCH_LABELS[line.branch]} hóa ${cb}: tiến thần`, 1, SRC.progress));
    if (progress === 'retreat') reasons.push(reason('change-retreat', `${BRANCH_LABELS[line.branch]} hóa ${cb}: thoái thần`, -1, SRC.progress));
    if (clashBack) reasons.push(reason('change-clash-back', 'Hóa hồi đầu xung (động biến tương xung)', 0, SRC.clashBack));
    if (cBreak) reasons.push(reason('change-break', `Hóa phá (${cb} bị nguyệt kiến xung)`, -1, SRC.changeBreak));
    if (c.void) reasons.push(reason('change-void', `Hóa không (${cb} tuần không): chờ ngày xuất không`, 0, SRC.changeVoid));
    // Hóa mộ mà cùng hành (vd. Sửu hóa Thìn = tiến thần) thì chỉ ghi chú.
    if (tomb) reasons.push(reason('change-tomb', `Hóa mộ (${cb})`, relation === 'same' ? 0 : -1, SRC.changeTomb));
    if (extinction) reasons.push(reason('change-extinction', `Hóa tuyệt (${cb})`, -1, SRC.changeTomb));
  }

  // Tuần không: 卜筮正宗·旬空論第十, 增刪卜易·旬空章
  let voidInfo: LineAssessment['void'] = null;
  if (isVoid) {
    const useful: string[] = [];
    if (strong) useful.push('vượng tướng');
    if (line.moving) useful.push('phát động');
    if (daySupports) useful.push('được nhật thần sinh phù');
    if (movingSupport.length) useful.push('được hào động / ám động sinh');
    let kind: VoidKind;
    let why: string[];
    if (!line.moving && broken && !daySame) {
      kind = 'true';
      why = ['tĩnh mà gặp nguyệt phá'];
    } else if (useful.length) {
      kind = 'false';
      why = useful;
    } else {
      kind = 'true';
      why = ['hưu tù, an tĩnh, không được sinh phù'];
      if (dayRel === 'khac') why.push('bị nhật thần khắc');
  if (movingAttack.length) why.push('bị hào động / ám động khắc');
    }
    voidInfo = { kind, label: VOID_KIND_LABELS[kind], reasons: why };
    reasons.push(reason(`void-${kind}`, `Tuần không: ${VOID_KIND_LABELS[kind]} (${why.join(', ')})`, kind === 'true' ? -1 : 0, SRC.void));
  }

  return {
    position: line.position,
    branch: line.branch,
    element: line.element,
    moving: line.moving,
    month: { status, label: MONTH_STATUS_LABELS[status], sameBranch: line.branch === monthB, break: monthBreak },
    day: { relation: dayRel, label: ELEMENT_RELATION_LABELS[dayRel], sameBranch: daySame, clash: dayClash },
    void: voidInfo,
    change,
    movingSupport,
    movingAttack,
    strength: verdictOf(reasons),
    he: lineHarmony(chart, line, hiddenMovers, { strong, daySupports, dayRel, movingSupport, movingAttack }),
    tomb: lineTomb(chart, line, {
      strong,
      supported: daySupports || movingSupport.length > 0,
      attacked: dayRel === 'khac' || movingAttack.length > 0 || change?.relation === 'returnKe',
      changeSame: change?.relation === 'same',
    }),
  };
}

const bl = (b: number) => BRANCH_LABELS[b];
const bls = (bs: number[]) => bs.map(bl).join(', ');
const clashOf = (b: number) => (b + 6) % 12;
const combineOf = (b: number) => (13 - b) % 12;
const branchesOfElement = (e: Element) => BRANCH_ELEMENT.map((x, i) => (x === e ? i : -1)).filter((i) => i >= 0);
const uniq = (xs: number[]) => [...new Set(xs)];

type LineCtx = {
  strong: boolean;
  daySupports: boolean;
  dayRel: ElementRelation;
  movingSupport: number[];
  movingAttack: number[];
};

/**
 * Lục hợp của một hào (增刪卜易·六合章第十九):
 * tĩnh gặp hợp (nhật, nguyệt, hào động) → hợp khởi; động gặp nhật/nguyệt hợp → hợp bán;
 * hào động hợp hào động → hợp hảo; hào động hóa ra chi hợp → hóa phù (卜筮正宗 thêm hợp trung đới khắc).
 * Hợp xứ phùng xung / xung trung phùng hợp: engine xếp thứ tự "hào động < hào biến < nguyệt < nhật";
 * quan hệ đến sau (hợp hay xung) quyết định tên gọi (xem docs mục 10).
 */
function lineHarmony(chart: ChartForAssessment, line: ChartLine, hiddenMovers: Set<number>, ctx: LineCtx): LineHarmony {
  const motion = (p: number) => chart.lines[p - 1].moving || hiddenMovers.has(p);
  const day = branchesCombine(line.branch, chart.day.branch);
  const month = branchesCombine(line.branch, chart.month.branch);
  const others = chart.lines.filter((o) => o.position !== line.position);
  const moving = others.filter((o) => motion(o.position) && branchesCombine(o.branch, line.branch)).map((o) => o.position);
  const staticPairs = motion(line.position)
    ? []
    : others.filter((o) => !motion(o.position) && branchesCombine(o.branch, line.branch)).map((o) => o.position);
  const change = !!line.changed && branchesCombine(line.branch, line.changed.branch);
  const reasons: Reason[] = [];
  const pillarNames = [day ? `nhật thần ${bl(chart.day.branch)}` : '', month ? `nguyệt kiến ${bl(chart.month.branch)}` : ''].filter(Boolean);

  let state: HeState | null = null;
  if (line.moving) {
    if (day || month) {
      state = 'heBan';
      const partners = [...(day ? [chart.day.branch] : []), ...(month ? [chart.month.branch] : [])];
      reasons.push(
        reason(
          'he-ban',
          `Hào động gặp ${pillarNames.join(', ')} hợp: hợp bán, chờ ngày xung khai (${bls(uniq([clashOf(line.branch), ...partners.map(clashOf)]))})`,
          0,
          SRC.heBan,
        ),
      );
    } else if (moving.length) {
      state = 'heHao';
      reasons.push(reason('he-hao', `Hào động hợp hào động ${moving.join(', ')}: hợp hảo`, 1, SRC.he));
    }
  } else if (day || month || moving.length) {
    state = 'heQi';
    const who = [...pillarNames, ...moving.map((p) => `hào ${hiddenMovers.has(p) ? 'ám động' : 'động'} ${p}`)];
    reasons.push(reason('he-qi', `Hào tĩnh gặp ${who.join(', ')} hợp: hợp khởi`, 1, SRC.he));
  }

  let changeKind: HeChange | null = null;
  if (change && line.changed) {
    const c = line.changed;
    const cb = bl(c.branch);
    if (elementRelation(c.element, line.element) === 'khac') {
      if (line.branch === 8 && c.branch === 5) {
        changeKind = 'heChangSheng';
        const tripleXing = chart.day.branch === 2 || chart.month.branch === 2;
        reasons.push(
          reason(
            'he-change-changsheng',
            tripleXing
              ? `Thân hóa Tỵ, nhưng nhật/nguyệt là Dần: tam hình hội tụ, Thân bị Dần xung, không luận cát`
              : `Thân hóa Tỵ: hóa hợp hóa trường sinh, không luận khắc`,
            tripleXing ? -1 : 1,
            SRC.heWithKe,
          ),
        );
      } else {
        changeKind = 'heWithKe';
        const asHe = ctx.strong || ctx.daySupports || ctx.movingSupport.length > 0;
        const asKe = !asHe && (ctx.dayRel === 'khac' || ctx.movingAttack.length > 0);
        reasons.push(
          reason(
            'he-change-with-ke',
            `${bl(line.branch)} hóa ${cb}: hợp trung đới khắc — ${asHe ? 'vượng hoặc được sinh phù: luận hợp' : asKe ? 'suy lại bị khắc: luận khắc' : 'suy mà không bị khắc: sách không nói rõ'}`,
            asHe ? 1 : asKe ? -1 : 0,
            SRC.heWithKe,
          ),
        );
      }
    } else {
      changeKind = 'huaFu';
      reasons.push(reason('he-change-fu', `${bl(line.branch)} hóa ${cb}: hóa hợp (hóa phù)`, 1, SRC.he));
    }
  }

  // Thứ tự: hào động (0) < hào biến (1) < nguyệt (2) < nhật (3).
  const heRanks: number[] = [];
  const chongRanks: number[] = [];
  if (moving.length) heRanks.push(0);
  if (others.some((o) => motion(o.position) && branchesClash(o.branch, line.branch))) chongRanks.push(0);
  if (change) heRanks.push(1);
  if (line.changed && branchesClash(line.branch, line.changed.branch)) chongRanks.push(1);
  if (month) heRanks.push(2);
  if (branchesClash(line.branch, chart.month.branch)) chongRanks.push(2);
  if (day) heRanks.push(3);
  if (branchesClash(line.branch, chart.day.branch)) chongRanks.push(3);
  const patterns: HeClashPattern[] = [];
  if (heRanks.length && chongRanks.length) {
    const h = Math.max(...heRanks);
    const c = Math.max(...chongRanks);
    if (h > c) patterns.push('chongZhongFengHe');
    else if (c > h) patterns.push('heChuFengChong');
  }
  for (const p of patterns) {
    const monthBreakThenDayHe = p === 'chongZhongFengHe' && day && branchesClash(line.branch, chart.month.branch);
    reasons.push(
      reason(
        p === 'chongZhongFengHe' ? 'he-chong-zhong-feng-he' : 'he-he-chu-feng-chong',
        monthBreakThenDayHe ? `${HE_CLASH_LABELS[p]}; nguyệt phá gặp nhật hợp (phá mà gặp hợp)` : HE_CLASH_LABELS[p],
        p === 'chongZhongFengHe' ? 1 : -1,
        monthBreakThenDayHe ? `${SRC.heClash}; ${SRC.breakHe}` : SRC.heClash,
      ),
    );
  }

  return {
    day,
    month,
    moving,
    change,
    state,
    stateLabel: state ? HE_STATE_LABELS[state] : null,
    changeKind,
    changeKindLabel: changeKind ? HE_CHANGE_LABELS[changeKind] : null,
    staticPairs,
    patterns,
    reasons,
  };
}

/**
 * Nhập mộ (增刪卜易·隨鬼入墓章第三十; 各門類題頭總注章: 「三墓：卽用爻入日墓、入動墓、動而化墓」).
 * Nguyệt mộ thêm theo ví dụ 戌月甲寅日 của cùng chương. Hào đứng ngay trên chi mộ (vd. Thìn Thổ ngày Thìn)
 * là lâm, không tính nhập mộ (quy ước engine).
 */
function lineTomb(
  chart: ChartForAssessment,
  line: ChartLine,
  ctx: { strong: boolean; supported: boolean; attacked: boolean; changeSame: boolean },
): LineTomb | null {
  const t = TOMB_BRANCH[line.element];
  if (line.branch === t) return null;
  const kinds: TombKind[] = [];
  if (chart.day.branch === t) kinds.push('day');
  if (chart.month.branch === t) kinds.push('month');
  const movingPositions = chart.lines.filter((o) => o.moving && o.position !== line.position && o.branch === t).map((o) => o.position);
  if (movingPositions.length) kinds.push('moving');
  if (line.changed?.branch === t) kinds.push('change');
  if (!kinds.length) return null;

  const tombBroken =
    branchesClash(t, chart.month.branch) || branchesClash(t, chart.day.branch) || chart.lines.some((o) => o.moving && branchesClash(o.branch, t));
  const why: string[] = [];
  if (ctx.strong) why.push('vượng tướng (非眞)');
  if (ctx.supported) why.push('được nhật thần / hào động sinh phù');
  if (!ctx.attacked) why.push('không bị khắc');
  if (tombBroken) why.push(`mộ ${bl(t)} bị nguyệt / nhật / hào động xung phá (墓破如破网)`);
  if (ctx.changeSame && kinds.length === 1 && kinds[0] === 'change') why.push('hóa mộ cùng hành (chỉ ghi chú)');
  const genuine = !ctx.strong && !ctx.supported && ctx.attacked && !tombBroken;
  if (genuine) why.push('hưu tù, bị khắc, lại nhập mộ');
  const withGhost = line.shi && line.liuqin === 'officer';
  const kindText = kinds.map((k) => TOMB_KIND_LABELS[k]).join(', ');
  return {
    branch: t,
    kinds,
    movingPositions,
    withGhost,
    genuine,
    reasons: why,
    openBranch: clashOf(t),
    label: `${withGhost ? 'Tùy quỷ nhập mộ' : 'Nhập mộ'} tại ${bl(t)} (${kindText}): ${genuine ? 'nhập mộ thật' : 'không phải nhập mộ thật'}; chờ ngày ${bl(clashOf(t))} xung khai`,
    source: kinds.includes('month') ? `${SRC.tomb}; ${SRC.tombMonth}` : SRC.tomb,
  };
}

/** Sáu điều kiện phục thần hữu dụng, năm điều kiện vô dụng (增刪卜易·飛伏神章第二十八). */
function assessHidden(chart: ChartForAssessment, h: HiddenSpirit): HiddenAssessment {
  const { day, month } = chart;
  const status = monthStatus(month.element, h.element);
  const strong = strongStatus(status);
  const isVoid = chart.void.branches.includes(h.branch);
  const hBreak = branchesClash(h.branch, month.branch);
  const flying = chart.lines[h.position - 1];
  const flyingStatus = monthStatus(month.element, flying.element);
  const moving = chart.lines.filter((l) => l.moving);
  const useful: Reason[] = [];
  const useless: Reason[] = [];
  const add = (list: Reason[], key: string, label: string, effect: -1 | 1) => list.push(reason(key, label, effect, SRC.hidden));
  const pillars = [
    { name: 'Nhật thần', b: day.branch, e: day.element },
    { name: 'Nguyệt kiến', b: month.branch, e: month.element },
  ];

  // Hữu dụng (1) nhật nguyệt sinh (2) vượng tướng (3) phi thần sinh (4) hào động sinh
  // (5) nhật nguyệt, hào động xung khắc phi thần (6) phi thần không, phá, hưu tù, mộ tuyệt.
  for (const p of pillars)
    if (elementRelation(p.e, h.element) === 'sinh') add(useful, 'hidden-pillar-sheng', `${p.name} ${BRANCH_LABELS[p.b]} sinh phục thần`, 1);
  if (strong) add(useful, 'hidden-strong', `Phục thần ${MONTH_STATUS_LABELS[status]} theo nguyệt lệnh`, 1);
  if (elementRelation(flying.element, h.element) === 'sinh') add(useful, 'hidden-flying-sheng', 'Phi thần sinh phục thần (phi lai sinh phục)', 1);
  for (const m of moving)
    if (m.position !== h.position && elementRelation(m.element, h.element) === 'sinh')
      add(useful, 'hidden-moving-sheng', `Hào động ${m.position} sinh phục thần`, 1);
  for (const p of pillars)
    if (branchesClash(p.b, flying.branch) || elementRelation(p.e, flying.element) === 'khac')
      add(useful, 'hidden-pillar-hits-flying', `${p.name} ${BRANCH_LABELS[p.b]} xung/khắc phi thần`, 1);
  for (const m of moving)
    if (m.position !== h.position && (branchesClash(m.branch, flying.branch) || elementRelation(m.element, flying.element) === 'khac'))
      add(useful, 'hidden-moving-hits-flying', `Hào động ${m.position} xung/khắc phi thần`, 1);
  const flyingWeak: string[] = [];
  if (chart.void.branches.includes(flying.branch)) flyingWeak.push('tuần không');
  if (branchesClash(flying.branch, month.branch)) flyingWeak.push('nguyệt phá');
  if (!strongStatus(flyingStatus)) flyingWeak.push('hưu tù');
  for (const p of pillars) {
    if (TOMB_BRANCH[flying.element] === p.b) flyingWeak.push(`mộ tại ${BRANCH_LABELS[p.b]}`);
    if (EXTINCTION_BRANCH[flying.element] === p.b) flyingWeak.push(`tuyệt tại ${BRANCH_LABELS[p.b]}`);
  }
  if (flyingWeak.length) add(useful, 'hidden-flying-weak', `Phi thần ${flyingWeak.join(', ')}`, 1);

  // Vô dụng (1) hưu tù vô khí (2) bị nhật nguyệt xung khắc (3) bị phi thần vượng tướng khắc
  // (4) mộ tuyệt ở nhật, nguyệt, phi thần (5) hưu tù lại tuần không hoặc nguyệt phá.
  if (!strong) add(useless, 'hidden-weak', `Phục thần ${MONTH_STATUS_LABELS[status]} (hưu tù vô khí)`, -1);
  for (const p of pillars)
    if (branchesClash(p.b, h.branch) || elementRelation(p.e, h.element) === 'khac')
      add(useless, 'hidden-pillar-hits', `${p.name} ${BRANCH_LABELS[p.b]} xung/khắc phục thần`, -1);
  if (strongStatus(flyingStatus) && elementRelation(flying.element, h.element) === 'khac')
    add(useless, 'hidden-flying-ke', 'Phi thần vượng tướng khắc phục thần', -1);
  const tombs: string[] = [];
  for (const b of [day.branch, month.branch, flying.branch]) {
    if (TOMB_BRANCH[h.element] === b) tombs.push(`mộ tại ${BRANCH_LABELS[b]}`);
    if (EXTINCTION_BRANCH[h.element] === b) tombs.push(`tuyệt tại ${BRANCH_LABELS[b]}`);
  }
  if (tombs.length) add(useless, 'hidden-tomb', `Phục thần ${[...new Set(tombs)].join(', ')}`, -1);
  if (!strong && (isVoid || hBreak)) add(useless, 'hidden-weak-void', `Phục thần hưu tù lại ${isVoid ? 'tuần không' : 'nguyệt phá'}`, -1);

  const verdict: HiddenVerdict = useless.length === 0 ? 'usable' : useful.length === 0 ? 'unusable' : 'mixed';
  let voidInfo: HiddenAssessment['void'] = null;
  if (isVoid) {
    // 旬空論: 「伏而旺相」 có dụng; 伏 mà hưu tù / bị khắc là chân không.
    const kind: VoidKind = strong ? 'false' : 'true';
    voidInfo = { kind, label: VOID_KIND_LABELS[kind] };
  }
  return {
    position: h.position,
    branch: h.branch,
    element: h.element,
    label: h.label,
    monthStatus: status,
    monthStatusLabel: MONTH_STATUS_LABELS[status],
    monthBreak: hBreak,
    void: voidInfo,
    useful,
    useless,
    verdict,
    verdictLabel: HIDDEN_VERDICT_LABELS[verdict],
  };
}

function roleInfo(chart: ChartForAssessment, lines: LineAssessment[], role: Role, element: Element): RoleInfo {
  const q = liuqinOf(chart.palace.element, element);
  const roleLines: RoleLine[] = chart.lines
    .filter((l) => l.liuqin === q)
    .map((l) => {
      const a = lines[l.position - 1];
      return {
        position: l.position,
        label: l.label,
        moving: l.moving,
        hiddenMove: a.day.clash?.kind === 'hiddenMove',
        monthStatus: a.month.status,
        monthStatusLabel: a.month.label,
        strength: a.strength.key,
        strengthLabel: a.strength.label,
        score: a.strength.score,
      };
    });
  return {
    role,
    roleLabel: ROLE_LABELS[role],
    definition: ROLE_DEFINITIONS[role],
    liuqin: q,
    liuqinLabel: LIUQIN_LABELS[q],
    element,
    present: roleLines.length > 0,
    moving: roleLines.some((l) => l.moving),
    hiddenMove: roleLines.some((l) => l.hiddenMove),
    lines: roleLines,
  };
}

// ---------- Quẻ lục hợp / lục xung, phản ngâm / phục ngâm ----------

/** Quái đối xung dùng cho quái phản ngâm (卜筮正宗·反吟卦定例第十一). */
export const FAN_YIN_TRIGRAM: Record<TrigramKey, TrigramKey> = {
  qian: 'xun', xun: 'qian', kan: 'li', li: 'kan', gen: 'kun', kun: 'gen', zhen: 'dui', dui: 'zhen',
};

/** Quẻ lục xung / lục hợp: ba cặp hào 1-4, 2-5, 3-6 đều xung / đều hợp (增刪卜易·六沖章, 六合章). */
export function hexagramPattern(n: number): HexPattern | null {
  const nj = najia(n);
  if ([0, 1, 2].every((i) => branchesClash(nj[i].branch, nj[i + 3].branch))) return 'sixClash';
  if ([0, 1, 2].every((i) => branchesCombine(nj[i].branch, nj[i + 3].branch))) return 'sixHe';
  return null;
}

function halfPattern(chart: ChartForAssessment, half: 'inner' | 'outer'): HalfPattern {
  const off = half === 'inner' ? 0 : 3;
  const from = half === 'inner' ? chart.primary.lower : chart.primary.upper;
  const t = chart.transformed;
  const to = t ? (half === 'inner' ? t.lower : t.upper) : from;
  const changed = chart.moving.some((p) => p > off && p <= off + 3);
  const a = najia(chart.primary.number).slice(off, off + 3);
  const b = t ? najia(t.number).slice(off, off + 3) : a;
  let fanYin: FanYinKind | null = null;
  let fuYin = false;
  if (changed && from !== to) {
    if (a.every((x, i) => branchesClash(x.branch, b[i].branch))) fanYin = 'branch';
    else if (FAN_YIN_TRIGRAM[from] === to) fanYin = 'trigram';
    else if (a.every((x, i) => x.branch === b[i].branch)) fuYin = true;
  }
  const where = half === 'inner' ? 'Nội quái' : 'Ngoại quái';
  const label = fanYin
    ? `${where} ${TRIGRAM_LABELS[from]} biến ${TRIGRAM_LABELS[to]}: ${FAN_YIN_LABELS[fanYin]}`
    : fuYin
      ? `${where} ${TRIGRAM_LABELS[from]} biến ${TRIGRAM_LABELS[to]}: phục ngâm (chi y như cũ)`
      : null;
  const source = fanYin === 'branch' ? SRC.fanYinBranch : fanYin === 'trigram' ? SRC.fanYinTrigram : fuYin ? SRC.fuYin : null;
  return { half, from, to, changed, fanYin, fuYin, label, source };
}

const scopeOf = (inner: boolean, outer: boolean): HalfScope => (inner && outer ? 'both' : inner ? 'inner' : outer ? 'outer' : 'none');

function assessHexagram(chart: ChartForAssessment): HexagramAssessment {
  const primary = hexagramPattern(chart.primary.number);
  const transformed = chart.transformed ? hexagramPattern(chart.transformed.number) : null;
  let transition: HexTransition | null = null;
  if (primary && transformed)
    transition =
      primary === 'sixHe' ? (transformed === 'sixClash' ? 'heToClash' : 'heToHe') : transformed === 'sixHe' ? 'clashToHe' : 'clashToClash';
  const reasons: Reason[] = [];
  if (primary)
    reasons.push(
      reason(
        `hex-${primary}`,
        primary === 'sixHe'
          ? `${HEX_PATTERN_LABELS.sixHe}: chủ tụ, thành; nhưng phải dụng thần có khí mới cát`
          : `${HEX_PATTERN_LABELS.sixClash}: chủ tán; việc hung nên tán, việc cát không nên — phải xét dụng thần`,
        0,
        primary === 'sixHe' ? SRC.hexHe : SRC.hexClash,
      ),
    );
  if (transition)
    reasons.push(
      reason(`hex-${transition}`, HEX_TRANSITION_LABELS[transition], transition === 'clashToHe' ? 1 : transition === 'heToClash' ? -1 : 0, SRC.hexTransition),
    );

  const patterns: HeClashPattern[] = [];
  if (transition === 'heToClash') patterns.push('heChuFengChong');
  if (transition === 'clashToHe') patterns.push('chongZhongFengHe');
  // 卜筮正宗·十八問答第十三問: 六沖卦有日辰相合、變爻相合 → 沖中逢合; 六合卦有日辰相沖、變爻相沖 → 合處逢沖.
  if (primary === 'sixClash') {
    const byDay = chart.lines.filter((l) => branchesCombine(l.branch, chart.day.branch)).map((l) => l.position);
    const byChange = chart.lines.filter((l) => l.changed && branchesCombine(l.branch, l.changed.branch)).map((l) => l.position);
    if (byDay.length || byChange.length) {
      if (!patterns.includes('chongZhongFengHe')) patterns.push('chongZhongFengHe');
      reasons.push(
        reason(
          'hex-clash-meets-he',
          `Quẻ lục xung mà ${[byDay.length ? `nhật thần hợp hào ${byDay.join(', ')}` : '', byChange.length ? `hào ${byChange.join(', ')} hóa hợp` : ''].filter(Boolean).join(', ')}: xung trung phùng hợp`,
          1,
          SRC.hexDay,
        ),
      );
    }
  }
  if (primary === 'sixHe') {
    const byDay = chart.lines.filter((l) => branchesClash(l.branch, chart.day.branch)).map((l) => l.position);
    const byChange = chart.lines.filter((l) => l.changed && branchesClash(l.branch, l.changed.branch)).map((l) => l.position);
    if (byDay.length || byChange.length) {
      if (!patterns.includes('heChuFengChong')) patterns.push('heChuFengChong');
      reasons.push(
        reason(
          'hex-he-meets-clash',
          `Quẻ lục hợp mà ${[byDay.length ? `nhật thần xung hào ${byDay.join(', ')}` : '', byChange.length ? `hào ${byChange.join(', ')} hóa xung` : ''].filter(Boolean).join(', ')}: hợp xứ phùng xung`,
          -1,
          SRC.hexDay,
        ),
      );
    }
  }

  const inner = halfPattern(chart, 'inner');
  const outer = halfPattern(chart, 'outer');
  const fanYin = scopeOf(!!inner.fanYin, !!outer.fanYin);
  const fuYin = scopeOf(inner.fuYin, outer.fuYin);
  for (const h of [inner, outer])
    if (h.label && h.source) reasons.push(reason(h.fanYin ? `fan-yin-${h.half}` : `fu-yin-${h.half}`, h.label, 0, h.source));
  if (fanYin !== 'none')
    reasons.push(
      reason('fan-yin', 'Phản ngâm: thành rồi bại, được rồi mất, đi rồi lại, tụ rồi tán — việc phản phục', 0, `${SRC.fanYinBranch}; ${SRC.fanYinTrigram}`),
    );
  if (fuYin !== 'none')
    reasons.push(reason('fu-yin', 'Phục ngâm: ưu uất, rên rỉ; động như không động, chờ năm tháng xung khai', 0, SRC.fuYin));

  return {
    primary,
    primaryLabel: primary ? HEX_PATTERN_LABELS[primary] : null,
    transformed,
    transformedLabel: transformed ? HEX_PATTERN_LABELS[transformed] : null,
    transition,
    transitionLabel: transition ? HEX_TRANSITION_LABELS[transition] : null,
    patterns,
    inner,
    outer,
    fanYin,
    fuYin,
    reasons,
  };
}

// ---------- Tam hợp, tam hình ----------

/** Tam hợp cục: [trường sinh, đế vượng, mộ] (卜筮正宗·三合會局歌; 增刪卜易·六合章). */
export const SAN_HE_GROUPS: { element: Element; branches: [number, number, number] }[] = [
  { element: 'water', branches: [8, 0, 4] },
  { element: 'wood', branches: [11, 3, 7] },
  { element: 'fire', branches: [2, 6, 10] },
  { element: 'metal', branches: [5, 9, 1] },
];

/** Tam hình (卜筮正宗·三刑六害歌): Dần Tỵ Thân, Sửu Tuất Mùi, Tý Mão; tự hình Thìn Ngọ Dậu Hợi. */
export const XING_GROUPS: { kind: Exclude<XingKind, 'self'>; branches: number[] }[] = [
  { kind: 'yinSiShen', branches: [2, 5, 8] },
  { kind: 'chouXuWei', branches: [1, 10, 7] },
  { kind: 'ziMao', branches: [0, 3] },
];
export const SELF_XING_BRANCHES = [4, 6, 9, 11];

type Participant = { branch: number; source: SanHeSource; position: number | null };
const SOURCE_RANK: Record<SanHeSource, number> = { moving: 0, hiddenMove: 1, changed: 2, day: 3, month: 4, static: 5 };
const isLineMotion = (s: SanHeSource) => s === 'moving' || s === 'hiddenMove' || s === 'changed';
const best = (ps: Participant[]) => [...ps].sort((a, b) => SOURCE_RANK[a.source] - SOURCE_RANK[b.source])[0];

/** Mọi "chi có mặt": sáu hào (động / ám động / tĩnh), hào biến, nhật, nguyệt. */
function participants(chart: ChartForAssessment, hiddenMovers: Set<number>): Participant[] {
  const out: Participant[] = [];
  for (const l of chart.lines) {
    out.push({ branch: l.branch, source: l.moving ? 'moving' : hiddenMovers.has(l.position) ? 'hiddenMove' : 'static', position: l.position });
    if (l.changed) out.push({ branch: l.changed.branch, source: 'changed', position: l.position });
  }
  out.push({ branch: chart.day.branch, source: 'day', position: null });
  out.push({ branch: chart.month.branch, source: 'month', position: null });
  return out;
}

type UgElements = { element: Element; yuan: Element; ji: Element; chou: Element; positions: number[] } | null;

function assessSanHe(chart: ChartForAssessment, la: LineAssessment[], hiddenMovers: Set<number>, ug: UgElements): SanHeInfo[] {
  const all = participants(chart, hiddenMovers);
  const shiLine = chart.lines[chart.palace.shi - 1];
  const out: SanHeInfo[] = [];
  for (const g of SAN_HE_GROUPS) {
    // Hào biến chỉ được góp chi khi chính hào động sinh ra nó cũng ở trong cục (增刪卜易: 內卦初爻、三爻動而變出爻成三合).
    const cand = all.filter((p) => {
      if (!g.branches.includes(p.branch)) return false;
      if (p.source !== 'changed') return true;
      const own = chart.lines[p.position! - 1];
      return g.branches.includes(own.branch) && own.branch !== p.branch;
    });
    if (!cand.some((p) => p.source === 'moving' || p.source === 'hiddenMove')) continue; // 不動不成局
    const pick = g.branches.map((b) => best(cand.filter((p) => p.branch === b)));
    const lacking = g.branches.filter((_, i) => !pick[i] || pick[i].source === 'static');
    let status: SanHeStatus;
    if (lacking.length === 0) status = 'formed';
    else if (lacking.length === 1 && pick.filter((p) => p && isLineMotion(p.source)).length === 2)
      status = pick[g.branches.indexOf(lacking[0])] ? 'staticMember' : 'virtual';
    else continue;

    const members: SanHeMember[] = pick
      .filter((p): p is Participant => !!p)
      .map((p) => {
        const onLine = p.position !== null;
        const a = p.source !== 'changed' && onLine ? la[p.position! - 1] : null;
        return {
          branch: p.branch,
          source: p.source,
          sourceLabel: SAN_HE_SOURCE_LABELS[p.source],
          position: p.position,
          void: onLine && chart.void.branches.includes(p.branch),
          monthBreak: onLine && branchesClash(p.branch, chart.month.branch),
          tomb: !!a?.tomb,
        };
      });
    const positions = members.map((m) => m.position);
    const half = positions.every((p) => p !== null && p <= 3) ? 'inner' : positions.every((p) => p !== null && p >= 4) ? 'outer' : null;
    const includesShi = members.some((m) => m.source !== 'changed' && m.position === shiLine.position);
    const shiRelation = rel(g.element, shiLine.element);
    const label = `${bls(g.branches)} hợp ${ELEMENT_LABELS[g.element]} cục`;

    const waits: TimingWait[] = [];
    const missing = lacking[0] ?? null;
    if (missing !== null)
      waits.push({
        key: status === 'virtual' ? 'sanhe-virtual' : 'sanhe-static',
        label:
          status === 'virtual'
            ? `Thiếu ${bl(missing)}: hư nhất đãi dụng, chờ ngày/tháng ${bl(missing)} bổ vào`
            : `${bl(missing)} là hào tĩnh: chờ ngày ${bl(missing)} (trị nhật) mới ứng`,
        branches: [missing],
        source: SRC.sanHeWait,
      });
    for (const m of members) {
      if (m.void)
        waits.push({ key: 'sanhe-member-void', label: `${bl(m.branch)} tuần không: chờ ngày điền thực / xung (${bl(m.branch)}, ${bl(clashOf(m.branch))})`, branches: [m.branch, clashOf(m.branch)], source: SRC.sanHe });
      if (m.monthBreak)
        waits.push({ key: 'sanhe-member-break', label: `${bl(m.branch)} nguyệt phá: chờ ngày điền thực hoặc ngày hợp (${bl(m.branch)}, ${bl(combineOf(m.branch))})`, branches: [m.branch, combineOf(m.branch)], source: `${SRC.sanHe}; ${SRC.sanHeWait}` });
      if (m.tomb && m.position !== null) {
        const t = la[m.position - 1].tomb!;
        waits.push({ key: 'sanhe-member-tomb', label: `${bl(m.branch)} nhập mộ: chờ ngày ${bl(t.openBranch)} xung khai`, branches: [t.openBranch], source: SRC.sanHe });
      }
    }

    const reasons: Reason[] = [
      reason(
        `sanhe-${status}`,
        `${label}: ${SAN_HE_STATUS_LABELS[status]} (${members.map((m) => `${bl(m.branch)} — ${m.sourceLabel}${m.position ? ` ${m.position}` : ''}`).join('; ')})`,
        0,
        status === 'formed' ? SRC.sanHe : SRC.sanHeWait,
      ),
      reason(
        includesShi ? 'sanhe-shi-in' : `sanhe-shi-${shiRelation.relation}`,
        includesShi
          ? 'Hào Thế ở trong cục: tốt'
          : `Hào Thế không ở trong cục; cục ${shiRelation.relation === 'sinh' ? 'sinh Thế: cát' : shiRelation.relation === 'khac' ? 'khắc Thế: hung' : `với Thế: ${shiRelation.label}`}`,
        includesShi || shiRelation.relation === 'sinh' ? 1 : shiRelation.relation === 'khac' ? -1 : 0,
        SRC.sanHe,
      ),
    ];

    let useGodRole: SanHeInfo['useGodRole'] = null;
    if (ug) {
      const role: SanHeRole =
        g.element === ug.element ? 'useGod' : g.element === ug.yuan ? 'yuan' : g.element === ug.ji ? 'ji' : g.element === ug.chou ? 'chou' : 'other';
      useGodRole = { role, label: SAN_HE_ROLE_LABELS[role], relation: rel(g.element, ug.element) };
      reasons.push(
        reason(
          `sanhe-role-${role}`,
          `${label} đối với dụng thần: ${SAN_HE_ROLE_LABELS[role]}${status === 'formed' ? '' : ' — cục chưa thành, chờ ngày bổ'}`,
          status !== 'formed' ? 0 : role === 'useGod' || role === 'yuan' ? 1 : role === 'ji' || role === 'chou' ? -1 : 0,
          SRC.sanHeEffect,
        ),
      );
    }
    out.push({
      element: g.element,
      elementLabel: ELEMENT_LABELS[g.element],
      branches: g.branches,
      label,
      status,
      statusLabel: SAN_HE_STATUS_LABELS[status],
      members,
      missing,
      half,
      includesShi,
      shiRelation,
      useGodRole,
      waits,
      reasons,
    });
  }
  return out;
}

const XING_WEIGHT = {
  active: 'Sách ít coi trọng: 增刪卜易 nói tự mình phạm tam hình ít khi nghiệm; chỉ thấy hung khi dụng thần hưu tù lại bị hào khác khắc (卜筮正宗 cũng vậy).',
  still: 'Tam hình đủ mặt nhưng không động: 卜筮正宗 nói nếu dụng thần không bị tổn thương, có sinh phù thì chưa từng nghiệm.',
  virtual: 'Hư nhất đãi dụng: 增刪卜易 cho rằng thiếu một chi vẫn chờ ngày chi đó bổ vào (黃金策 「刑非刑…為少支神」 thì không tính).',
};

function assessXing(chart: ChartForAssessment, hiddenMovers: Set<number>, ugPositions: number[]): XingInfo[] {
  const all = participants(chart, hiddenMovers);
  const out: XingInfo[] = [];
  const build = (kind: XingKind, branches: number[], status: 'complete' | 'virtual', ps: Participant[], missing: number | null): XingInfo => {
    const members = branches
      .map((b) => best(ps.filter((p) => p.branch === b)))
      .filter((p): p is Participant => !!p)
      .map((p) => ({ branch: p.branch, source: p.source, sourceLabel: SAN_HE_SOURCE_LABELS[p.source], position: p.position }));
    const positions = uniq(ps.filter((p) => p.position !== null).map((p) => p.position!)).sort((a, b) => a - b);
    const active = ps.some((p) => isLineMotion(p.source));
    const weight = status === 'virtual' ? XING_WEIGHT.virtual : active ? XING_WEIGHT.active : XING_WEIGHT.still;
    const label = `${XING_LABELS[kind]}${status === 'virtual' ? ` — thiếu ${bl(missing!)}, chờ ngày ${bl(missing!)}` : ''}`;
    const src = kind === 'self' ? SRC.selfXing : status === 'virtual' ? `${SRC.xingWait}; ${SRC.xing}` : `${SRC.xing}; ${SRC.xingWeight}`;
    return {
      kind,
      label,
      branches,
      status,
      members,
      missing,
      active,
      positions,
      involvesUseGod: positions.some((p) => ugPositions.includes(p)),
      weight,
      reasons: [reason(`xing-${kind}-${status}`, `${label} (${members.map((m) => `${bl(m.branch)} — ${m.sourceLabel}${m.position ? ` ${m.position}` : ''}`).join('; ')}). ${weight}`, 0, src)],
    };
  };
  for (const g of XING_GROUPS) {
    const ps = all.filter((p) => g.branches.includes(p.branch));
    if (!ps.some((p) => p.position !== null)) continue;
    const present = g.branches.filter((b) => ps.some((p) => p.branch === b));
    if (present.length === g.branches.length) out.push(build(g.kind, g.branches, 'complete', ps, null));
    else if (g.branches.length === 3 && present.length === 2) {
      // Hư nhất đãi dụng (增刪卜易, ví dụ 困之兌: 寅 động hóa 巳, thiếu 申 → ngày 申).
      const okBranch = (b: number) => ps.some((p) => p.branch === b && p.source !== 'static');
      if (present.every(okBranch) && ps.some((p) => isLineMotion(p.source)))
        out.push(build(g.kind, g.branches, 'virtual', ps, g.branches.find((b) => !present.includes(b))!));
    }
  }
  for (const b of SELF_XING_BRANCHES) {
    const ps = all.filter((p) => p.branch === b);
    if (ps.length >= 2 && ps.some((p) => p.position !== null) && ps.some((p) => p.source !== 'static'))
      out.push(build('self', [b], 'complete', ps, null));
  }
  return out;
}

// ---------- Ứng kỳ ----------

function hint(key: string, label: string, branches: number[], source: string): TimingHint {
  const bs = uniq(branches);
  return { key, label, branches: bs, branchLabels: bs.map(bl), source };
}

function assessTiming(
  chart: ChartForAssessment,
  la: LineAssessment[],
  ug: UseGodAssessment,
  sanHe: SanHeInfo[],
  hexagram: HexagramAssessment,
): TimingAssessment {
  const hints: TimingHint[] = [];
  const far = hint('far-near', 'Việc xa định bằng năm tháng, việc gần ứng ngày giờ', [], SRC.timing);
  if (ug.primary === null) {
    if (ug.standIns.length) {
      const s = ug.standIns[0];
      return {
        target: { kind: 'standIn', position: null, branch: s.branch, label: s.label },
        hints: [far],
        disclaimer: TIMING_DISCLAIMER,
      };
    }
    const h = ug.hidden.find((x) => x.verdict === 'usable') ?? ug.hidden.find((x) => x.verdict === 'mixed') ?? ug.hidden[0];
    if (!h) return { target: { kind: 'none', position: null, branch: null, label: 'Dụng thần không hiện, không có phục thần' }, hints: [far], disclaimer: TIMING_DISCLAIMER };
    const flying = chart.lines[h.position - 1];
    hints.push(hint('hidden-flying-open', `Phục thần cần nhật nguyệt xung khai phi thần ${bl(flying.branch)}: ngày ${bl(clashOf(flying.branch))}`, [clashOf(flying.branch)], SRC.timingHidden));
    if (h.void) hints.push(hint('void-fill', `Phục thần ${bl(h.branch)} tuần không: chờ xuất tuần, ngày ${bl(h.branch)} (điền thực) hoặc ngày xung ${bl(clashOf(h.branch))}`, [h.branch, clashOf(h.branch)], SRC.timingVoid));
    hints.push(far);
    return { target: { kind: 'hidden', position: h.position, branch: h.branch, label: `Phục thần ${h.label} dưới hào ${h.position}` }, hints, disclaimer: TIMING_DISCLAIMER };
  }

  const p = ug.primary;
  const line = chart.lines[p - 1];
  const a = la[p - 1];
  const B = line.branch;
  const b = bl(B);
  const dayRel = a.day.relation;

  if (!line.moving) hints.push(hint('static-value-clash', `Hào tĩnh: ứng ngày trị (${b}) hoặc ngày xung (${bl(clashOf(B))})`, [B, clashOf(B)], SRC.timing));
  else hints.push(hint('moving-he-value', `Hào động: ứng ngày hợp (${bl(combineOf(B))}) hoặc ngày trị (${b})`, [combineOf(B), B], SRC.timing));

  const tooStrong = (a.month.status === 'wang' || a.month.sameBranch) && (a.day.sameBranch || dayRel === 'tyhoa' || dayRel === 'sinh');
  if (tooStrong)
    hints.push(hint('too-strong', `Quá vượng: ứng ngày mộ (${bl(TOMB_BRANCH[line.element])}) hoặc ngày xung (${bl(clashOf(B))})`, [TOMB_BRANCH[line.element], clashOf(B)], SRC.timing));
  if (a.strength.key === 'weak') {
    const gen = branchesOfElement(elementGenerating(line.element));
    const own = branchesOfElement(line.element);
    hints.push(hint('weak-sheng-wang', `Suy: chờ ngày tháng sinh (${bls(gen)}) hoặc vượng (${bls(own)})`, [...gen, ...own], SRC.timing));
  }
  if (a.tomb) hints.push(hint('tomb-open', `Nhập mộ tại ${bl(a.tomb.branch)}: chờ ngày ${bl(a.tomb.openBranch)} xung khai`, [a.tomb.openBranch], SRC.timingTomb));
  const hePartners = [...(a.he.day ? [chart.day.branch] : []), ...(a.he.month ? [chart.month.branch] : []), ...(a.he.change && line.changed ? [line.changed.branch] : [])];
  if (hePartners.length)
    hints.push(
      hint('he-open', `Gặp hợp: cát hung chờ ngày xung khai (${bls(uniq([clashOf(B), ...hePartners.map(clashOf)]))})`, [clashOf(B), ...hePartners.map(clashOf)], SRC.timingHe),
    );
  if (a.month.break && a.month.break.kind !== 'brokenNotBroken')
    hints.push(hint('break-fill', `Nguyệt phá: ra khỏi tháng thì hết phá; ứng ngày thực phá (${b}) hoặc ngày hợp (${bl(combineOf(B))})`, [B, combineOf(B)], SRC.timingBreak));
  if (a.void) {
    const clashedNow = branchesClash(B, chart.day.branch);
    hints.push(
      hint(
        'void-fill',
        clashedNow
          ? `Tuần không mà nhật thần ${bl(chart.day.branch)} đang xung: xung không tức thực, có thể ứng ngay hôm nay`
          : `Tuần không: chờ xuất tuần, ngày điền thực (${b}) hoặc ngày xung (${bl(clashOf(B))})`,
        clashedNow ? [chart.day.branch] : [B, clashOf(B)],
        SRC.timingVoid,
      ),
    );
  }

  const attackers: { branch: number; element: Element }[] = [];
  if (dayRel === 'khac') attackers.push({ branch: chart.day.branch, element: chart.day.element });
  for (const q of a.movingAttack) attackers.push({ branch: chart.lines[q - 1].branch, element: chart.lines[q - 1].element });
  if (attackers.length && ug.verdict.key === 'strong') {
    const bs = attackers.flatMap((x) => [...branchesOfElement(elementOvercoming(x.element)), clashOf(x.branch)]);
    hints.push(hint('good-but-attacked', `Đại tượng cát mà bị khắc: chờ ngày khắc thần bị xung khắc (${bls(uniq(bs))})`, bs, SRC.timing));
  }
  if (attackers.length && ug.verdict.key === 'weak') {
    const bs = attackers.flatMap((x) => [...branchesOfElement(x.element), ...branchesOfElement(elementGenerating(x.element))]);
    hints.push(hint('bad-and-attacked', `Đại tượng hung lại bị khắc: đề phòng ngày khắc thần được sinh, trị (${bls(uniq(bs))})`, bs, SRC.timing));
  }
  if (a.change?.progress === 'advance')
    hints.push(hint('advance', `Hóa tiến thần: ứng ngày trị (${b}) hoặc ngày hợp (${bl(combineOf(B))})`, [B, combineOf(B)], SRC.timing));
  if (a.change?.progress === 'retreat') {
    const c = a.change.branch;
    hints.push(hint('retreat', `Hóa thoái thần: kỵ ngày trị (${bl(c)}) và ngày xung (${bl(clashOf(c))}) của hào biến`, [c, clashOf(c)], SRC.timing));
  }
  if (a.change) hints.push(hint('change-value', `Hào động hóa ${bl(a.change.branch)}: có khi ứng ngày ${b}, có khi ứng ngày ${bl(a.change.branch)}`, [B, a.change.branch], SRC.timing));
  const yuanMoving = ug.yuan.lines.filter((l) => l.moving);
  if (a.void && yuanMoving.length) {
    const bs = yuanMoving.map((l) => chart.lines[l.position - 1].branch);
    hints.push(hint('void-yuan-moving', `Dụng thần không mà nguyên thần động: chờ ngày nguyên thần trị (${bls(bs)})`, bs, SRC.timing));
  }
  if (ug.verdict.key === 'weak' && ug.yuan.present && !ug.yuan.moving && !ug.yuan.hiddenMove) {
    const bs = ug.yuan.lines.map((l) => clashOf(chart.lines[l.position - 1].branch));
    hints.push(hint('weak-yuan-still', `Dụng thần suy, nguyên thần tĩnh: chờ ngày xung nguyên thần (${bls(bs)})`, bs, SRC.timing));
  }
  for (const s of sanHe)
    if (s.members.some((m) => m.position === p) || (s.useGodRole && (s.useGodRole.role === 'useGod' || s.useGodRole.role === 'yuan')))
      for (const w of s.waits) hints.push(hint(w.key, `${s.label}: ${w.label}`, w.branches, w.source));
  if (hexagram.fuYin !== 'none') hints.push(hint('fu-yin-open', `Phục ngâm: chờ năm tháng xung khai (${bl(clashOf(B))})`, [clashOf(B)], SRC.timingFuYin));
  hints.push(far);
  return {
    target: { kind: 'line', position: p, branch: B, label: `Dụng thần hào ${p}: ${line.label}` },
    hints,
    disclaimer: TIMING_DISCLAIMER,
  };
}

/** Gom các yếu tố hợp / tam hợp / hình / mộ / phản phục ngâm tác động lên dụng thần (không cộng điểm). */
function useGodRelationReasons(
  la: LineAssessment[],
  ug: Omit<UseGodAssessment, 'relationReasons'>,
  hexagram: HexagramAssessment,
  sanHe: SanHeInfo[],
  xing: XingInfo[],
): Reason[] {
  const out: Reason[] = [];
  const p = ug.primary;
  if (p !== null) {
    const a = la[p - 1];
    out.push(...a.he.reasons);
    if (a.tomb)
      out.push(reason(a.tomb.genuine ? 'tomb-genuine' : 'tomb-not-genuine', `${a.tomb.label} — ${a.tomb.reasons.join(', ')}`, a.tomb.genuine ? -1 : 0, a.tomb.genuine ? SRC.tombGenuine : a.tomb.source));
    // 卜筮正宗·十八問答第五問 xét cả quẻ phản ngâm (ví dụ 臨之中孚: ngoại quái phản ngâm, dụng thần ở nội quái).
    if (hexagram.fanYin !== 'none') {
      const c = a.change;
      const hit = !!c && (c.fanYin || c.relation === 'returnKe');
      out.push(
        reason(
          hit ? 'fan-yin-use-god-hit' : 'fan-yin-use-god-ok',
          hit
            ? 'Phản ngâm mà dụng thần hóa hồi đầu xung / khắc: mọi mưu tính đại hung'
            : 'Phản ngâm nhưng dụng thần không hóa xung khắc: việc tuy phản phục vẫn thành',
          hit ? -1 : 0,
          SRC.fanYinUseGod,
        ),
      );
    }
    if (hexagram.fuYin !== 'none')
      out.push(reason('fu-yin-use-god', 'Quẻ phục ngâm: ưu uất; dụng thần vượng thì năm tháng xung khai mới thỏa chí, suy thì xung khai vẫn ưu uất', 0, SRC.fuYin));
  }
  if (hexagram.transition === 'clashToHe')
    out.push(reason('hex-clash-to-he-use-god', 'Lục xung biến lục hợp: sách nói trường hợp này không cần xét dụng thần, cứ đoán cát', 1, SRC.he));
  if (hexagram.transition === 'heToClash')
    out.push(reason('hex-he-to-clash-use-god', 'Lục hợp biến lục xung: dụng thần vượng thì trước cát sau hung, việc khó thành', -1, SRC.hexClash));
  for (const s of sanHe) {
    const r = s.reasons.find((x) => x.key.startsWith('sanhe-role-'));
    if (r) out.push(r);
  }
  const attacked = p !== null && (la[p - 1].day.relation === 'khac' || la[p - 1].movingAttack.length > 0);
  for (const x of xing)
    if (x.involvesUseGod) {
      const bad = x.status === 'complete' && x.active && ug.verdict.key === 'weak' && attacked;
      out.push(
        reason(
          bad ? 'xing-use-god-weak' : 'xing-use-god-note',
          bad ? `${x.label}: dụng thần hưu tù lại bị khắc, kiêm phạm hình → chủ thấy hung tai` : `${x.label} có dụng thần tham gia. ${x.weight}`,
          bad ? -1 : 0,
          SRC.xingWeight,
        ),
      );
    }
  return out;
}

/**
 * Phân tích thuần (không ngẫu nhiên, JSON-serializable) cho lá quẻ đã lập:
 * vượng suy từng hào và khối dụng thần – nguyên thần – kỵ thần – cừu thần,
 * cùng lục hợp / lục xung quẻ, phản phục ngâm, tam hợp, tam hình, mộ, ứng kỳ.
 */
export function assessChart(chart: ChartForAssessment): ChartAssessment {
  const hiddenMovers = new Set(chart.lines.filter((l) => isHiddenMover(chart, l)).map((l) => l.position));
  const lines = chart.lines.map((l) => assessLine(chart, l, hiddenMovers));
  const hexagram = assessHexagram(chart);
  const ug = chart.useGod;
  if (!ug) return { lines, useGod: null, hexagram, sanHe: assessSanHe(chart, lines, hiddenMovers, null), xing: assessXing(chart, hiddenMovers, []), timing: null };

  const palaceEl = chart.palace.element;
  const shiLine = chart.lines[chart.palace.shi - 1];
  const liuqin: LiuQin = ug.key === 'self' ? shiLine.liuqin : ug.key;
  const element = ug.key === 'self' ? shiLine.element : liuqinElement(palaceEl, ug.key);
  const yuanEl = elementGenerating(element);
  const yuan = roleInfo(chart, lines, 'yuan', yuanEl);
  const ji = roleInfo(chart, lines, 'ji', elementOvercoming(element));
  const chou = roleInfo(chart, lines, 'chou', elementOvercoming(yuanEl));

  const hidden = ug.hidden.map((h) => assessHidden(chart, h));
  const standIns: StandIn[] = [];
  if (ug.key !== 'self' && ug.positions.length === 0) {
    for (const [pillar, p] of [['day', chart.day], ['month', chart.month]] as const)
      if (liuqinOf(palaceEl, p.element) === ug.key)
        standIns.push({
          pillar,
          branch: p.branch,
          label: `${pillar === 'day' ? 'Nhật thần' : 'Nguyệt kiến'} ${BRANCH_LABELS[p.branch]} là ${LIUQIN_LABELS[ug.key]}: lấy làm dụng thần`,
          source: SRC.standIn,
        });
  }

  let primary: number | null = null;
  let primaryNote: string | null = null;
  let verdict: StrengthVerdict;
  if (ug.positions.length) {
    primary = ug.positions.reduce((best, p) => (lines[p - 1].strength.score > lines[best - 1].strength.score ? p : best), ug.positions[0]);
    if (ug.positions.length > 1)
      primaryNote = `Dụng thần xuất hiện ${ug.positions.length} lần (hào ${ug.positions.join(', ')}): chọn hào vượng nhất là hào ${primary}.`;
    verdict = lines[primary - 1].strength;
  } else if (standIns.length) {
    verdict = verdictOf(standIns.map((s) => reason(`stand-in-${s.pillar}`, s.label, 1, SRC.standIn)));
  } else if (hidden.length) {
    const best = hidden.find((h) => h.verdict === 'usable') ?? hidden.find((h) => h.verdict === 'mixed') ?? hidden[0];
    const rs = [reason('hidden-absent', `Dụng thần không hiện, xét phục thần ở hào ${best.position}`, 0, SRC.hidden), ...best.useful, ...best.useless];
    const key: Strength = best.verdict === 'usable' ? 'strong' : best.verdict === 'unusable' ? 'weak' : 'balanced';
    verdict = { key, label: STRENGTH_LABELS[key], score: rs.reduce((a, r) => a + r.effect, 0), reasons: rs };
  } else {
    verdict = verdictOf([reason('absent', 'Dụng thần không hiện và không có phục thần', -1, SRC.hidden)]);
  }

  const notes: UseGodAssessment['notes'] = [];
  if (primaryNote) notes.push({ key: 'pick-strongest', label: primaryNote, source: SRC.pickStrongest });
  if (ji.moving && (yuan.moving || yuan.hiddenMove))
    notes.push({
      key: 'greed-for-sheng',
      label: `Kỵ thần và nguyên thần cùng động${yuan.moving ? '' : ' (nguyên thần ám động)'}: kỵ thần sinh nguyên thần, nguyên thần sinh dụng thần (tham sinh vong khắc).`,
      source: yuan.moving ? SRC.greed : `${SRC.greed}; 增刪卜易·暗動章第二十二`,
    });
  else if (ji.moving) notes.push({ key: 'ji-moving', label: 'Kỵ thần phát động khắc dụng thần.', source: SRC.roles });
  else if (yuan.moving || yuan.hiddenMove)
    notes.push({ key: 'yuan-moving', label: `Nguyên thần ${yuan.moving ? 'phát động' : 'ám động'} sinh dụng thần.`, source: SRC.roles });
  if (chou.moving) notes.push({ key: 'chou-moving', label: 'Cừu thần phát động: nguyên thần bị thương, kỵ thần thêm lực.', source: SRC.roles });
  // 黃金策「入墓難剋」; 增刪卜易 thêm: đến ngày xung khai mộ thì kỵ thần vẫn khắc.
  const jiTombed = ji.lines.filter((l) => l.moving && lines[l.position - 1].tomb?.kinds.some((k) => k === 'day' || k === 'change'));
  if (jiTombed.length)
    notes.push({
      key: 'ji-in-tomb',
      label: `Kỵ thần hào ${jiTombed.map((l) => l.position).join(', ')} nhập mộ: khó khắc dụng thần (nhập mộ nan khắc); đến ngày xung khai mộ vẫn khắc.`,
      source: SRC.tombJi,
    });
  notes.push({ key: 'verdict-rule', label: 'Kết luận vượng/suy là tổng các lý do (+1/−1), quy ước của engine.', source: SRC.engine });

  const ugEls: UgElements = { element, yuan: yuanEl, ji: ji.element, chou: chou.element, positions: ug.key === 'self' ? [chart.palace.shi] : ug.positions };
  const sanHe = assessSanHe(chart, lines, hiddenMovers, ugEls);
  const xing = assessXing(chart, hiddenMovers, ugEls.positions);
  const base: Omit<UseGodAssessment, 'relationReasons'> = {
    key: ug.key,
    label: ug.label,
    liuqin,
    element,
    positions: ug.positions,
    primary,
    primaryNote,
    hidden,
    standIns,
    verdict,
    yuan,
    ji,
    chou,
    notes,
  };
  const useGod: UseGodAssessment = { ...base, relationReasons: useGodRelationReasons(lines, base, hexagram, sanHe, xing) };
  return { lines, useGod, hexagram, sanHe, xing, timing: assessTiming(chart, lines, useGod, sanHe, hexagram) };
}
