import { t } from '../i18n';
import { effectiveTheme, setTheme, useTheme } from '../lib/theme';

/** Nút chuyển nhanh sáng ↔ tối. "Theo hệ thống" chọn ở trang Cài đặt. */
export function ThemeToggle() {
  const current = effectiveTheme(useTheme());
  const next = current === 'dark' ? 'light' : 'dark';
  const label = t(next === 'dark' ? 'theme.toDark' : 'theme.toLight');
  return (
    <button type="button" className="theme-toggle" onClick={() => setTheme(next)} aria-label={label} title={label}>
      <span aria-hidden>{current === 'dark' ? '☀' : '☾'}</span>
    </button>
  );
}
