// Ba bài ca nhớ quẻ trong phần "卦歌" ở quyển đầu bản Tứ khố Chu Dịch bản nghĩa
// (Kanripo KR1a0032, 周易本義). Đề yếu Tứ khố ghi bản khắc Ngô Cách không có các bài ca
// này, "bản nay" mới thêm vào (増列卦歌), nên app không ghi là của Chu Hy. Chữ Hán theo bản đó, dị thể đưa về chữ
// thông dụng như tên quẻ trong app (䝉→蒙, 㤗→泰, 剥→剝, 頥→頤, 晋→晉, 兑→兌, 无→無, 恒→恆, 㑹→會);
// âm Hán Việt và lời giải là của app.

export type Verse = { han: string; hanViet: string; note?: string };

export const VERSE_SOURCE = 'phần Quái ca ở quyển đầu bản Tứ khố Chu Dịch bản nghĩa (Kanripo KR1a0032); đề yếu Tứ khố ghi các bài ca này do bản in sau thêm vào';

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
  { han: '剝復無妄大畜頤', hanViet: 'Bác Phục Vô Vọng Đại Súc Di', from: 23, to: 27 },
  { han: '大過坎離三十備', hanViet: 'Đại Quá Khảm Ly tam thập bị', from: 28, to: 30, note: 'đủ ba mươi quẻ Thượng kinh' },
  { han: '咸恆遯兮及大壯', hanViet: 'Hàm Hằng Độn hề cập Đại Tráng', from: 31, to: 34 },
  { han: '晉與明夷家人睽', hanViet: 'Tấn dữ Minh Di Gia Nhân Khuê', from: 35, to: 38 },
  { han: '蹇解損益夬姤萃', hanViet: 'Kiển Giải Tổn Ích Quải Cấu Tụy', from: 39, to: 45 },
  { han: '升困井革鼎震繼', hanViet: 'Thăng Khốn Tỉnh Cách Đỉnh Chấn kế', from: 46, to: 51 },
  { han: '艮漸歸妹豐旅巽', hanViet: 'Cấn Tiệm Quy Muội Phong Lữ Tốn', from: 52, to: 57 },
  { han: '兌渙節兮中孚至', hanViet: 'Đoài Hoán Tiết hề Trung Phu chí', from: 58, to: 61 },
  { han: '小過既濟兼未濟', hanViet: 'Tiểu Quá Ký Tế kiêm Vị Tế', from: 62, to: 64 },
  { han: '是為下經三十四', hanViet: 'thị vi Hạ kinh tam thập tứ', from: 64, to: 64, note: 'đó là ba mươi tư quẻ Hạ kinh' },
];

/** Thượng hạ kinh quái biến ca: quẻ nào do quẻ nào biến ra (quái biến theo Chu Hy). */
export const CHANGE_VERSE_INTRO =
  "Quyển đầu Chu Dịch bản nghĩa (bản Tứ khố) có \"Quái biến đồ\" (卦變圖); lời ghi dưới đồ nói: Thoán truyện có chỗ lấy quái biến để giải, nay làm đồ này cho rõ; đại để đó là một nghĩa trong Dịch, không phải ý gốc khi vạch quẻ làm Dịch (彖傳或以卦變為説，今作此圖以明之。蓋易中之一義，非畫卦作易之本指也). Theo đồ ấy, quẻ một âm hoặc một dương đều từ Phục, Cấu mà ra; quẻ hai âm hoặc hai dương từ Lâm, Độn; quẻ ba âm ba dương từ Thái, Bĩ; quẻ bốn âm hoặc bốn dương từ Đại Tráng, Quan; quẻ năm âm hoặc năm dương từ Quải, Bác. Bài \"Thượng hạ kinh quái biến ca\" ở cùng quyển kể mười chín quẻ, quẻ nào do quẻ nào biến ra; mười chín quẻ ấy đều có lời chú quái biến tương ứng mà Chu Hy ghi ở quẻ đó trong Bản nghĩa (riêng Cổ, Chu Hy ghi là thuyết \"có người nói\" (或曰); Hàm, Hằng thì ghi \"hoặc lấy quái biến mà nói… cũng thông\"). Đề yếu Tứ khố đặt đầu bản này nói bản khắc của Ngô Cách (吳革) đầu sách chỉ có chín đồ, cuối sách có năm bài Dịch tán và một thiên Thệ nghi, khác hẳn \"bản nay\" đưa Thệ nghi lên trước và thêm các bài quái ca (今本升筮儀于前而増列卦歌之類者亦迥乎不同); còn bản chép Tứ khố trên Kanripo (KR1a0032) thì có phần Quái ca và Thệ nghi ở quyển đầu.";
