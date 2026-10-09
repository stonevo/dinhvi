import type { TrigramKey } from '../types/schema';
import { hexagramBinary, hexagramFromBinary, hexagramFromTrigrams, trigramFromBinary } from './iching';

// Mai Hoa Dịch Số (梅花易數, tương truyền của Thiệu Khang Tiết). Hàm thuần: không
// ngẫu nhiên, không đọc đồng hồ — người gọi đưa vào mọi con số (kể cả âm lịch).
//
// Quy ước chung:
//  - Số Tiên thiên: Càn 1, Đoài 2, Ly 3, Chấn 4, Tốn 5, Khảm 6, Cấn 7, Khôn 8.
//  - Quái = tổng mod 8 (dư 0 → 8 = Khôn). Hào động = tổng mod 6 (dư 0 → 6).
//  - Chi (năm, giờ) đánh số Tý 1, Sửu 2, … Hợi 12.

export const XIANTIAN_ORDER: TrigramKey[] = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];

export const XIANTIAN_NUMBER: Record<TrigramKey, number> = {
  qian: 1,
  dui: 2,
  li: 3,
  zhen: 4,
  xun: 5,
  kan: 6,
  gen: 7,
  kun: 8,
};

// Nguồn: 梅花易數 (Thiệu Khang Tiết, tương truyền), nguyên văn trên zh.wikisource.org:
//   卷一 = https://zh.wikisource.org/wiki/梅花易數/卷一 (象數易理篇), 卷二 = …/卷二 (體用生克篇).
// Mỗi quy tắc dưới đây ghi chương và câu gốc. Chỗ nào là quy ước của app (không có trong sách) thì ghi rõ.

export type MeihuaMethod =
  | 'time'
  | 'numbers'
  | 'number-single'
  | 'number-string'
  | 'text-han'
  | 'text-han-single-left-right'
  | 'text-han-single-hour'
  | 'text-quocngu-adapted'
  | 'count'
  | 'houtian'
  | 'manual';

export type MovingLine = 1 | 2 | 3 | 4 | 5 | 6;

export interface MeihuaCast {
  method: MeihuaMethod;
  /** Tổng thô dùng lấy quái trên / quái dưới / hào động (trước khi chia dư). */
  upperSum: number;
  lowerSum: number;
  movingSum: number;
  upper: TrigramKey;
  lower: TrigramKey;
  movingLine: MovingLine;
  /** Diễn giải phép tính bằng tiếng Việt, ví dụ "34 mod 8 = 2 → Đoài". */
  steps: string[];
  /** Ghi chú về nguồn gốc / biến thể của phương pháp. */
  note?: string;
}

const TRIGRAM_VI: Record<TrigramKey, string> = {
  qian: 'Càn',
  dui: 'Đoài',
  li: 'Ly',
  zhen: 'Chấn',
  xun: 'Tốn',
  kan: 'Khảm',
  gen: 'Cấn',
  kun: 'Khôn',
};

function assertCount(n: number, what: string): void {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`${what} phải là số nguyên không âm: ${n}`);
}

function assertBranch(n: number, what: string): void {
  if (!Number.isInteger(n) || n < 1 || n > 12) throw new RangeError(`${what} phải là chi 1–12 (Tý=1): ${n}`);
}

/** Tổng → quái Tiên thiên (mod 8, dư 0 → 8 = Khôn). */
export function trigramFromNumber(n: number): TrigramKey {
  assertCount(n, 'Số lấy quái');
  const r = n % 8;
  return XIANTIAN_ORDER[(r === 0 ? 8 : r) - 1];
}

/** Tổng → hào động (mod 6, dư 0 → 6). */
export function movingLineFromNumber(n: number): MovingLine {
  assertCount(n, 'Số lấy hào');
  const r = n % 6;
  return (r === 0 ? 6 : r) as MovingLine;
}

