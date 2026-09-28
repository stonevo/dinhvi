# Diễn giải bằng AI (miễn phí)

Sau khi gieo, nếu có câu hỏi và người dùng đã bật tính năng (Cài đặt → **Diễn giải bằng AI**, mặc định tắt), phần **Tóm lược** được thay bằng một đoạn AI viết bám câu hỏi. Thứ tự:

1. **Google Gemini** (gói miễn phí của Gemini API).
2. Gemini hết lượt → **Cloudflare Workers AI** (hạn mức neuron miễn phí mỗi ngày).
3. Cả hai hết → hiện **tóm lược tĩnh** như cũ.

Máy chủ trung gian ([`worker/`](../worker)) ghi vào KV thời điểm mỗi dịch vụ được mở lượt lại, để các yêu cầu sau bỏ qua dịch vụ đó cho tới lúc ấy:
- Gemini hết lượt theo phút → chờ đúng `retryDelay` Gemini báo; hết lượt theo ngày → chờ tới nửa đêm giờ Thái Bình Dương.
- Workers AI hết neuron (mã 4006) → chờ tới 00:00 UTC.

Chỉ tài khoản đã đăng nhập Google (Firebase, mục Đồng bộ) mới gọi được; mỗi người tối đa `DAILY_LIMIT_PER_USER` lần mỗi ngày (mặc định 10). AI chỉ nhận **nội dung đã kiểm của đúng lần gieo đó** (tóm lược quẻ chính, các hào cần đọc theo quy tắc, quẻ biến, đoạn theo lĩnh vực) và được dặn không thêm ý ([`worker/src/logic.ts`](../worker/src/logic.ts), `SYSTEM_PROMPT`). Câu trả lời được lưu kèm lần gieo khi bấm Lưu, xem lại không tốn lượt.

## Thiết lập (một lần)

Cần: tài khoản Google (Gemini), tài khoản Cloudflare (miễn phí, không cần thẻ), Node.js.

1. **Khoá Gemini:** vào https://aistudio.google.com/apikey → *Create API key* (chọn dự án Google Cloud, có thể dùng chính dự án Firebase `dinh-vi-e4f65`). Giữ khoá này, không dán vào code.
2. **Đăng nhập Cloudflare** trong thư mục `worker/`:
   ```bash
   cd worker
   npm install
   npx wrangler login
   ```
3. **Tạo KV** (lưu thời điểm mở lượt và số lần hỏi):
   ```bash
   npx wrangler kv namespace create STATE
   ```
   Chép `id` in ra vào `wrangler.toml` thay `REPLACE_WITH_KV_ID`.
4. **Lưu khoá Gemini làm bí mật** (dán khoá khi được hỏi):
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```
5. **Triển khai:**
   ```bash
   npx wrangler deploy
   ```
   Wrangler in ra địa chỉ dạng `https://dinhvi-ai.<tên>.workers.dev`.
6. Điền địa chỉ đó vào [`src/ai/config.ts`](../src/ai/config.ts) (`AI_ENDPOINT`), commit và push. Mục **Diễn giải bằng AI** sẽ hiện trong Cài đặt.

Tuỳ chỉnh trong `wrangler.toml` (`[vars]`): `GEMINI_MODEL` (mặc định `gemini-2.5-flash` — xem danh sách model và hạn mức gói miễn phí hiện hành trên trang Gemini API), `WORKERS_AI_MODEL`, `DAILY_LIMIT_PER_USER`, `ALLOWED_ORIGINS`.

## Riêng tư

Câu hỏi của người dùng được gửi tới Google (Gemini) hoặc Cloudflare. Với gói miễn phí, Google có thể dùng dữ liệu để cải thiện sản phẩm — trang Cài đặt ghi rõ điều này và tính năng mặc định tắt. Máy chủ trung gian không lưu câu hỏi; KV chỉ giữ số lần hỏi theo mã tài khoản trong ngày và thời điểm mở lượt của hai dịch vụ.
