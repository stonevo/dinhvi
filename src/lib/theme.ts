import { useSyncExternalStore } from 'react';

// Chủ đề giao diện: tùy chọn riêng từng máy, lưu localStorage (không nằm trong
// sao lưu). index.html áp chủ đề trước khi vẽ để không nháy màu.

export type Theme = 'light' | 'dark' | 'auto';
export const THEMES: Theme[] = ['light', 'dark', 'auto'];
const KEY = 'dinhvi.theme';
const EVENT = 'dinhvi-theme';

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
  window.dispatchEvent(new Event(EVENT));
}

/** Giao diện đang hiển thị thực tế (auto → theo hệ thống). */
export function effectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'auto') return theme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  mq?.addEventListener('change', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
    mq?.removeEventListener('change', cb);
  };
}

/** Chủ đề đã chọn, đồng bộ giữa nút trên thanh đầu trang và trang Cài đặt. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => 'light');
}