function build(method: MeihuaMethod, upperSum: number, lowerSum: number, movingSum: number, note?: string): MeihuaCast {
  const upper = trigramFromNumber(upperSum);
  const lower = trigramFromNumber(lowerSum);
  const movingLine = movingLineFromNumber(movingSum);
  const r8 = (n: number) => n % 8;
  const steps = [
    `Quái trên: ${upperSum} mod 8 = ${r8(upperSum)}${r8(upperSum) === 0 ? ' (→ 8)' : ''} → ${TRIGRAM_VI[upper]}`,
    `Quái dưới: ${lowerSum} mod 8 = ${r8(lowerSum)}${r8(lowerSum) === 0 ? ' (→ 8)' : ''} → ${TRIGRAM_VI[lower]}`,
    `Hào động: ${movingSum} mod 6 = ${movingSum % 6}${movingSum % 6 === 0 ? ' (→ 6)' : ''} → hào ${movingLine}`,
  ];
  return { method, upperSum, lowerSum, movingSum, upper, lower, movingLine, steps, ...(note ? { note } : {}) };
}

// ---------- Lấy quẻ theo thời gian ----------

export interface LunarTimeParts {
  /** Chi của năm âm lịch: Tý 1 … Hợi 12. */
  yearBranchNumber: number;
  /** Tháng âm lịch 1–12 (tháng nhuận tính theo số tháng gốc). */
  lunarMonth: number;
  /** Ngày âm lịch 1–30. */
  lunarDay: number;
  /** Chi của giờ: Tý 1 … Hợi 12. */
  hourBranchNumber: number;
}

/**
 * 卷一 · 年月日時起例: 「年月日為上卦。年月日加時總數為下卦。又以年月日時總數取爻。
 * 如子年一數…亥年十二數」. Chia dư theo 卷一 · 卦以八除；爻以六除.
 * Niên nguyệt nhật thời khởi quẻ (年月日時起卦):
 * quái trên = (năm + tháng + ngày) mod 8; quái dưới = (năm + tháng + ngày + giờ) mod 8;
 * hào động = (năm + tháng + ngày + giờ) mod 6.
 */
export function byTime(t: LunarTimeParts): MeihuaCast {
  assertBranch(t.yearBranchNumber, 'Chi năm');
  assertBranch(t.hourBranchNumber, 'Chi giờ');
  if (!Number.isInteger(t.lunarMonth) || t.lunarMonth < 1 || t.lunarMonth > 12)
    throw new RangeError(`Tháng âm lịch không hợp lệ: ${t.lunarMonth}`);
  if (!Number.isInteger(t.lunarDay) || t.lunarDay < 1 || t.lunarDay > 30)
    throw new RangeError(`Ngày âm lịch không hợp lệ: ${t.lunarDay}`);
  const ymd = t.yearBranchNumber + t.lunarMonth + t.lunarDay;
  const all = ymd + t.hourBranchNumber;
  return build('time', ymd, all, all);
}

// ---------- Lấy quẻ theo số ----------

/**
 * 卷一 · 丈尺占: 「以丈數為上卦，尺數為下卦。合丈尺之數取爻」 (không cộng giờ);
 * 卷一 · 尺寸占: 「以尺數為上卦，寸數為下卦。合尺寸之數加時取爻」 (cộng giờ).
 * Ví dụ 鄰夜扣門借物占 (卷一): hai loạt tiếng gõ 1 và 5 làm trên/dưới, hào = 1 + 5 + giờ Dậu 10.
 * Hai số (二數起卦): số đầu → quái trên, số sau → quái dưới, hào động = a + b.
 * Có hai cách chép: (1) hào động = a + b; (2) hào động = a + b + chi giờ.
 * Mặc định: chỉ cộng giờ khi người gọi truyền `hourBranchNumber`.
 */
export function byNumbers(a: number, b: number, hourBranchNumber?: number): MeihuaCast {
  assertCount(a, 'Số thứ nhất');
  assertCount(b, 'Số thứ hai');
  if (hourBranchNumber !== undefined) assertBranch(hourBranchNumber, 'Chi giờ');
  return build('numbers', a, b, a + b + (hourBranchNumber ?? 0));
}

/**
 * 卷一 · 聲音占例: 「凡聞聲音，數得幾數，起作上卦，加時數配作下卦」. Sách không nói cách lấy
 * hào ở mục này; app lấy (số + giờ) như 物數占例 (xem byCount).
 * Một số (một con số / số tiếng nghe được — 聲音占): số → quái trên,
 * số + chi giờ → quái dưới, số + chi giờ → hào động. Bắt buộc có giờ,
 * vì không có giờ thì quái trên và quái dưới trùng nhau một cách máy móc.
 */
