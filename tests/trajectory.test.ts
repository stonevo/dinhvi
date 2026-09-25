import { describe, expect, it } from 'vitest';
import { domainTrajectory, hasTrajectory, hexagramHistory, periodOverview } from '../src/lib/trajectory';
import { canStartPositioning } from '../src/lib/status';
import type { Domain } from '../src/types/schema';
import { makePositioning } from './fixtures';

const hs = (hex: number, line: number) => ({
  reviewedAt: 'x', actualHexagram: hex, actualLine: line,
  selfWasRight: 'partly' as const, whatHappened: '', willNotDoKept: 'yes' as const, notes: '',
});

// Cố ý không theo thứ tự kỳ, và trộn cả kỳ tháng.
const PS = [
  makePositioning({ id: 'c', period: '2026-Q3', finalHexagram: 6, finalLine: 2, willNotDo: 'C', painfulSentence: 'pc' }),
  makePositioning({ id: 'a', period: '2025-Q4', finalHexagram: 4, finalLine: 1, hindsight: hs(4, 2) }),
  makePositioning({ id: 'b', period: '2026-02', finalHexagram: 5, finalLine: 3, hindsight: hs(5, 2) }),
  makePositioning({ id: 'x', domainId: 'd2', period: '2026-Q3', finalHexagram: 30, finalLine: 5, confidence: 4 }),
];

describe('quỹ đạo', () => {
  it('sắp theo kỳ, chồng điểm nhìn lại, mang willNotDo và câu đau', () => {
    const t = domainTrajectory(PS, 'd1');
    expect(t.map((p) => p.period)).toEqual(['2025-Q4', '2026-02', '2026-Q3']);
    expect(t.map((p) => [p.hexagram, p.line])).toEqual([[4, 1], [5, 3], [6, 2]]);
    expect(t[0].hindsight).toEqual({ hexagram: 4, line: 2 });
    expect(t[2].hindsight).toBeNull();
    expect(t[2]).toMatchObject({ willNotDo: 'C', painfulSentence: 'pc' });
  });

  it('chỉ có quỹ đạo khi một lĩnh vực có ≥ 2 kỳ', () => {
    expect(hasTrajectory([PS[0], PS[3]])).toBe(false);
    expect(hasTrajectory(PS)).toBe(true);
  });

  it('bảng tổng quan kỳ hiện tại, bỏ lĩnh vực đã cất', () => {
    const domains: Domain[] = [
      { id: 'd1', profileId: 'me', name: 'Công việc', createdAt: '1', archived: false },
      { id: 'd2', profileId: 'me', name: 'Gia đình', createdAt: '2', archived: false },
      { id: 'd3', profileId: 'me', name: 'Sức khỏe', createdAt: '3', archived: false },
      { id: 'd4', profileId: 'me', name: 'Cũ', createdAt: '4', archived: true },
    ];
    const rows = periodOverview(domains, PS, '2026-Q3', (h) => (h === 30 ? 'peak' : null));
    expect(rows.map((r) => r.domain.id)).toEqual(['d1', 'd2', 'd3']);
    expect(rows[1].positioning).toEqual({ hexagram: 30, line: 5, stage: 'peak', confidence: 4 });
    expect(rows[2].positioning).toBeNull();
  });

  it('lịch sử quẻ đối chiếu Tự quái', () => {
    const extra = [...PS, makePositioning({ id: 'd', period: '2026-Q4', finalHexagram: 6 }),
      makePositioning({ id: 'e', period: '2027-Q1', finalHexagram: 20 }),
      makePositioning({ id: 'f', period: '2027-Q2', finalHexagram: 3 })];
    const h = hexagramHistory(extra, 'd1');
    expect(h.hexagrams).toEqual([4, 5, 6, 6, 20, 3]);
    expect(h.steps.map((s) => s.kind)).toEqual(['next', 'next', 'same', 'forwardJump', 'backward']);
    expect(h.followsSequence).toEqual({ k: 3, n: 5 });
  });
});

describe('cổng tạo bản ghi mới', () => {
  it('không chặn khi kỳ trước chưa nhìn lại', () => {
    expect(canStartPositioning('d1', '2026-Q4', PS)).toBe(true); // 'c' (Q3) chưa có hindsight
  });
  it('chặn khi kỳ này đã có bản ghi', () => {
    const reviewedAll = PS.map((p) => ({ ...p, hindsight: hs(1, 1) }));
    expect(canStartPositioning('d1', '2026-Q3', reviewedAll)).toBe(false);
  });
  it('cho phép khi mọi kỳ trước đã nhìn lại', () => {
    const reviewedAll = PS.map((p) => ({ ...p, hindsight: hs(1, 1) }));
    expect(canStartPositioning('d1', '2026-Q4', reviewedAll)).toBe(true);
  });
});
