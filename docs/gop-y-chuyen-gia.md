# Góp ý chuyên gia — đối chiếu và kế hoạch

*Ghi ngày 26/09/2026, cập nhật cùng ngày sau khi làm. Mỗi mục: góp ý → app đang có gì → việc đã làm.*

## 1. Engine lập quẻ (tách khỏi phần diễn giải)

| Góp ý | Đang có | Trạng thái |
|---|---|---|
| Gieo 3 xu ngẫu nhiên | Có (`src/lib/cast.ts`, `crypto.getRandomValues`) | ✅ có sẵn |
| Nhập tay khi gieo xu thật | Chưa | ✅ đã làm: nhập từng hào (số ngửa 0–3 hoặc 6/7/8/9) |
| Mai Hoa theo giờ động tâm | Chưa | ✅ đã làm: (năm chi + tháng âm + ngày âm) mod 8 → thượng; + giờ chi → hạ; tổng mod 6 → hào động |
| Mai Hoa theo số (số điện thoại, số bất kỳ) | Chưa | ✅ đã làm: hai số, hoặc một dãy số chia đôi; hào động = tổng (+ giờ) mod 6 |
| Mai Hoa theo chữ | Chưa | ✅ đã làm: chữ Hán đếm nét (Unihan kTotalStrokes) theo phép "tự chiêm"; chữ Quốc ngữ đếm chữ cái — ghi rõ là cách thích ứng, không phải nguyên bản |
| Lục Hào: Thế – Ứng | Chưa | ✅ đã làm |
| Lục thân | Chưa | ✅ đã làm (so ngũ hành hào với ngũ hành cung) |
| Lục thần | Chưa | ✅ đã làm (theo can ngày) |
| Dụng thần | Chưa | ✅ đã làm: gợi ý theo chủ đề câu hỏi, cho chọn tay |
| Không vong | Chưa | ✅ đã làm (theo tuần của ngày) |
| Nhật thần, Nguyệt lệnh | Chưa | ✅ đã làm (chi ngày; chi tháng theo tiết khí) |
| Phục thần | Chưa | ✅ đã làm (lục thân thiếu → lấy từ quẻ thuần của cung) |
| Hào động / biến, quẻ biến | Có hào động, quẻ biến; chưa có can chi hào biến | ✅ đã bổ sung nạp giáp cho hào biến |
| Quẻ hỗ | Chưa | ✅ đã làm (hào 2–4 làm quái dưới, 3–5 làm quái trên) |
| Mai Hoa: Thể – Dụng, ngũ hành sinh khắc, thể dụng hỗ biến | Chưa | ✅ đã làm |
| Âm lịch và tiết khí Việt Nam chính xác (UTC+7, giờ Tý từ 23h, can chi giờ theo ngày) | Chưa có âm lịch | ✅ đã làm: thuật toán Hồ Ngọc Đức (theo Jean Meeus), múi giờ +7 cố định bất kể máy đang ở đâu; tiết khí tính theo kinh độ Mặt Trời; tháng can chi đổi theo tiết (Lập Xuân…), không theo tháng âm; tuỳ chọn "23h tính sang ngày mới" |

**Cách làm:** mỗi phần là module thuần, có test đối chiếu số liệu đã biết:
- `src/lib/lunar.ts`: âm lịch, tiết khí, can chi năm, tháng, ngày, giờ.
- `src/lib/liuyao.ts`: Lục Hào nạp giáp. Thứ tự tám cung đối chiếu với bài "Phân cung quái tượng thứ tự" trong phần Quái ca của *Chu Dịch bản nghĩa* (Kanripo KR1a0032).
- `src/lib/meihua.ts`: Mai Hoa.

Engine không phụ thuộc phần diễn giải.

## 2. Thư viện 64 quẻ, 384 hào

| Góp ý | Đang có | Trạng thái |
|---|---|---|
| Nguyên văn Hán, phiên âm, dịch nghĩa | Có: chữ Hán (Kanripo), Hán Việt, dịch sát, Thoán, Tượng, Văn ngôn, giảng, ý Trình Di / Chu Hy / Nguyễn Hiến Lê / Phan Bội Châu | ✅ có sẵn |
| Diễn giải hiện đại | Có (tình huống, cái nguy, chỗ vấp, lời truyền thống, câu hỏi tự soi) | ✅ có sẵn |
| Diễn giải theo ngữ cảnh: công việc, tình cảm, tài chính, sức khoẻ, đi xa | Chưa | ✅ đã làm: file riêng `public/data/contexts.json`, mỗi lời quẻ và mỗi hào có 5 ngữ cảnh; schema zod, lọc theo chủ đề |
| Dữ liệu có cấu trúc (JSON) để AI / lọc dùng lại | Có (zod schema, `hexagrams.json`, `commentary.json`) | ✅ có sẵn |
| Bản quyền: tự biên soạn phần hiện đại | Đã làm: toàn bộ phần tiếng Việt là lời tự viết; Nguyễn Hiến Lê, Phan Bội Châu, Ngô Tất Tố chỉ dùng để đối chiếu, tóm ý bằng lời riêng (xem `quy-trinh-noi-dung.md`) | ✅ có sẵn |

## 3. Nhật ký quẻ có "đóng kết quả"

