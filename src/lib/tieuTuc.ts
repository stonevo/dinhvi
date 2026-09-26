import { vnParts, BRANCHES, type SolarTermInstant } from './lunar';

/**
 * Mười hai quẻ tiêu tức (quy ước tượng số, xem bài Nhập môn `tieu-tuc`), xếp theo
 * chi tháng Tý → Hợi. Số là số quẻ theo thứ tự Văn Vương.
 */
export const TIEU_TUC_HEXAGRAMS = [24, 19, 11, 34, 43, 1, 44, 33, 12, 20, 23, 2] as const;

export type MonthHexagram = {
  /** 0 = Tý … 11 = Hợi */
  branch: number;
  branchName: string;
  hexagram: number;
  /** Tiết khí đang hiệu lực. */
  term: SolarTermInstant;
};

/** Chi tháng theo tiết khí (giờ Việt Nam) và quẻ tiêu tức ứng với tháng đó. */
export function monthHexagram(date: Date): MonthHexagram {
  const p = vnParts(date);
  const branch = p.monthCanChi.branch;
  return { branch, branchName: BRANCHES[branch], hexagram: TIEU_TUC_HEXAGRAMS[branch], term: p.solarTerm };
}

/** Một câu ngắn cho mỗi tháng (Tý → Hợi), theo nguồn trong bài `tieu-tuc`. */
export const TIEU_TUC_NOTES: readonly string[] = [
  'Một hào dương sinh dưới năm hào âm; Chu Hy: tháng mười một thì quẻ là Phục.',
  'Hai hào dương dưới bốn hào âm; Chu Hy: Lâm là quẻ tháng mười hai.',
  'Ba hào dương dưới ba hào âm.',
  'Bốn hào dương dưới hai hào âm.',
  'Năm hào dương dưới một hào âm.',
  'Sáu hào đều dương; Ngu Phiên: Càn tức (dương lớn) từ Tý đến Tỵ.',
  'Một hào âm sinh dưới năm hào dương; Chu Hy: quẻ Cấu tháng năm, một âm mới sinh.',
  'Hai hào âm dưới bốn hào dương.',
  'Ba hào âm dưới ba hào dương.',
  'Bốn hào âm dưới hai hào dương.',
  'Năm hào âm dưới một hào dương.',
  'Sáu hào đều âm; Chu Hy: Khôn thuần là quẻ tháng mười.',
];