export function byNumber(n: number, hourBranchNumber: number): MeihuaCast {
  assertCount(n, 'Số');
  assertBranch(hourBranchNumber, 'Chi giờ');
  return build('number-single', n, n + hourBranchNumber, n + hourBranchNumber);
}

/**
 * 卷一 · 物數占例: 「凡見有可數之物，即以此數起作上卦，以時數配作下卦。即以卦數並時數總除六取動爻」.
 * Khác 聲音占 ở quái dưới: ở đây quái dưới chỉ là chi giờ (không cộng số vật).
 */
export function byCount(n: number, hourBranchNumber: number): MeihuaCast {
  assertCount(n, 'Số vật');
  assertBranch(hourBranchNumber, 'Chi giờ');
  return build('count', n, hourBranchNumber, n + hourBranchNumber);
}

/**
 * Hậu thiên — vật + phương (卷一 · 物卦起例（端法後天起卦）):
 * 「後天端法：以物為上卦，方位為下卦，合物卦之數與方卦之數加時數以取動爻」.
 * Số dùng là số Tiên thiên (乾1…坤8), không phải số Lạc thư: 卷二 · 先天後天論
 * 「數自成乾一、兌二、離三…故占卜起卦，合以此數為用…後天起卦定爻必加時而後可」.
 * `object`: quái của vật/người (tra bảng 八卦萬物屬類); `direction`: quái của phương
 * người/vật đến theo phương vị Hậu thiên (離南坎北，震東兌西…).
 * Ví dụ 老人有憂色占: 乾1 + 巽5 + giờ Mão 4 = 10 → hào 4.
 */
export function byObject(object: TrigramKey, direction: TrigramKey, hourBranchNumber: number): MeihuaCast {
  assertBranch(hourBranchNumber, 'Chi giờ');
  const u = XIANTIAN_NUMBER[object];
  const l = XIANTIAN_NUMBER[direction];
  const c = build('houtian', u, l, u + l + hourBranchNumber);
  return { ...c, note: 'Hậu thiên: vật làm quái trên, phương làm quái dưới; hào = số Tiên thiên của hai quái + chi giờ.' };
}

/**
 * Chuỗi chữ số (số điện thoại, biển số…): bỏ mọi ký tự không phải chữ số rồi chia
 * đôi. Độ dài lẻ thì nửa ĐẦU ngắn hơn (theo lệ "trời nhẹ ở trên, đất nặng ở dưới"
 * của phép chia chữ trong Mai Hoa: nửa dưới nhận phần nhiều hơn).
 * Quái trên = tổng chữ số nửa đầu; quái dưới = tổng nửa sau;
 * hào động = tổng tất cả (+ chi giờ nếu có).
 * Chỉ có một chữ số → dùng `byNumber` (cần chi giờ).
 */
export function byNumberString(s: string, hourBranchNumber?: number): MeihuaCast {
  const digits = [...s].filter((c) => c >= '0' && c <= '9').map(Number);
  if (digits.length === 0) throw new RangeError('Chuỗi không có chữ số nào');
  if (hourBranchNumber !== undefined) assertBranch(hourBranchNumber, 'Chi giờ');
  if (digits.length === 1) {
    if (hourBranchNumber === undefined)
      throw new RangeError('Chỉ có một chữ số: cần chi giờ để lập quái dưới (xem byNumber)');
    return { ...byNumber(digits[0], hourBranchNumber), method: 'number-single' };
  }
  const cut = Math.floor(digits.length / 2);
  const sum = (xs: number[]) => xs.reduce((x, y) => x + y, 0);
  const up = sum(digits.slice(0, cut));
  const low = sum(digits.slice(cut));
  return build('number-string', up, low, up + low + (hourBranchNumber ?? 0));
}

// ---------- Lấy quẻ theo chữ ----------

export interface ByTextOptions {
  /** Tra số nét một chữ Hán (ví dụ từ public/data/strokes.json). */
  strokes?: (ch: string) => number | undefined;
  hourBranchNumber?: number;
  /**
   * Chỉ dùng cho MỘT chữ Hán: số nét phần trái / phần phải của chữ (một chữ là
   * Thái cực — "lấy nét bên trái làm quái trên, nét bên phải làm quái dưới").
   * Máy không tách được bộ phận trái/phải nên người dùng tự đếm.
   */
  singleCharLeftRight?: [number, number];
}

