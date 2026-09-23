# Lời hào gốc cần người duyệt

Trường `original` (phiên âm Hán Việt) được viết từ trí nhớ kinh văn, **chưa đối chiếu nguồn**. Danh sách dưới đây là chỗ người viết tự báo không chắc — thường là âm đọc của một chữ hoặc dị bản. Đề xuất đối chiếu với Ngô Tất Tố (*Kinh Dịch trọn bộ*, công cộng) và kinh văn Kanripo KR1a0001 (xem `nguon-du-lieu-kinh-dich.md`).

Sửa trực tiếp trong `public/data/hexagrams.json`, rồi chạy `npm run check:data`.

## Quẻ mẫu (1–8)

| Quẻ.hào | Đang ghi | Cần xem |
|---|---|---|
| 1.3 | tịch dịch nhược, lệ, vô cữu | ngắt câu “tịch dịch nhược lệ” |
| 2.1 | Lý sương, kiên băng chí | |
| 2.3 | Hàm chương khả trinh… | |
| 3.2 | truân như chiên như, thừa mã ban như | 邅 chiên, 班 ban |
| 3.3 | Tức lộc vô ngu… | |
| 4.1 | dụng thoát trất cốc | 桎梏 |
| 4.3 | Vật dụng thủ nữ, kiến kim phu… | |
| 5 (lời quẻ) | quang hanh | 光亨 |
| 6.2 | bô / vô sảnh | 逋, 眚 sảnh/sính |
| 6.6 | tích chi bàn đái, chung triêu tam sỉ chi | 錫, 鞶, 褫 sỉ/trĩ |
| 7.1 | phủ tang hung | 否臧 phủ/bĩ |
| 7.3, 7.5 | dư thi | 輿尸 |
| 8.1 | hữu phu doanh phẫu | 缶 phẫu/phữu |
| 8 (lời quẻ) | nguyên phệ nguyên vĩnh trinh | 原 / 元 |

## Quẻ 9–64 (hào draft)

| Quẻ.hào | Cần xem |
|---|---|
| 9.3 | 輹/輻 — thoát bức / phúc |
| 9.6 | 幾/既 — nguyệt cơ vọng |
| 10.3, 54.2 | 眇 — miễu / diểu |
| 12.3 | Bao tu (cả lời hào) |
| 13.5 | hào đào / hào khiêu |
| 14.4 | 彭 — bành |
| 16.4 | bằng hạp trâm |
| 21.4 | 胏 — tỉ / chỉ |
| 22.4 | 皤 — bà / ba |
| 24.6 | quốc quân hung |
| 26.3 | 曰 — nhật / viết |
| 26.4 | 牿 — cốc |
| 27.1 | 朵 — đóa |
| 29.4 | quỹ, phẫu, nạp ước tự dũ |
| 30.4, 30.5 | ngắt câu; 沱 đà |
| 31.5 | 脢 — mỗi / môi |
| 34.5 | 易 — dị |
| 35 (lời quẻ) | 錫 — tích / tứ |
| 36.2 | 拯 — chửng / chẩng |
| 38.6 | tái quỷ nhất xa; hôn cấu |
| 41.1 | 已 — dĩ / tị |
| 43.5 | 莧 — hiện / nghiễn |
| 44.5 | 杞 — kỷ |
| 47.5, 47.6 | 劓刖 / 臲卼 |
| 48.3, 48.4, 48.6 | 渫 tiết, 甃 trứu, 收 thu/thâu |
| 50.4 | 渥 / 剭 — ốc |
| 51.1 (và lời quẻ) | 虩虩 hích hích, 匕鬯 chủy sưởng |
| 52.2 | 腓 — phì |
| 53.6 | 陸 lục / 逵 quỳ (Trình Di, Chu Hy đọc 逵) |
| 54.3, 54.4 | dĩ tu; khiên kỳ |
| 55.1, 55.3, 55.6 | phối chủ/phi; 肱 quăng/quang; 闃 khuých |
| 57.2 | phân nhược |
| 61.2 | 靡 — mĩ |
| 62.5 | 弋 — dặc |
| 63.2, 63.4 | thược tế; nhu hữu y như |
| 64 (lời quẻ) | ngật tế |

## Quyết định nội dung cần xem

- `stageInCycle` là cách đọc của người viết, ví dụ Càn/Khôn = `rising`, Truân/Mông = `beginning`, Nhu = `transitional`, Tụng = `turning`, 25/27 = `transitional`.
- Chữ cát/hung/lận **được giữ trong `original` và phần trích lời quẻ** vì là kinh văn; phần diễn giải hiện đại không dùng.
- Dụng cửu (Càn) và Dụng lục (Khôn) chưa có chỗ trong schema (6 hào/quẻ), nên chưa đưa vào.
