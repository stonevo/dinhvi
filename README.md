# Định Vị

Nhật ký tự định vị định kỳ theo 64 quẻ × 6 hào của Kinh Dịch. **Không phải app bói**: không gieo quẻ, không sinh số ngẫu nhiên, không gợi ý quẻ. Mỗi tháng hoặc mỗi quý, với từng lĩnh vực đời sống, bạn tự xác định mình đang ở quẻ nào, hào nào — rồi đọc lời hào như ghi chép của những người từng đứng ở đúng vị trí ấy. Theo thời gian, app vẽ lại quỹ đạo và đo độ chính xác của việc tự định vị bằng cách đối chiếu với nhìn lại.

Cách đọc theo tinh thần Trình Di, Vương Phu Chi: Kinh Dịch là kho 384 dạng tình huống nén từ kinh nghiệm quá khứ, không phải kênh nhận tin từ tương lai.

## Nguyên tắc (và nơi chúng được kiểm)

| Nguyên tắc | Cơ chế |
|---|---|
| App không chọn quẻ thay người dùng | Quẻ chỉ suy ra từ hai quái người dùng chọn kèm bằng chứng (`src/flow/draft.ts`); không có ô sửa quẻ; điểm khớp ở bước 4 chỉ là số đếm; bước 6 không điền sẵn |
| Không nói “nên / không nên”, không tiên tri | Lint từ cấm quét cả 3 file dữ liệu, chuỗi giao diện `vi.ts`, và mọi chuỗi viết cứng trong `src/` (`tests/lint.test.ts`, `tests/ui-voice.test.ts`) |
| Chống 3 lỗi: tự đặt cao, chọn quẻ đẹp, định vị một mình | Cảnh báo cố định ở bước 4; phép thử đau (5); người phê bình (6); nhân chứng (7); thống kê hiệu chỉnh đo cả ba |
| Vòng lặp định vị → nhìn lại → hiệu chỉnh | Không lưu được kỳ mới khi kỳ trước chưa nhìn lại — kiểm ở UI và ở tầng DB (`src/db/positionings.ts`) |
| Không ngẫu nhiên | `tests/no-randomness.test.ts` cấm `Math.random`, `getRandomValues`, `randomUUID` trong `src/` |

## Chạy

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest: logic, dữ liệu, lint, DB, tiêu chí chấp nhận
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
  - `hexagrams.json` — 64 quẻ, 384 hào
- Schema: `src/types/schema.ts` (zod — nguồn duy nhất cho type TS và validate).
- Hướng dẫn viết/sửa: [docs/huong-dan-viet-du-lieu.md](docs/huong-dan-viet-du-lieu.md). Lời hào gốc cần người duyệt: [docs/can-duyet-loi-hao.md](docs/can-duyet-loi-hao.md). Nguồn tham khảo: [docs/nguon-du-lieu-kinh-dich.md](docs/nguon-du-lieu-kinh-dich.md).

## Cấu trúc

```
src/
  types/schema.ts      schema zod
  lib/                 logic thuần: iching (King Wen, Tự quái, bàng thông), calibration,
                       trajectory, status, lint, period, reminder, csv
  flow/                luồng 8 bước: draft.ts (logic thuần), useDraft, steps/, HindsightForm
  db/                  Dexie, sao lưu, lưu bản ghi có kiểm luật
  data/                tải + validate dữ liệu tĩnh, bảng tên chuẩn
  pages/, ui/          giao diện
  sw.ts                service worker: precache offline + nhắc nền
scripts/               skeleton / extract / merge-chunks / check-data cho dữ liệu
tests/                 Vitest
```

## Nhắc định kỳ

Cài đặt chu kỳ (tháng / quý) và ngày nhắc. Từ ngày nhắc, trang chủ hiện dòng nhắc nếu còn lĩnh vực chưa xong. Nếu bật thông báo, app gửi tối đa một thông báo mỗi kỳ khi được mở; ở trình duyệt hỗ trợ Periodic Background Sync (Chrome, app đã cài) thì nhắc cả khi app đóng. Không email, không server.
