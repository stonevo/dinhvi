// Chủ đề giao diện: tùy chọn riêng từng máy, lưu localStorage (không nằm trong
// sao lưu). index.html áp chủ đề trước khi vẽ để không nháy màu.

export type Theme = 'light' | 'dark' | 'auto';
export const THEMES: Theme[] = ['light', 'dark', 'auto'];
const KEY = 'dinhvi.theme';

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'auto' ? v : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#faf9f5');
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Trình duyệt chặn lưu trữ — vẫn áp cho phiên này.
  }
  applyTheme(theme);
}