const HAN_RE = /^\p{Script=Han}$/u;

/** Chia n phần tử thành [nửa trên, nửa dưới]; lẻ thì nửa trên ít hơn. */
function halves<T>(xs: T[]): [T[], T[]] {
  const cut = Math.floor(xs.length / 2);
  return [xs.slice(0, cut), xs.slice(cut)];
}

/** Số chữ cái Quốc ngữ của một âm tiết: bỏ dấu thanh và dấu phụ (ă â ê ô ơ ư đ vẫn là 1 chữ). */
export function quocNguLetterCount(syllable: string): number {
  const base = syllable.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
  return (base.match(/[a-z]/g) ?? []).length;
}

export const QUOCNGU_NOTE =
  'Cách đếm chữ cái Quốc ngữ theo âm tiết là phép chuyển thể hiện đại, KHÔNG có trong sách Mai Hoa Dịch Số cổ (sách chỉ dạy đếm nét chữ Hán). Chỉ nên xem như một biến thể tham khảo.';

/**
 * Chữ Hán (字占, đếm nét chữ phồn thể):
 *  - 1 chữ: nếu có `singleCharLeftRight` → nét trái = quái trên, nét phải = quái dưới,
 *    hào động = tổng (+ giờ) — đúng lệ cổ. Nếu không, cần chi giờ: số nét → quái trên,
 *    số nét + giờ → quái dưới và hào động (mượn lệ "một số" của 聲音占; ghi chú rõ).
 *  - 2 chữ: chữ đầu → quái trên, chữ sau → quái dưới.
 *  - ≥ 3 chữ: nửa đầu / nửa sau (lẻ thì nửa đầu ít hơn: 3 chữ = 1 + 2, 5 = 2 + 3 …).
 *  - Hào động = tổng số nét (+ chi giờ nếu có) mod 6.
 *  Lưu ý: một số bản chép dùng thanh bằng/trắc hoặc số chữ cho câu dài; ở đây luôn đếm nét.
 *
 * Quốc ngữ (không có nét): đếm chữ cái mỗi âm tiết (bỏ dấu, bỏ khoảng trắng), chia
 * âm tiết làm hai nửa theo cùng quy tắc, cùng phép tính. Kết quả mang
 * `method: 'text-quocngu-adapted'` và ghi chú đây là chuyển thể hiện đại.
 */
export function byText(text: string, opts: ByTextOptions = {}): MeihuaCast {
  const hour = opts.hourBranchNumber;
  if (hour !== undefined) assertBranch(hour, 'Chi giờ');
  const compact = [...text].filter((c) => !/[\s\p{P}\p{S}]/u.test(c));
  if (compact.length === 0) throw new RangeError('Văn bản rỗng');
  const hanCount = compact.filter((c) => HAN_RE.test(c)).length;

  if (hanCount === compact.length) {
    if (compact.length === 1) {
      if (opts.singleCharLeftRight) {
        const [l, r] = opts.singleCharLeftRight;
        assertCount(l, 'Nét trái');
        assertCount(r, 'Nét phải');
        return build('text-han-single-left-right', l, r, l + r + (hour ?? 0));
      }
      const n = strokesOf(compact[0], opts);
      if (hour === undefined)
        throw new RangeError('Một chữ Hán: cần số nét trái/phải (singleCharLeftRight) hoặc chi giờ');
      return build(
        'text-han-single-hour',
        n,
        n + hour,
        n + hour,
        'Một chữ: sách cổ tách nét trái/phải; ở đây không có số đó nên dùng lệ "một số": số nét → quái trên, số nét + giờ → quái dưới và hào động.',
      );
    }
    const counts = compact.map((c) => strokesOf(c, opts));
    const [a, b] = halves(counts);
    const up = a.reduce((x, y) => x + y, 0);
    const low = b.reduce((x, y) => x + y, 0);
    return build('text-han', up, low, up + low + (hour ?? 0));
  }
  if (hanCount > 0) throw new RangeError('Văn bản lẫn chữ Hán và chữ Latinh: hãy dùng một loại chữ');

  const syllables = text
    .split(/[\s\p{P}\p{S}]+/u)
    .map(quocNguLetterCount)
    .filter((n) => n > 0);
  if (syllables.length === 0) throw new RangeError('Không có chữ cái nào để đếm');
  if (syllables.length === 1) {
    if (hour === undefined) throw new RangeError('Một âm tiết: cần chi giờ để lập quái dưới');
    const n = syllables[0];
    return build('text-quocngu-adapted', n, n + hour, n + hour, QUOCNGU_NOTE);
  }
  const [a, b] = halves(syllables);
  const up = a.reduce((x, y) => x + y, 0);
  const low = b.reduce((x, y) => x + y, 0);
  return build('text-quocngu-adapted', up, low, up + low + (hour ?? 0), QUOCNGU_NOTE);
}

