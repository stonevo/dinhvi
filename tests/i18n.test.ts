import { describe, expect, it } from 'vitest';
import { t } from '../src/i18n';

describe('i18n', () => {
  it('thay biến', () => {
    expect(t('home.period', { period: 'Quý 3/2026' })).toBe('Kỳ hiện tại: Quý 3/2026');
  });
  it('giữ nguyên biến thiếu', () => {
    expect(t('home.period')).toBe('Kỳ hiện tại: {period}');
  });
});