export const CHANGE_VERSE: Verse[] = [
  {"han":"訟自遯變泰歸妹","hanViet":"Tụng tự Độn biến Thái Quy Muội","note":"Tụng do Độn biến ra (Bản nghĩa: hào dương đến ở vị 2); Thái từ Quy Muội (hào âm đi lên vị 4, hào dương đến vị 3)"},
  {"han":"否從漸來隨三位","hanViet":"Bĩ tùng Tiệm lai Tùy tam vị","note":"Bĩ từ Tiệm mà đến (hào dương đi lên vị 4, hào âm đến vị 3); Tùy có ba (quẻ gốc, kể ở vế sau)"},
  {"han":"首困噬嗑未濟兼","hanViet":"thủ Khốn Phệ Hạp Vị Tế kiêm","note":"(Tùy) trước hết từ Khốn (hào dương đến vị 1), lại từ Phệ Hạp (hào dương đến vị 5); từ Vị Tế thì gồm cả hai biến ấy"},
  {"han":"蠱三變賁井既濟","hanViet":"Cổ tam biến Bí Tỉnh Ký Tế","note":"Cổ có ba biến: từ Bí, từ Tỉnh, từ Ký Tế (Bản nghĩa ghi đây là thuyết \"có người nói\")"},
  {"han":"噬嗑六五本益生","hanViet":"Phệ Hạp lục ngũ bản Ích sinh","note":"hào sáu năm của Phệ Hạp vốn từ Ích sinh ra: hào âm ở vị 4 quẻ Ích đi lên đến vị 5"},
  {"han":"賁原於損既濟會","hanViet":"Bí nguyên ư Tổn Ký Tế hội","note":"Bí gốc ở Tổn (hào âm từ vị 3 đến vị 2, hào dương từ vị 2 lên vị 3), lại gặp cả Ký Tế (hào âm từ vị trên cùng đến vị 5, hào dương từ vị 5 lên vị trên cùng)"},
  {"han":"無妄訟來大畜需","hanViet":"Vô Vọng Tụng lai Đại Súc Nhu","note":"Vô Vọng từ Tụng mà đến (hào dương từ vị 2 đến vị 1); Đại Súc từ Nhu (hào dương từ vị 5 lên vị trên cùng)"},
  {"han":"咸旅恆豐皆疑似","hanViet":"Hàm Lữ Hằng Phong giai nghi tự","note":"Hàm từ Lữ, Hằng từ Phong, đều chưa chắc: Bản nghĩa chỉ nói \"hoặc lấy quái biến mà nói\" thì \"cũng thông\""},
  {"han":"晉從觀更睽有三","hanViet":"Tấn tùng Quan canh Khuê hữu tam","note":"Tấn từ Quan mà đến (hào âm ở vị 4 tiến lên vị 5); Khuê có ba (quẻ gốc, kể ở vế sau)"},
  {"han":"離與中孚家人繫","hanViet":"Ly dữ Trung Phu Gia Nhân hệ","note":"Ly, Trung Phu và Gia Nhân nối vào Khuê: từ Ly thì hào âm tiến lên vị 3, từ Trung Phu thì hào âm tiến lên vị 5, từ Gia Nhân thì gồm cả hai"},
  {"han":"蹇利西南小過來","hanViet":"Kiển lợi Tây Nam Tiểu Quá lai","note":"Kiển \"lợi Tây Nam\" từ Tiểu Quá mà đến: hào dương tiến lên ở vị 5 mà được chỗ giữa"},
  {"han":"解升二卦相為贅","hanViet":"Giải Thăng nhị quái tương vi chuế","note":"hai quẻ Giải và Thăng dính vào nhau: Giải từ Thăng mà đến, Thăng từ Giải mà đến"},
  {"han":"鼎由巽變漸渙旅","hanViet":"Đỉnh do Tốn biến Tiệm Hoán Lữ","note":"Đỉnh do Tốn biến ra (hào âm tiến lên vị 5); Tiệm từ Hoán (hào dương tiến lên vị 3) và từ Lữ (hào dương tiến lên vị 5)"},
  {"han":"渙自漸來終於是","hanViet":"Hoán tự Tiệm lai chung ư thị","note":"Hoán từ Tiệm mà đến (hào dương đến vị 2, hào âm lên vị 3); bài ca dừng ở đây"},
];
