# Lời hào gốc cần người duyệt

Trường `original` (phiên âm Hán Việt) ban đầu được viết từ trí nhớ kinh văn. Ngày 24/09/2026 toàn bộ 64 lời quẻ và 384 lời hào đã được **đối chiếu tự động với kinh văn chữ Hán Kanripo KR1a0001**. Chi tiết cách làm và kết quả ở [doi-chieu-kanripo.md](doi-chieu-kanripo.md).

Tóm tắt:

- Không còn đoạn nào thừa hay thiếu chữ so với Kanripo. Mọi âm tiết đều ứng với một cách đọc của chữ Hán tương ứng.
- Danh sách nghi vấn dài trước đây (khoảng 70 chỗ) đã được giải quyết: hầu hết là âm Hán Việt chuẩn mà người viết không chắc.
- **Còn lại cho người duyệt:**
  1. 9 chỗ dị âm/dị bản ghi trong bảng của [doi-chieu-kanripo.md](doi-chieu-kanripo.md#kết-quả), chủ yếu là chọn giữa hai cách đọc của cùng một chữ.
  2. Bảng âm bổ sung `scripts/hanviet-extra.ts` (340 chữ), do máy lập và chưa có người duyệt.
  3. Ngắt câu. Script không kiểm được, ví dụ 1.3 “tịch dịch nhược, lệ” hay “tịch dịch nhược lệ”; 30.4.

Sửa trực tiếp trong `public/data/hexagrams.json`, rồi chạy `npm run check:data` và script đối chiếu.

## Đã sửa

| Quẻ.hào | Trước | Sau | Lý do | Khi nào |
|---|---|---|---|---|
| 37.5 | Vương giả hữu gia | Vương cách hữu gia | 假 ở đây đọc như 格 (đến) | giai đoạn 7 |
| 52.3 | liệt kỳ di | liệt kỳ dần | 夤 đọc “dần”; “di” nhầm với 夷 | giai đoạn 7 |
| 57.1 | Tấn thoái | Tiến thoái | 進: âm thông dụng, khớp 20.3 | giai đoạn 7 |
| 10.3 | Miễu năng thị | Diểu năng thị | thống nhất với 54.2 (cùng chữ 眇) | giai đoạn 7 |
| 4 (lời quẻ) | đồng mông cầu ngã | đồng mông lai cầu ngã | thiếu chữ 來 | đối chiếu Kanripo |
| 9.3 | Dư thoát bức | Dư thoát phúc | 輻 đọc “phúc” | đối chiếu Kanripo |

## Quyết định nội dung cần xem

- `stageInCycle` là cách đọc của người viết. Ví dụ: Càn/Khôn = `rising`, Truân/Mông = `beginning`, Nhu = `transitional`, Tụng = `turning`, 25/27 = `transitional`.
- Chữ cát/hung/lận **được giữ trong `original` và phần trích lời quẻ** vì là kinh văn; phần diễn giải hiện đại không dùng.
- Dụng cửu (Càn) và Dụng lục (Khôn) đã có ở trường `allMoving`; phần diễn giải hiện đại do máy viết, chưa có người duyệt.
