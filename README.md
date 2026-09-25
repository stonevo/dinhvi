# Định Vị

Nhật ký định vị định kỳ theo 64 quẻ × 6 hào của Kinh Dịch. Mỗi tháng hoặc mỗi quý, với từng lĩnh vực đời sống, bạn xác định mình đang ở quẻ nào, hào nào — bằng cách **tự ghép hai quái** (trạng thái bên trong + hoàn cảnh bên ngoài, kèm bằng chứng) hoặc **gieo quẻ** ba đồng xu — rồi đọc lời hào như ghi chép của những người từng đứng ở đúng vị trí ấy. Theo thời gian, app vẽ lại quỹ đạo và đo độ chính xác bằng cách đối chiếu với nhìn lại, kể cả so sánh hai cách có quẻ.

Ngoài luồng định vị còn có mục **Gieo quẻ** riêng: gieo, xem quẻ chính / hào động / quẻ biến, lưu lịch sử — tách khỏi quỹ đạo và thống kê.

Dùng cho mình và cho người khác:

- **Hồ sơ**: mỗi người một bộ lĩnh vực, bản ghi, quỹ đạo, hiệu chỉnh, lần gieo; chọn trên thanh đầu trang, xuất/nhập riêng từng hồ sơ.
- **Bản gửi**: bản tóm tắt gọn cho người được định vị (in, lưu ảnh, chia sẻ dạng chữ).
- **Nhân chứng qua link**: gửi link/QR một câu hỏi, nhận lại mã trả lời — không cần server.
- **Ghi nhanh**: một quẻ, một hào, một dòng giữa hai kỳ; không tính vào hiệu chỉnh.
- **Thư viện 64 quẻ**, **hướng dẫn lần đầu**, và giải thích thuật ngữ (ⓘ) ngay tại chỗ.

## Cơ chế chính

| Cơ chế | Ở đâu |
|---|---|
| Luồng 8 bước: sự thật → có quẻ (tự ghép hoặc gieo) → Tự quái → hào → phép thử đau → người phê bình → nhân chứng → kết luận | `src/flow/` |
| Gieo ba đồng xu (6/7/8/9), hào động, quẻ biến; nguồn ngẫu nhiên `crypto.getRandomValues` | `src/lib/cast.ts` |
| Vòng lặp định vị → nhìn lại → hiệu chỉnh: nhìn lại là tùy chọn, trang chủ gợi ý kỳ nào chưa nhìn lại; mỗi lĩnh vực một bản ghi mỗi kỳ | `src/lib/status.ts`, `src/pages/ReviewPage.tsx` |
| Thống kê hiệu chỉnh, mọi con số kèm n, gồm độ đúng khi tự ghép so với khi gieo | `src/lib/calibration.ts` |

## Chạy

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest: logic, dữ liệu, DB, tiêu chí chấp nhận
npm run build        # typecheck + build PWA vào dist/
npm run preview      # xem bản build
npm run check:data   # kiểm toàn vẹn public/data/*.json
```

Bản build là trang tĩnh (HashRouter, đường dẫn tương đối) — đặt thư mục `dist/` ở bất kỳ đâu. Sau lần tải đầu, app chạy offline.

## Dữ liệu

- **Dữ liệu người dùng**: chỉ trong IndexedDB của trình duyệt (Dexie). Không backend, không tài khoản, không analytics. *Cài đặt → Xuất JSON* để tự sao lưu; *Nhập JSON* để khôi phục (thay toàn bộ, có xác nhận; có test round-trip).
- **Dữ liệu tĩnh** trong `public/data/`, sửa được mà không cần build lại:
  - `trigrams.json` — 8 quái như trạng thái bên trong / hoàn cảnh bên ngoài
  - `lineTiers.json` — dấu hiệu chung của 6 vị trí hào, câu kiểm chứng có/không
  - `hexagrams.json` — 64 quẻ, 384 hào, Dụng cửu / Dụng lục; phiên âm Hán Việt kèm chữ Hán gốc (kinh văn theo [Kanripo KR1a0001](https://github.com/kanripo/KR1a0001))
  - `commentary.json` — Kinh & Truyện: dịch sát lời quẻ/lời hào, Thoán truyện, Đại tượng, Tiểu tượng (chữ Hán trích tự động từ KR1a0001), giảng, và ý của Trình Di ([Y Xuyên Dịch truyện, KR1a0016](https://github.com/kanripo/KR1a0016)) và Chu Hy ([Chu Dịch bản nghĩa, KR1a0031](https://github.com/kanripo/KR1a0031)), kèm tóm tắt bằng lời riêng những chỗ Nguyễn Hiến Lê hiểu khác. Phần tiếng Việt tự dịch từ chữ Hán, không dựa vào bản dịch hiện đại còn bản quyền. Cấu trúc hào (chính, trung, ứng, thừa) tính tự động từ hình quẻ (`src/lib/structure.ts`).
- Schema: `src/types/schema.ts` (zod — nguồn duy nhất cho type TS và validate).
- Hướng dẫn viết/sửa: [docs/huong-dan-viet-du-lieu.md](docs/huong-dan-viet-du-lieu.md). Lời hào gốc cần người duyệt: [docs/can-duyet-loi-hao.md](docs/can-duyet-loi-hao.md). Nguồn tham khảo: [docs/nguon-du-lieu-kinh-dich.md](docs/nguon-du-lieu-kinh-dich.md). Quy trình dịch, đối chiếu và trích nguồn: [docs/quy-trinh-noi-dung.md](docs/quy-trinh-noi-dung.md).

## Cấu trúc

```
src/
  types/schema.ts      schema zod
  lib/                 logic thuần: iching (King Wen, Tự quái, bàng thông), cast (gieo quẻ, đoạn nên đọc),
                       structure (chính/trung/ứng/thừa của hào), calibration,
                       trajectory, status, lint, period, reminder, csv
  flow/                luồng 8 bước: draft.ts (logic thuần), useDraft, steps/, HindsightForm
  db/                  Dexie, sao lưu, lưu bản ghi có kiểm luật
  data/                tải + validate dữ liệu tĩnh, bảng tên chuẩn
  pages/, ui/          giao diện
  sw.ts                service worker: precache offline + nhắc nền
scripts/               skeleton / extract / merge-chunks / check-data cho dữ liệu;
                       import-han / import-commentary / verify-originals đối chiếu với Kanripo
tests/                 Vitest
```

## Nhắc định kỳ

Cài đặt chu kỳ (tháng / quý) và ngày nhắc. Từ ngày nhắc, trang chủ hiện dòng nhắc nếu còn lĩnh vực chưa xong. Nếu bật thông báo, app gửi tối đa một thông báo mỗi kỳ khi được mở; ở trình duyệt hỗ trợ Periodic Background Sync (Chrome, app đã cài) thì nhắc cả khi app đóng. Không email, không server.
