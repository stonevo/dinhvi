import type { Hexagram, TrigramKey } from '../types/schema';

/** Tên chuẩn 64 quẻ theo thứ tự King Wen — bảng độc lập để test đối chiếu dữ liệu. */
export const CANONICAL_NAMES: [hanViet: string, han: string][] = [
  ['Càn', '乾'], ['Khôn', '坤'], ['Truân', '屯'], ['Mông', '蒙'], ['Nhu', '需'], ['Tụng', '訟'],
  ['Sư', '師'], ['Tỷ', '比'], ['Tiểu Súc', '小畜'], ['Lý', '履'], ['Thái', '泰'], ['Bĩ', '否'],
  ['Đồng Nhân', '同人'], ['Đại Hữu', '大有'], ['Khiêm', '謙'], ['Dự', '豫'], ['Tùy', '隨'], ['Cổ', '蠱'],
  ['Lâm', '臨'], ['Quan', '觀'], ['Phệ Hạp', '噬嗑'], ['Bí', '賁'], ['Bác', '剝'], ['Phục', '復'],
  ['Vô Vọng', '無妄'], ['Đại Súc', '大畜'], ['Di', '頤'], ['Đại Quá', '大過'], ['Khảm', '坎'], ['Ly', '離'],
  ['Hàm', '咸'], ['Hằng', '恆'], ['Độn', '遯'], ['Đại Tráng', '大壯'], ['Tấn', '晉'], ['Minh Di', '明夷'],
  ['Gia Nhân', '家人'], ['Khuê', '睽'], ['Kiển', '蹇'], ['Giải', '解'], ['Tổn', '損'], ['Ích', '益'],
  ['Quải', '夬'], ['Cấu', '姤'], ['Tụy', '萃'], ['Thăng', '升'], ['Khốn', '困'], ['Tỉnh', '井'],
  ['Cách', '革'], ['Đỉnh', '鼎'], ['Chấn', '震'], ['Cấn', '艮'], ['Tiệm', '漸'], ['Quy Muội', '歸妹'],
  ['Phong', '豐'], ['Lữ', '旅'], ['Tốn', '巽'], ['Đoài', '兌'], ['Hoán', '渙'], ['Tiết', '節'],
  ['Trung Phu', '中孚'], ['Tiểu Quá', '小過'], ['Ký Tế', '既濟'], ['Vị Tế', '未濟'],
];

/** Tên Hán Việt của tượng quái khi ghép tên đầy đủ: Thủy Lôi Truân. */
export const TRIGRAM_IMAGE_HV: Record<TrigramKey, string> = {
  qian: 'Thiên', dui: 'Trạch', li: 'Hỏa', zhen: 'Lôi', xun: 'Phong', kan: 'Thủy', gen: 'Sơn', kun: 'Địa',
};

/** "Thủy Lôi Truân", hoặc "Thuần Càn" khi hai quái trùng nhau. */
export function fullHexagramName(h: Pick<Hexagram, 'nameHanViet' | 'lowerTrigram' | 'upperTrigram'>): string {
  if (h.lowerTrigram === h.upperTrigram) return `Thuần ${h.nameHanViet}`;
  return `${TRIGRAM_IMAGE_HV[h.upperTrigram]} ${TRIGRAM_IMAGE_HV[h.lowerTrigram]} ${h.nameHanViet}`;
}
