/**
 * Địa chỉ máy chủ trung gian "Diễn giải bằng AI" (Cloudflare Worker trong thư mục worker/,
 * xem docs/ai.md), vd. 'https://dinhvi-ai.<tên>.workers.dev'. Để null thì app không có
 * tính năng này và luôn dùng tóm lược tĩnh.
 */
// Đã triển khai ở https://dinhvi-ai.vochitruong.workers.dev — tạm tắt tới khi cấu hình Cloudflare xong.
export const AI_ENDPOINT: string | null = null;
