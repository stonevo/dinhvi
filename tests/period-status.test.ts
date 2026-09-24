import { describe, expect, it } from 'vitest';
import { comparePeriods, formatPeriod, periodOf } from '../src/lib/period';
import { domainStatus, unreviewedBefore } from '../src/lib/status';
import { makePositioning } from './fixtures';

describe('period', () => {
  it('quý và tháng', () => {
    expect(periodOf(new Date(2026, 8, 23), 'quarter')).toBe('2026-Q3');
    expect(periodOf(new Date(2026, 0, 1), 'quarter')).toBe('2026-Q1');
    expect(periodOf(new Date(2026, 11, 31), 'quarter')).toBe('2026-Q4');
    expect(periodOf(new Date(2026, 8, 23), 'month')).toBe('2026-09');
  });

  it('so sánh, kể cả khi đổi chu kỳ giữa chừng', () => {
    expect(comparePeriods('2026-Q2', '2026-Q3')).toBeLessThan(0);
    expect(comparePeriods('2025-12', '2026-Q1')).toBeLessThan(0);
    expect(comparePeriods('2026-07', '2026-Q3')).toBe(0);
  });

  it('hiển thị', () => {
    expect(formatPeriod('2026-Q3')).toBe('Quý 3/2026');
    expect(formatPeriod('2026-09')).toBe('Tháng 9/2026');
  });
});

describe('domainStatus', () => {
  const hs = {
    reviewedAt: 'x', actualHexagram: null, actualLine: null,
    selfWasRight: 'yes' as const, whatHappened: '', willNotDoKept: 'na' as const, notes: '',
  };

  it('chưa có gì → cần định vị', () => {
    expect(domainStatus('d1', '2026-Q3', [], [])).toBe('needsPositioning');
  });

  it('kỳ trước chưa nhìn lại không chặn; chỉ được gợi ý', () => {
    const ps = [makePositioning({ period: '2026-Q2' })];
    const drafts = [{ id: 'x', domainId: 'd1', period: '2026-Q3', step: 1, data: {}, updatedAt: '' }];
    expect(domainStatus('d1', '2026-Q3', ps, drafts)).toBe('draft');
    expect(domainStatus('d1', '2026-Q3', ps, [])).toBe('needsPositioning');
    expect(unreviewedBefore('d1', '2026-Q3', ps)?.id).toBe('p1');
  });

  it('kỳ trước đã nhìn lại + có nháp → đang viết dở', () => {
    const ps = [makePositioning({ period: '2026-Q2', hindsight: hs })];
    const drafts = [{ id: 'x', domainId: 'd1', period: '2026-Q3', step: 1, data: {}, updatedAt: '' }];
    expect(domainStatus('d1', '2026-Q3', ps, drafts)).toBe('draft');
  });

  it('đã định vị kỳ này → xong', () => {
    const ps = [makePositioning({ period: '2026-Q2', hindsight: hs }), makePositioning({ id: 'p2', period: '2026-Q3' })];
    expect(domainStatus('d1', '2026-Q3', ps, [])).toBe('done');
  });

  it('lĩnh vực khác không ảnh hưởng', () => {
    const ps = [makePositioning({ domainId: 'd2', period: '2026-Q2' })];
    expect(domainStatus('d1', '2026-Q3', ps, [])).toBe('needsPositioning');
  });
});