| Góp ý | Đang có | Trạng thái |
|---|---|---|
| Lưu câu hỏi, ngữ cảnh, phương pháp, thời điểm | Bản ghi định vị: có đủ. Lần gieo: có câu hỏi, thời điểm, ghi chú; **chưa có ngữ cảnh, phương pháp** | ✅ đã làm |
| Quay lại đánh dấu "ứng nghiệm / không / một phần" + ghi chú | Bản ghi định vị: có nhìn lại và hiệu chỉnh. **Lần gieo: chưa** | ✅ đã làm |
| Nhắc hạn đối chiếu ("quẻ hỏi về việc ngày X, đến hạn đối chiếu") | Có nhắc theo kỳ cho định vị; **chưa có hạn cho từng lần gieo** | ✅ đã làm: ngày đối chiếu cho mỗi lần gieo, hiện ở trang chủ và trong nhắc nền |
| Thống kê ứng nghiệm | Có hiệu chỉnh cho định vị; chưa cho lần gieo | ✅ đã làm: tỉ lệ ứng nghiệm theo phương pháp và theo ngữ cảnh (kèm n) |

## 4. Trải nghiệm gieo có nghi thức

| Góp ý | Đang có | Trạng thái |
|---|---|---|
| Màn hình tĩnh tâm | Chưa | ✅ đã làm: bước tĩnh tâm (nhịp thở), có thể bỏ qua |
| Nhập câu hỏi trước | Có ô câu hỏi nhưng không bắt buộc, không đứng trước | ✅ đã làm: câu hỏi và ngữ cảnh là bước đầu |
| Hiệu ứng gieo xu vật lý | Chưa (chỉ hiện chữ ngửa/sấp) | ✅ đã làm: ba đồng xu lật bằng CSS 3D; tôn trọng "giảm chuyển động" |
| Haptic | Chưa | ✅ đã làm: `navigator.vibrate` (Android; iOS Safari không hỗ trợ — bỏ qua êm) |
| Âm thanh | Chưa | ✅ đã làm: tiếng xu tổng hợp bằng Web Audio (không cần file), tắt được trong Cài đặt |

## Thứ tự làm
1. Âm lịch, tiết khí, can chi (nền cho Lục Hào và Mai Hoa).
2. Lục Hào và Mai Hoa. Nhập tay khi gieo xu thật. Quẻ hỗ.
3. Trang Gieo quẻ mới:
   - chọn phương pháp;
   - câu hỏi và ngữ cảnh trước, tĩnh tâm;
   - gieo có hiệu ứng;
   - kết quả gồm ba tab: Kinh văn, Lục Hào, Mai Hoa.
4. Nhật ký gieo: ngữ cảnh, phương pháp, ngày đối chiếu, đánh dấu ứng nghiệm, nhắc, thống kê.
5. Diễn giải theo 5 ngữ cảnh cho 64 lời quẻ và 384 hào. Soát lại xem có đảo cát/hung so với lời hào không.

## Kết quả kiểm chứng (26/09/2026)
- **Âm lịch:** thuật toán Hồ Ngọc Đức, UTC+7. Tết 2020–2027 đúng; Tết 1985 và 2007 đúng theo lịch Việt Nam (khác lịch Trung Quốc); tháng nhuận 2020, 2023, 2025 đúng; đổi dương → âm → dương khớp cho mọi ngày từ 1950 đến 2080. Sửa hai lỗi của mã gốc: ngày 0 vào 2054-05-07, 2062-04-09; tháng nhuận 12.
- **Tiết khí:** mô hình Mặt Trời độ chính xác cao (VSOP87 rút gọn, Meeus), so với Đài Thiên văn Hồng Kông: 48 tiết 2025–2026 lệch khoảng 1 phút.
- **Can chi:** ngày 01/01/2000 là Mậu Ngọ; ngày 26/09/2026 là Quý Mão, tháng Đinh Dậu; tháng đổi theo Lập Xuân; giờ Tý từ 23h (có tuỳ chọn).
- **Lục Hào:** thứ tự 64 quẻ trong tám cung khớp bài "Phân cung quái tượng thứ tự" (Chu Hy, KR1a0032); ví dụ quẻ Cấu (Thế, Ứng, lục thân, phục thần Dần Thê Tài dưới hào 2) đúng.
- **Mai Hoa:** ví dụ "Quán mai" trong sách (năm Thìn, tháng 12, ngày 17, giờ Thân → Cách biến Hàm) đúng.
- **Diễn giải theo ngữ cảnh:** 64 lời quẻ × 384 hào × 5 ngữ cảnh. Qua một lượt soát sửa 22 ô (chủ yếu ô sức khoẻ nghe như chẩn đoán) và 4 ô ở 63 hào 5 theo nghĩa cũ.

## Chưa làm / giới hạn
- Lục Hào chưa luận vượng suy, nguyệt phá, ám động, tiến thần / thoái thần. Mới an đủ các thành phần và quan hệ sinh khắc đơn giản với nhật, nguyệt.
- Dụng thần là gợi ý theo chủ đề (quy ước phổ biến); nguồn cổ (Tăng San Bốc Dịch) chưa đối chiếu trực tiếp.
- Mai Hoa theo chữ Quốc ngữ là cách thích ứng hiện đại, app ghi rõ điều này. Chữ Hán đếm nét theo Unihan kTotalStrokes (bản phồn thể), không theo cách tính bộ thủ Khang Hy.
- Rung không chạy trên iPhone (Safari không hỗ trợ `navigator.vibrate`).
