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
};

export function suggestUseGod(topic: Topic, askerGender?: Gender): Pick<UseGod, 'key' | 'explanation' | 'notes'> {
  const note = (key: LiuQin, text: string) => ({ key, label: LIUQIN_LABELS[key], text });
  switch (topic) {
    case 'work':
      return { key: 'officer', explanation: 'Hỏi công danh, chức vị: lấy Quan Quỷ làm dụng thần.', notes: [] };
    case 'money':
      return { key: 'wealth', explanation: 'Hỏi tiền bạc, lợi lộc: lấy Thê Tài làm dụng thần.', notes: [] };
    case 'love':
      return askerGender === 'female'
        ? { key: 'officer', explanation: 'Nữ hỏi tình duyên: lấy Quan Quỷ (chồng, người yêu) làm dụng thần.', notes: [] }
        : {
            key: 'wealth',
            explanation:
              askerGender === 'male'
                ? 'Nam hỏi tình duyên: lấy Thê Tài (vợ, người yêu) làm dụng thần.'
                : 'Chưa rõ giới tính người hỏi: tạm lấy Thê Tài; nếu người hỏi là nữ thì dùng Quan Quỷ.',
            notes: [],
          };
    case 'health':
      return {
        key: 'self',
        explanation: 'Tự hỏi sức khỏe: lấy hào Thế (bản thân) làm dụng thần.',
        notes: [note('officer', 'Quan Quỷ là bệnh tật.'), note('child', 'Tử Tôn là thuốc, thầy thuốc (khắc Quan Quỷ).')],
      };
    case 'travel':
      return {
        key: 'self',
        explanation: 'Tự hỏi đi lại: lấy hào Thế (bản thân) làm dụng thần.',
        notes: [note('parent', 'Phụ Mẫu là xe cộ, giấy tờ, hành lý.')],
      };
    case 'study':
      return { key: 'parent', explanation: 'Hỏi học hành, thi cử, văn thư: lấy Phụ Mẫu làm dụng thần.', notes: [] };
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
    };
  }

  return {
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
}

