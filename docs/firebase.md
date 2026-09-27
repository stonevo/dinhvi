# Đồng bộ đám mây bằng Firebase

App chạy offline như cũ. Trang **Cài đặt** có mục "Đồng bộ đám mây": đăng nhập bằng Google, dữ liệu tự tải lên khoảng 20 giây sau khi có thay đổi; mở trên máy khác (hoặc quay lại app) thì kiểm và tải bản mới về. Máy đang dùng đồng bộ có biểu tượng trên thanh menu: ☁ đã đồng bộ, ↻ đang đồng bộ, **!** cần xem lại (bấm để mở Cài đặt).

Dự án đang dùng: `dinh-vi-e4f65` (cấu hình ở [`src/sync/config.ts`](../src/sync/config.ts)).

## Thiết lập (làm một lần, trên console.firebase.google.com)

1. **Tạo dự án** (không cần Google Analytics).
2. **Authentication → Sign-in method → Google → Enable**, chọn email hỗ trợ, Save.
3. **Authentication → Settings → Authorized domains → Add domain**: `stonevo.github.io` (`localhost` có sẵn để chạy thử).
4. **Firestore** (mở thẳng `https://console.firebase.google.com/project/<id>/firestore`) → **Create database**, bản **Standard**, vùng vd. `asia-southeast1`, *production mode*. Database phải tên `(default)`.
5. **Firestore → Rules**: dán nội dung [`firestore.rules`](../firestore.rules) rồi **Publish** (chờ khoảng một phút mới áp dụng). Luật này chỉ cho mỗi tài khoản đọc/ghi `users/{uid}` của chính mình.
6. **Project settings → Your apps → Web (`</>`)** → copy `firebaseConfig` vào `src/sync/config.ts` (mã công khai, để trong code được).

Lỗi hay gặp: `unauthorized-domain` (thiếu bước 3), `operation-not-allowed` (thiếu bước 2), `Missing or insufficient permissions` (bước 4–5: luật chưa đúng/chưa Publish, hoặc database không phải `(default)`).

## Dữ liệu lưu thế nào

- `users/{uid}/backup/meta` — `{ updatedAt, parts, deviceId, enc? }`.
- `users/{uid}/backup/part-0 … part-n` — bản sao lưu đầy đủ (cùng định dạng file JSON ở mục Sao lưu), chia phần vì mỗi tài liệu Firestore tối đa 1 MiB. Nếu bật mã hoá thì là chuỗi đã mã hoá.
- Trên máy (IndexedDB `dinhvi-sync`): bản chung của lần đồng bộ trước (để gộp) và khoá mã hoá. `localStorage` `dinhvi.sync`: mốc đồng bộ và cờ "có thay đổi chưa tải lên".

## Hai máy cùng sửa

App gộp ba chiều theo từng bản ghi, so với bản chung lần đồng bộ trước ([`src/sync/logic.ts`](../src/sync/logic.ts)):
- mỗi bên thêm / sửa / xoá bản ghi khác nhau → giữ đủ cả hai phía;
- hai bên cùng sửa một bản ghi → giữ bản có mốc sửa muộn hơn; một bên xoá, bên kia sửa → giữ bản sửa;
- cài đặt: máy này đổi thì giữ máy này, không thì lấy bản trên mây.

Máy đăng nhập lần đầu mà đã có dữ liệu riêng: app hỏi — **Gộp cả hai**, dùng bản trên mây, hoặc dùng bản trên máy này.

## Mã hoá (tuỳ chọn)

Người dùng đặt mật khẩu riêng (≥ 8 ký tự) → khoá AES-GCM 256 bit suy bằng PBKDF2-SHA-256 (310.000 vòng, muối ngẫu nhiên) ([`src/sync/crypto.ts`](../src/sync/crypto.ts)). Dữ liệu mã hoá trên máy trước khi gửi; trên Firestore chỉ còn chuỗi mã hoá, chủ dự án cũng không đọc được. Meta lưu muối và một chuỗi mẫu đã mã hoá để kiểm mật khẩu. Máy khác nhập mật khẩu một lần; khoá lưu trên máy dạng không xuất được. **Quên mật khẩu thì không mở được bản trên mây** — có nút thay bản trên mây bằng dữ liệu máy đang dùng.

Không mã hoá thì chủ dự án Firebase xem được dữ liệu trong console; người dùng khác thì không (do luật Firestore).

## Tải trang

Gói Firebase (~460 kB) không nằm trong danh sách service worker lưu sẵn; chỉ tải khi mở mục Đồng bộ, hoặc khi máy đó đã từng đăng nhập. Không có mạng thì mục Đồng bộ báo chưa kết nối, phần còn lại của app vẫn chạy.

## Hạn mức miễn phí (gói Spark)

Firestore: 1 GiB, 50.000 lượt đọc / 20.000 lượt ghi mỗi ngày — dùng chung cho mọi người dùng. Mỗi lần tải lên tốn (số phần + 1) lượt ghi. Vượt hạn mức thì tạm dừng tới hôm sau, không tính tiền.
