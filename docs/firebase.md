# Đồng bộ đám mây bằng Firebase

App chạy offline như cũ. Khi đã cấu hình Firebase, trang **Cài đặt** có mục "Đồng bộ đám mây": đăng nhập bằng Google, dữ liệu tự tải lên sau khi có thay đổi, mở trên máy khác thì tải về. Nếu cả hai máy cùng đổi trước khi kịp đồng bộ, app hỏi giữ bản nào.

## Thiết lập (làm một lần, trên console.firebase.google.com)

1. **Tạo dự án** (không cần Google Analytics).
2. **Authentication → Get started → Sign-in method → Google → Enable**, chọn email hỗ trợ, Save.
3. **Authentication → Settings → Authorized domains → Add domain**: `stonevo.github.io` (đã có sẵn `localhost` để chạy thử).
4. **Firestore Database → Create database** → chọn vùng (vd. `asia-southeast1`) → *Production mode*.
5. **Firestore → Rules**: dán nội dung file [`firestore.rules`](../firestore.rules) rồi **Publish**. Luật này chỉ cho mỗi tài khoản đọc/ghi `users/{uid}` của chính mình.
6. **Project settings (bánh răng) → Your apps → Web (`</>`)** → đặt tên, không cần Hosting → copy object `firebaseConfig`.
7. Dán object đó vào [`src/sync/config.ts`](../src/sync/config.ts) thay cho `null`, commit và push. Đây là mã công khai, để trong code được.

## Dữ liệu lưu thế nào

- `users/{uid}/backup/meta` — `{ updatedAt, parts, deviceId }`.
- `users/{uid}/backup/part-0 … part-n` — bản sao lưu đầy đủ (cùng định dạng file JSON ở mục Sao lưu), chia phần vì mỗi tài liệu Firestore tối đa 1 MiB.
- Chủ dự án Firebase xem được dữ liệu trong console. Người dùng khác thì không (do luật ở bước 5).

## Hạn mức miễn phí (gói Spark)

Firestore: 1 GiB, 50.000 lượt đọc / 20.000 lượt ghi mỗi ngày — dùng chung cho mọi người dùng. Mỗi lần tải lên tốn (số phần + 1) lượt ghi; app gom thay đổi, chờ ~20 giây mới tải. Vượt hạn mức thì dịch vụ tạm dừng tới hôm sau, không tính tiền.
