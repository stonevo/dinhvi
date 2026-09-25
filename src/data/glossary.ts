/** Giải thích ngắn các thuật ngữ, hiện khi bấm ⓘ cạnh thuật ngữ. */
export const GLOSSARY = {
  quai: {
    term: 'Quái',
    text: 'Nhóm ba vạch. Có 8 quái (Càn, Khôn, Chấn, Tốn, Khảm, Ly, Cấn, Đoài), mỗi quái là một trạng thái: mạnh, mềm, chấn động, thấm dần, hiểm, sáng, dừng, mở. Hai quái chồng lên nhau thành một quẻ.',
  },
  que: {
    term: 'Quẻ',
    text: 'Sáu vạch, gồm quái dưới (trạng thái bên trong bạn) và quái trên (hoàn cảnh bên ngoài). Có 64 quẻ, mỗi quẻ là một dạng tình huống.',
  },
  hao: {
    term: 'Hào',
    text: 'Một vạch trong quẻ, đếm từ dưới lên (hào 1 đến hào 6). Hào cho biết bạn đang đứng ở vị trí nào trong tình huống: mới vào, có chỗ đứng, chuyển tiếp, gần quyền, quyết định, hay đã qua đỉnh.',
  },
  tang: {
    term: 'Tầng',
    text: 'Sáu hào chia ba tầng: hào 1–2 là Địa (nền tảng), hào 3–4 là Nhân (con người, quan hệ), hào 5–6 là Thiên (tầm nhìn, di sản). Chọn tầng trước giúp thu hẹp còn hai hào.',
  },
  tuQuai: {
    term: 'Tự quái',
    text: 'Thứ tự 64 quẻ theo truyền thống (King Wen), kèm lời giải thích vì sao quẻ này đến sau quẻ kia. Dùng để xem quãng đường bạn vừa đi có khớp với quẻ đứng trước không.',
  },
  bangThong: {
    term: 'Bàng thông',
    text: 'Quẻ có mọi vạch đảo ngược âm dương so với quẻ đang xét — mặt đối lập của cùng tình huống.',
  },
  haoDoi: {
    term: 'Hào đối',
    text: 'Hào ở vị trí đối xứng trong cùng quẻ: hào 1 ↔ 6, 2 ↔ 5, 3 ↔ 4.',
  },
  haoDong: {
    term: 'Hào động',
    text: 'Khi gieo, hào ra 6 (lão âm) hoặc 9 (lão dương) là hào động — đang chuyển sang mặt ngược lại. Hào động thường là chỗ đáng đọc kỹ nhất.',
  },
  queBien: {
    term: 'Quẻ biến',
    text: 'Quẻ có được khi mọi hào động đổi âm dương. Quẻ biến cho thấy tình huống đang chuyển về hướng nào.',
  },
  nhinLai: {
    term: 'Nhìn lại',
    text: 'Sau một kỳ, bạn ghi lại kỳ đó thực sự ở quẻ, hào nào và chuyện gì đã xảy ra. So nhìn lại với lúc định vị là cách biết mình định vị chính xác đến đâu.',
  },
  hieuChinh: {
    term: 'Hiệu chỉnh',
    text: 'Thống kê từ những lần đã nhìn lại: độ chắc có khớp thực tế không, bạn hay tự đặt cao hay thấp, nhân chứng có đúng hơn bạn không…',
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