function strokesOf(ch: string, opts: ByTextOptions): number {
  const n = opts.strokes?.(ch);
  if (n === undefined || !Number.isInteger(n) || n <= 0) throw new RangeError(`Không biết số nét của chữ «${ch}»`);
  return n;
}

// ---------- Ngũ hành, Thể / Dụng ----------

export type Element = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';

export const ELEMENT_VI: Record<Element, string> = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };

export const TRIGRAM_ELEMENT: Record<TrigramKey, Element> = {
  qian: 'kim',
  dui: 'kim',
  li: 'hoa',
  zhen: 'moc',
  xun: 'moc',
  kan: 'thuy',
  gen: 'tho',
  kun: 'tho',
};

const GENERATES: Record<Element, Element> = { moc: 'hoa', hoa: 'tho', tho: 'kim', kim: 'thuy', thuy: 'moc' };
const CONTROLS: Record<Element, Element> = { moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim', kim: 'moc' };

export type RelationKey = 'dung-sinh-the' | 'the-khac-dung' | 'ty-hoa' | 'the-sinh-dung' | 'dung-khac-the';
export type RelationVerdict = 'cat-lon' | 'cat' | 'hao' | 'hung';

export interface Relation {
  key: RelationKey;
  label: string;
  verdict: RelationVerdict;
  verdictLabel: string;
  summary: string;
}

const RELATIONS: Record<RelationKey, Omit<Relation, 'key'>> = {
  'dung-sinh-the': {
    label: 'Dụng sinh Thể',
    verdict: 'cat-lon',
    verdictLabel: 'Cát lớn',
    summary: 'Hoàn cảnh nuôi dưỡng, nâng đỡ phía mình.',
  },
  'the-khac-dung': {
    label: 'Thể khắc Dụng',
    verdict: 'cat',
    verdictLabel: 'Cát',
    summary: 'Mình chế ngự được việc, nhưng phải bỏ sức.',
  },
  'ty-hoa': {
    label: 'Tỷ hòa',
    verdict: 'cat',
    verdictLabel: 'Cát',
    summary: 'Cùng hành, đồng khí; việc thuận hòa.',
  },
  'the-sinh-dung': {
    label: 'Thể sinh Dụng',
    verdict: 'hao',
    verdictLabel: 'Hao',
    summary: 'Mình phải bỏ công sức, tiền của ra cho việc.',
  },
  'dung-khac-the': {
    label: 'Dụng khắc Thể',
    verdict: 'hung',
    verdictLabel: 'Hung',
    summary: 'Việc gây sức ép lên mình; nên thận trọng.',
  },
};

/**
 * Quan hệ của hành `other` đối với hành của Thể. 卷二 · 體用總訣: 「體克用，諸事吉；用克體，諸事凶。
 * 體生用，有耗失之患；用生體，有進益之喜。體用比和，則百事順遂」.
 */
export function relationToThe(the: Element, other: Element): Relation {
  const key: RelationKey =
    the === other
      ? 'ty-hoa'
      : GENERATES[other] === the
        ? 'dung-sinh-the'
        : GENERATES[the] === other
          ? 'the-sinh-dung'
          : CONTROLS[the] === other
            ? 'the-khac-dung'
            : 'dung-khac-the';
  return { key, ...RELATIONS[key] };
}

export type SeasonalStrength = 'vuong' | 'tuong' | 'huu' | 'tu-imprisoned' | 'tu-dead';

export const STRENGTH_VI: Record<SeasonalStrength, string> = {
  vuong: 'Vượng',
  tuong: 'Tướng',
  huu: 'Hưu',
  'tu-imprisoned': 'Tù',
  'tu-dead': 'Tử',
};

/**
 * Sách (卷二 · 體用總訣) chỉ chia thịnh / suy: 「盛者如春震、巽，秋乾、兌，夏離，冬坎，四季之月坤、艮…
 * 衰者，春坤、艮，秋震、巽，夏乾兌，冬離，四季之月坎」. Thang năm bậc dưới đây là cách chia
 * vượng tướng hưu tù tử thông dụng, bao trùm hai bậc của sách (vượng = thịnh, tử = suy).
 * Vượng tướng hưu tù tử của một hành theo hành đang lệnh (tháng):
 * cùng hành = vượng; lệnh sinh nó = tướng; nó sinh lệnh = hưu;
 * nó khắc lệnh = tù; lệnh khắc nó = tử.
 */
export function seasonalStrength(el: Element, month: Element): SeasonalStrength {
  if (el === month) return 'vuong';
  if (GENERATES[month] === el) return 'tuong';
  if (GENERATES[el] === month) return 'huu';
  if (CONTROLS[el] === month) return 'tu-imprisoned';
  return 'tu-dead';
}

/**
 * Hành đang lệnh theo tháng âm lịch (tháng Dần = 1): 1–2 Mộc, 4–5 Hỏa, 7–8 Kim,
 * 10–11 Thủy, các tháng cuối quý 3, 6, 9, 12 Thổ. Tiện ích; dùng tiết khí sẽ chính xác hơn.
 */
export function monthElementOfLunarMonth(m: number): Element {
  if (!Number.isInteger(m) || m < 1 || m > 12) throw new RangeError(`Tháng âm lịch không hợp lệ: ${m}`);
  if (m % 3 === 0) return 'tho';
  return m <= 2 ? 'moc' : m <= 5 ? 'hoa' : m <= 8 ? 'kim' : 'thuy';
}

export interface TrigramRole {
  trigram: TrigramKey;
  element: Element;
}

export interface RoleWithRelation extends TrigramRole {
  relation: Relation;
}

export interface MeihuaAnalysis {
  primary: number;
  movingLine: MovingLine;
  transformed: number;
  mutual: number;
  mutualUpper: TrigramKey;
  mutualLower: TrigramKey;
  /** Hỗ lấy từ quẻ chính, hay từ quẻ biến khi quẻ chính là Thuần Càn / Thuần Khôn (乾坤無互，互其變卦). */
  mutualOf: 'primary' | 'transformed';
  /** Thể nằm ở quái không có hào động. */
  thePosition: 'upper' | 'lower';
  the: TrigramRole;
  /** Dụng: quái chứa hào động (việc, người, hoàn cảnh). */
  dung: RoleWithRelation;
  /** Hỗ quái: diễn biến giữa chừng. */
  mutualUpperRole: RoleWithRelation;
  mutualLowerRole: RoleWithRelation;
  /** Biến quái: quái Dụng sau khi hào động đổi — kết cục. */
  changed: RoleWithRelation;
  theStrength?: { monthElement: Element; key: SeasonalStrength; label: string };
}

/**
 * Phân tích Thể – Dụng. 卷二 · 體用總訣: 「體卦為主，用卦為事，互卦為事之中間，刻應變卦為事之終」;
 * trang chính (khảo cứu): 「凡上下二卦無動爻者為體，有動爻者為用」.
 */
export function analyze(cast: Pick<MeihuaCast, 'upper' | 'lower' | 'movingLine'>, opts: { monthElement?: Element } = {}): MeihuaAnalysis {
  const { upper, lower, movingLine } = cast;
  const primary = hexagramFromTrigrams(lower, upper);
  const bin = hexagramBinary(primary);
  const flipped = [...bin].map((c, i) => (i === movingLine - 1 ? (c === '1' ? '0' : '1') : c)).join('');
  const transformed = hexagramFromBinary(flipped);
  // 卷一 · 互卦起例: 「以中間四爻分作兩卦…乾坤無互，互其變卦」 — Thuần Càn / Thuần Khôn lấy hỗ của quẻ biến.
  const mutualOf: 'primary' | 'transformed' = primary === 1 || primary === 2 ? 'transformed' : 'primary';
  const mBin = mutualOf === 'primary' ? bin : flipped;
  const mutualLower = trigramFromBinary(mBin.slice(1, 4));
  const mutualUpper = trigramFromBinary(mBin.slice(2, 5));
  const mutual = hexagramFromTrigrams(mutualLower, mutualUpper);

  const dungIsLower = movingLine <= 3;
  const theTrigram = dungIsLower ? upper : lower;
  const dungTrigram = dungIsLower ? lower : upper;
  const changedTrigram = trigramFromBinary(dungIsLower ? flipped.slice(0, 3) : flipped.slice(3));
  const theEl = TRIGRAM_ELEMENT[theTrigram];
  const role = (t: TrigramKey): RoleWithRelation => ({
    trigram: t,
    element: TRIGRAM_ELEMENT[t],
    relation: relationToThe(theEl, TRIGRAM_ELEMENT[t]),
  });

  const result: MeihuaAnalysis = {
    primary,
    movingLine,
    transformed,
    mutual,
    mutualUpper,
    mutualLower,
    mutualOf,
    thePosition: dungIsLower ? 'upper' : 'lower',
    the: { trigram: theTrigram, element: theEl },
    dung: role(dungTrigram),
    mutualUpperRole: role(mutualUpper),
    mutualLowerRole: role(mutualLower),
    changed: role(changedTrigram),
  };
  if (opts.monthElement) {
    const key = seasonalStrength(theEl, opts.monthElement);
    result.theStrength = { monthElement: opts.monthElement, key, label: STRENGTH_VI[key] };
  }
  return result;
}

// ---------- Hành đang lệnh theo tiết khí ----------

/**
 * Hành đang lệnh theo chi tháng tiết khí (`branch` 0 = Tý … 11 = Hợi, như `monthCanChi.branch`
 * của lunar.ts): Dần Mão Mộc, Tỵ Ngọ Hỏa, Thân Dậu Kim, Hợi Tý Thủy, Thìn Tuất Sửu Mùi Thổ.
 * Đây là cách chuẩn của app để xét vượng suy (tháng đổi ở tiết: Lập Xuân, Kinh Trập…);
 * `monthElementOfLunarMonth` chỉ giữ để tương thích.
 */
export function monthElementOfBranch(branch: number): Element {
  if (!Number.isInteger(branch) || branch < 0 || branch > 11) throw new RangeError(`Chi tháng phải 0–11 (Tý=0): ${branch}`);
  if (branch === 2 || branch === 3) return 'moc';
  if (branch === 5 || branch === 6) return 'hoa';
  if (branch === 8 || branch === 9) return 'kim';
  if (branch === 11 || branch === 0) return 'thuy';
  return 'tho';
}

// ---------- Nhập tay ----------

/** Nhập tay quái trên, quái dưới, hào động (vd. đã lập quẻ ở nơi khác, hoặc chép lại một quẻ trong sách). */
export function byManual(upper: TrigramKey, lower: TrigramKey, movingLine: MovingLine): MeihuaCast {
  if (!XIANTIAN_ORDER.includes(upper) || !XIANTIAN_ORDER.includes(lower)) throw new RangeError('Quái không hợp lệ');
  if (!Number.isInteger(movingLine) || movingLine < 1 || movingLine > 6) throw new RangeError(`Hào động phải 1–6: ${movingLine}`);
  return {
    method: 'manual',
    upperSum: XIANTIAN_NUMBER[upper],
    lowerSum: XIANTIAN_NUMBER[lower],
    movingSum: movingLine,
    upper,
    lower,
    movingLine,
    steps: [`Nhập tay: quái trên ${TRIGRAM_VI[upper]}, quái dưới ${TRIGRAM_VI[lower]}, hào động ${movingLine}`],
  };
}

// ---------- Kết luận tổng hợp ----------

export type VerdictLevel = 'dai-cat' | 'cat' | 'binh' | 'hung' | 'dai-hung';

export const VERDICT_VI: Record<VerdictLevel, string> = {
  'dai-cat': 'Đại cát',
  cat: 'Cát',
  binh: 'Bình',
  hung: 'Hung',
  'dai-hung': 'Đại hung',
};

/** Một yếu tố góp vào kết luận: vai (Dụng / hỗ / biến / vượng suy của Thể), mã lý do, điểm cộng trừ. */
export interface VerdictFactor {
  role: 'dung' | 'ho-tren' | 'ho-duoi' | 'bien' | 'the-vuong-suy';
  /** Mã lý do ổn định để lớp diễn giải và AI dùng, vd. "DUNG:dung-khac-the", "THE:tu-dead". */
  code: string;
  effect: number;
  label: string;
}

export interface MeihuaVerdict {
  level: VerdictLevel;
  label: string;
  score: number;
  factors: VerdictFactor[];
}

/**
 * Điểm theo quan hệ ngũ hành với Thể. Sách cho quy tắc định tính (Dụng sinh Thể, Thể khắc Dụng,
 * tỷ hòa: cát; Thể sinh Dụng: hao; Dụng khắc Thể: hung — xem `RELATIONS`); bảng điểm dưới đây là
 * QUY ƯỚC CỦA APP để gộp các yếu tố thành một mức, không phải lời sách.
 */
const DUNG_SCORE: Record<RelationKey, number> = { 'dung-sinh-the': 2, 'the-khac-dung': 1, 'ty-hoa': 1, 'the-sinh-dung': -1, 'dung-khac-the': -2 };
/** Hỗ (diễn biến giữa chừng) và biến (kết cục) chỉ tính phần sinh / khắc Thể, nhẹ hơn Dụng. */
const SIDE_SCORE: Record<RelationKey, number> = { 'dung-sinh-the': 1, 'the-khac-dung': 0, 'ty-hoa': 0, 'the-sinh-dung': 0, 'dung-khac-the': -1 };
const STRENGTH_SCORE: Record<SeasonalStrength, number> = { vuong: 1, tuong: 1, huu: 0, 'tu-imprisoned': -1, 'tu-dead': -1 };

/**
 * Gộp phân tích Thể – Dụng thành một mức cát / hung kèm các yếu tố có mã lý do.
 * Căn cứ (卷二 · 體用總訣): 「宜受他卦之生，不宜他卦之克。他卦者，謂用互變也」 — xét cả Dụng, hỗ, biến;
 * 「體盛則吉，體衰則凶」 — vượng suy của Thể; 卷二 · 卦斷遺論 giải các ví dụ 少年 / 牛 bằng việc hỗ, biến
 * cùng sinh hoặc cùng khắc Thể. Cách cho điểm là quy ước của app (xem DUNG_SCORE).
 * Thứ tự xét như sách: Dụng (chính), rồi hỗ quái (giữa chừng), biến quái (kết cục), và vượng suy của Thể theo tháng.
 * Mức: điểm ≥ 3 đại cát; ≥ 1 cát; 0 bình; ≤ −1 hung; ≤ −3 đại hung.
 */
export function verdict(a: MeihuaAnalysis): MeihuaVerdict {
  const rel = (role: VerdictFactor['role'], r: RoleWithRelation, table: Record<RelationKey, number>, prefix: string): VerdictFactor => ({
    role,
    code: `${prefix}:${r.relation.key}`,
    effect: table[r.relation.key],
    label: `${prefix === 'DUNG' ? 'Dụng' : prefix === 'BIEN' ? 'Biến quái' : prefix === 'HO_TREN' ? 'Hỗ trên' : 'Hỗ dưới'}: ${r.relation.label}`,
  });
  const factors: VerdictFactor[] = [
    rel('dung', a.dung, DUNG_SCORE, 'DUNG'),
    rel('ho-tren', a.mutualUpperRole, SIDE_SCORE, 'HO_TREN'),
    rel('ho-duoi', a.mutualLowerRole, SIDE_SCORE, 'HO_DUOI'),
    rel('bien', a.changed, SIDE_SCORE, 'BIEN'),
  ];
  if (a.theStrength)
    factors.push({ role: 'the-vuong-suy', code: `THE:${a.theStrength.key}`, effect: STRENGTH_SCORE[a.theStrength.key], label: `Thể ${a.theStrength.label} theo tháng` });
  const score = factors.reduce((s, f) => s + f.effect, 0);
  const level: VerdictLevel = score >= 3 ? 'dai-cat' : score >= 1 ? 'cat' : score === 0 ? 'binh' : score <= -3 ? 'dai-hung' : 'hung';
  return { level, label: VERDICT_VI[level], score, factors };
}
