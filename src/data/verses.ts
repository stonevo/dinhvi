// Hai bài ca nhớ quẻ trong phần "卦歌" đầu sách Chu Dịch bản nghĩa của Chu Hy
// (Kanripo KR1a0032, 別本周易本義, quyển đầu). Chữ Hán theo bản đó, dị thể đưa về chữ
// thông dụng như tên quẻ trong app (䝉→蒙, 㤗→泰, 剥→剝, 頥→頤, 晋→晉, 兑→兌);
// âm Hán Việt và lời giải là của app.

export type Verse = { han: string; hanViet: string; note?: string };

export const VERSE_SOURCE = 'Chu Hy, Chu Dịch bản nghĩa — phần Quái ca (Kanripo KR1a0032)';

/** Bát quái thủ tượng ca: nhớ hình tám quái. */
export const TRIGRAM_VERSE: Verse[] = [
  { han: '乾三連', hanViet: 'Càn tam liên', note: 'Càn ba vạch liền' },
  { han: '坤六斷', hanViet: 'Khôn lục đoạn', note: 'Khôn sáu đoạn đứt (ba vạch đứt)' },
  { han: '震仰盂', hanViet: 'Chấn ngưỡng vu', note: 'Chấn như cái chậu ngửa: vạch liền ở dưới' },
  { han: '艮覆盌', hanViet: 'Cấn phúc uyển', note: 'Cấn như cái bát úp: vạch liền ở trên' },
  { han: '離中虛', hanViet: 'Ly trung hư', note: 'Ly giữa rỗng: vạch giữa đứt' },
  { han: '坎中滿', hanViet: 'Khảm trung mãn', note: 'Khảm giữa đầy: vạch giữa liền' },
  { han: '兌上缺', hanViet: 'Đoài thượng khuyết', note: 'Đoài trên khuyết: vạch trên đứt' },
  { han: '巽下斷', hanViet: 'Tốn hạ đoạn', note: 'Tốn dưới đứt: vạch dưới đứt' },
];

/** Thượng hạ kinh quái danh thứ tự ca: nhớ thứ tự 64 quẻ. `from`: số quẻ đầu câu. */
export const ORDER_VERSE: (Verse & { from: number; to: number })[] = [
  { han: '乾坤屯蒙需訟師', hanViet: 'Càn Khôn Truân Mông Nhu Tụng Sư', from: 1, to: 7 },
  { han: '比小畜兮履泰否', hanViet: 'Tỷ Tiểu Súc hề Lý Thái Bĩ', from: 8, to: 12 },
  { han: '同人大有謙豫隨', hanViet: 'Đồng Nhân Đại Hữu Khiêm Dự Tùy', from: 13, to: 17 },
  { han: '蠱臨觀兮噬嗑賁', hanViet: 'Cổ Lâm Quan hề Phệ Hạp Bí', from: 18, to: 22 },
  { han: '剝復无妄大畜頤', hanViet: 'Bác Phục Vô Vọng Đại Súc Di', from: 23, to: 27 },
  { han: '大過坎離三十備', hanViet: 'Đại Quá Khảm Ly tam thập bị', from: 28, to: 30, note: 'đủ ba mươi quẻ Thượng kinh' },
  { han: '咸恒遯兮及大壯', hanViet: 'Hàm Hằng Độn hề cập Đại Tráng', from: 31, to: 34 },
  { han: '晉與明夷家人睽', hanViet: 'Tấn dữ Minh Di Gia Nhân Khuê', from: 35, to: 38 },
  { han: '蹇解損益夬姤萃', hanViet: 'Kiển Giải Tổn Ích Quải Cấu Tụy', from: 39, to: 45 },
  { han: '升困井革鼎震繼', hanViet: 'Thăng Khốn Tỉnh Cách Đỉnh Chấn kế', from: 46, to: 51 },
  { han: '艮漸歸妹豐旅巽', hanViet: 'Cấn Tiệm Quy Muội Phong Lữ Tốn', from: 52, to: 57 },
  { han: '兌渙節兮中孚至', hanViet: 'Đoài Hoán Tiết hề Trung Phu chí', from: 58, to: 61 },
  { han: '小過既濟兼未濟', hanViet: 'Tiểu Quá Ký Tế kiêm Vị Tế', from: 62, to: 64 },
  { han: '是為下經三十四', hanViet: 'thị vi Hạ kinh tam thập tứ', from: 64, to: 64, note: 'đó là ba mươi tư quẻ Hạ kinh' },
];
