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
- ✅ (bổ sung) Lục Hào đã luận: vượng/tướng/hưu/tù/tử, nguyệt phá / chân phá / phá mà không phá, ám động, nhật phá, tuần không (chân / giả), hào động hóa tiến / thoái / hồi đầu sinh khắc xung / hóa không / hóa phá / hóa mộ / hóa tuyệt, phục thần (6 hữu dụng / 5 vô dụng), nguyên – kỵ – cừu thần, tham sinh vong khắc. Mỗi lý do kèm nguồn (Tăng San Bốc Dịch, Bốc Phệ Chính Tông, Hoàng Kim Sách, Hỏa Châu Lâm) — xem `luc-hao-nguon.md`. Chưa làm: tam hợp, lục hợp, tam hình, tùy quỷ nhập mộ, phản ngâm / phục ngâm, ứng kỳ. Cách cộng trừ lý do thành kết luận vượng / suy là quy ước của app.
- ✅ (bổ sung) Dụng thần theo chủ đề đã đối chiếu Tăng San Bốc Dịch và Bốc Phệ Chính Tông (khớp); có ô chọn Dụng thần bằng tay.
- Mai Hoa theo chữ Quốc ngữ là cách thích ứng hiện đại, app ghi rõ điều này. Chữ Hán đếm nét theo Unihan kTotalStrokes (bản phồn thể), không theo cách tính bộ thủ Khang Hy.
- Rung không chạy trên iPhone (Safari không hỗ trợ `navigator.vibrate`).

## Việc tiếp theo (ghi 26/09/2026)
| # | Việc | Trạng thái |
|---|---|---|
| 1 | Lục Hào: lục hợp (hào hợp nhật / nguyệt, động hợp, hóa hợp; hợp khởi, hợp trú, xung khai) | ✅ |
| 2 | Lục Hào: tam hợp cục (động hào hợp thành cục, cục sinh / khắc Dụng thần) | ✅ |
| 3 | Lục Hào: tam hình, tự hình | ✅ |
| 4 | Lục Hào: tùy quỷ nhập mộ, nhập mộ nhật / động / hóa | ✅ |
| 5 | Lục Hào: phản ngâm, phục ngâm (quẻ và hào) | ✅ |
| 6 | Lục Hào: gợi ý ứng kỳ theo nguyên tắc sách (không vong thì xuất không, phá thì điền thực, động thì hợp / trị, tĩnh thì xung…), ghi rõ chỉ là gợi ý | ✅ |
| 7 | Mọi quy tắc 1–6 kèm nguồn nguyên văn trong `luc-hao-nguon.md`; hiển thị trong bảng Lục Hào và khung Luận Dụng thần | ✅ |
| — | Rung trên iPhone | ❌ không làm được (Safari không hỗ trợ `navigator.vibrate`) |

## Góp ý thêm của người dùng: nghi thức chưa đủ trang trọng (26/09/2026) — ✅ đã làm
- Không gian nghi thức toàn màn hình khi tĩnh tâm và gieo: nền đêm trầm, ánh nến, khói hương, vòng Bát quái xoay chậm, câu hỏi chữ vàng như lời khấn; Esc hoặc ✕ để rời.
- Tĩnh tâm: tiếng chuông xoay (singing bowl), Thái cực thở theo nhịp, gợi ý ba nhịp thở rồi mới bắt đầu (vẫn bỏ qua được).
- Xu: tiền cổ lỗ vuông bằng đồng, mặt chữ 開元通寶 / mặt lưng; tung lên, xoay, rơi có bóng, chạm đất mới kêu và rung.
- Hào hiện dần thành vạch vàng từ dưới lên (hào động màu son); đủ sáu hào: chuông ngân, quẻ sáng lên, "Quẻ đã thành".
- Bước viết câu hỏi trình bày như lá sớ (giấy, trục gỗ, dấu son 問).
- Tôn trọng "giảm chuyển động" của hệ điều hành.
- Menu chính có "Gieo quẻ ▾" xổ ra 5 cách lập quẻ và lịch sử.
