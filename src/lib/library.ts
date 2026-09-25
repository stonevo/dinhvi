import type { Hexagram, StageInCycle, TrigramKey } from '../types/schema';
import { fullHexagramName } from '../data/names';

export type LibraryFilter = {
  query?: string;
  upper?: TrigramKey | '';
  lower?: TrigramKey | '';
  stage?: StageInCycle | '';
};

/** Bỏ dấu tiếng Việt để tìm "truan" ra "Truân". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

/**
 * Lọc 64 quẻ theo chữ (tên, tên đầy đủ, nghĩa, chủ đề, số), quái trên/dưới, giai đoạn.
 * Quẻ khớp theo tên đứng trước quẻ chỉ khớp trong chủ đề.
 */
export function filterHexagrams(list: Hexagram[], f: LibraryFilter): Hexagram[] {
  const q = fold(f.query?.trim() ?? '');
  const byName = (h: Hexagram) => (q && fold(`${h.nameHanViet} ${fullHexagramName(h)}`).includes(q) ? 0 : 1);
  return list.filter((h) => {
    if (f.upper && h.upperTrigram !== f.upper) return false;
    if (f.lower && h.lowerTrigram !== f.lower) return false;
    if (f.stage && h.stageInCycle !== f.stage) return false;
    if (!q) return true;
    if (/^\d+$/.test(q)) return h.kingWenNumber === Number(q);
    const hay = fold([h.nameHanViet, fullHexagramName(h), h.nameVi, h.theme].join(' '));
    return h.nameHan.includes(f.query!.trim()) || q.split(/\s+/).every((w) => hay.includes(w));
  }).sort((a, b) => byName(a) - byName(b) || a.kingWenNumber - b.kingWenNumber);
}
