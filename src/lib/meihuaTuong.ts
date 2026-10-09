// Tra bảng vật tượng Mai Hoa (public/data/meihua-tuong.json, nguyên văn 八卦萬物屬類 卷一) để chọn quái
// cho phép lấy quẻ theo vật (byObject). Thuần: dữ liệu do người gọi nạp và truyền vào.
import type { MeihuaTuong, TrigramKey, TuongItem } from '../types/schema';

export interface TuongHit {
  trigram: TrigramKey;
  /** 'short' = bảng 八卦萬物屬類（並為上卦）; còn lại là tên mục (天時, 人物, 靜物…). */
  category: string;
  item: TuongItem;
}

const norm = (s: string) => s.normalize('NFC').trim().toLowerCase();

/**
 * Tìm vật tượng theo chữ Hán (khớp đúng cả mục hoặc chứa trong mục) hoặc theo nghĩa tiếng Việt nháp / âm Hán Việt
 * (chứa chuỗi, không phân biệt hoa thường). Trả về mọi chỗ khớp, bảng ngắn trước.
 */
export function findTuong(data: MeihuaTuong, query: string): TuongHit[] {
  const q = norm(query);
  if (!q) return [];
  const match = (i: TuongItem) => i.han.includes(query.trim()) || norm(i.vi).includes(q) || norm(i.hanViet).includes(q);
  const hits: TuongHit[] = [];
  for (const t of data.trigrams) for (const item of t.short) if (match(item)) hits.push({ trigram: t.key, category: 'short', item });
  for (const t of data.trigrams)
    for (const c of t.detail) for (const item of c.items) if (match(item)) hits.push({ trigram: t.key, category: c.category, item });
  return hits;
}
