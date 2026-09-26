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
  };
  /** Vị trí các hào động / ám động khác sinh hào này. */
  movingSupport: number[];
  /** Vị trí các hào động / ám động khác khắc hào này. */
  movingAttack: number[];
  strength: StrengthVerdict;
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
};

export type ChartAssessment = {
  lines: LineAssessment[];
  useGod: UseGodAssessment | null;
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

/**
 * Phân tích thuần (không ngẫu nhiên, JSON-serializable) cho lá quẻ đã lập:
 * vượng suy từng hào và khối dụng thần – nguyên thần – kỵ thần – cừu thần.
 */
export function assessChart(chart: ChartForAssessment): ChartAssessment {
  const hiddenMovers = new Set(chart.lines.filter((l) => isHiddenMover(chart, l)).map((l) => l.position));
  const lines = chart.lines.map((l) => assessLine(chart, l, hiddenMovers));
  const ug = chart.useGod;
  if (!ug) return { lines, useGod: null };

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
  notes.push({ key: 'verdict-rule', label: 'Kết luận vượng/suy là tổng các lý do (+1/−1), quy ước của engine.', source: SRC.engine });

  return {
    lines,
    useGod: {
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
    },
  };
}
