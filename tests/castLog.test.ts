import { describe, expect, it } from 'vitest';
import { addDays, dueChecks, hitRate, outcomeStats, vnDateString } from '../src/lib/castLog';
import type { CastRecord } from '../src/types/schema';

const cast = (over: Partial<CastRecord>): CastRecord => ({
  id: 'c',
  profileId: 'me',
  createdAt: '2026-09-01T00:00:00.000Z',
  question: 'q',
  lines: [7, 7, 7, 7, 7, 7],
  primary: 1,
  moving: [],
  transformed: null,
  notes: '',
  method: 'coins',
  ...over,
});

describe('nhật ký gieo', () => {
  it('ngày theo giờ Việt Nam: 17h UTC đã là hôm sau ở VN', () => {
    expect(vnDateString(new Date('2026-09-26T16:59:00Z'))).toBe('2026-09-26');
    expect(vnDateString(new Date('2026-09-26T17:00:00Z'))).toBe('2026-09-27');
    expect(addDays('2026-12-25', 10)).toBe('2027-01-04');
  });

  it('đến hạn: đã tới ngày và chưa đánh dấu kết quả, cũ nhất trước', () => {
    const list = [
      cast({ id: 'a', checkOn: '2026-09-20' }),
      cast({ id: 'b', checkOn: '2026-09-10' }),
      cast({ id: 'c', checkOn: '2026-10-01' }),
      cast({ id: 'd', checkOn: '2026-09-01', outcome: { verdict: 'yes', note: '', at: '2026-09-02T00:00:00.000Z' } }),
      cast({ id: 'e' }),
    ];
    expect(dueChecks(list, '2026-09-26').map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('thống kê theo phương pháp và ngữ cảnh; một phần tính nửa', () => {
    const o = (verdict: 'yes' | 'partial' | 'no') => ({ verdict, note: '', at: '2026-09-02T00:00:00.000Z' });
    const s = outcomeStats([
      cast({ method: 'coins', context: 'work', outcome: o('yes') }),
      cast({ method: 'coins', context: 'work', outcome: o('partial') }),
      cast({ method: 'meihua-time', context: 'money', outcome: o('no') }),
      cast({ method: 'meihua-time' }),
    ]);
    expect(s.total).toEqual({ n: 3, yes: 1, partial: 1, no: 1 });
    expect(hitRate(s.byMethod.get('coins')!)).toBe(0.75);
    expect(hitRate(s.byContext.get('money')!)).toBe(0);
    expect(hitRate({ n: 0, yes: 0, partial: 0, no: 0 })).toBeNull();
  });
});
