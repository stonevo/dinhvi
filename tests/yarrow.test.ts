import { describe, expect, it } from 'vitest';
import { YARROW_TOTAL, lineFromChanges, yarrowChange } from '../src/lib/yarrow';

/** Phân bố chính xác của giá trị hào khi mỗi cách chia bó đều như nhau. */
function exactDistribution(): Record<number, number> {
  let states = new Map<number, number>([[YARROW_TOTAL, 1]]);
  for (let k = 0; k < 3; k++) {
    const next = new Map<number, number>();
    for (const [total, p] of states) {
      const ways = total - 2;
      for (let left = 1; left <= total - 2; left++) {
        const c = yarrowChange(total, () => left);
        next.set(c.after, (next.get(c.after) ?? 0) + p / ways);
      }
    }
    states = next;
  }
  const out: Record<number, number> = {};
  for (const [total, p] of states) out[total / 4] = p;
  return out;
}

describe('cỏ thi', () => {
  it('biến đầu rút 5 hoặc 9, biến sau rút 4 hoặc 8; hào ra 6..9', () => {
    for (let left = 1; left <= 47; left++) {
      const a = yarrowChange(49, () => left);
      expect([5, 9]).toContain(a.removed);
      for (let l2 = 1; l2 <= a.after - 2; l2++) {
        const b = yarrowChange(a.after, () => l2);
        expect([4, 8]).toContain(b.removed);
        const c = yarrowChange(b.after, () => 1);
        expect([4, 8]).toContain(c.removed);
        expect([6, 7, 8, 9]).toContain(lineFromChanges([a, b, c]));
      }
    }
  });

  it('phân bố gần 1/16, 5/16, 7/16, 3/16 (khác ba đồng xu 1/8, 3/8, 3/8, 1/8)', () => {
    const d = exactDistribution();
    expect(d[6]).toBeCloseTo(1 / 16, 1);
    expect(d[7]).toBeCloseTo(5 / 16, 1);
    expect(d[8]).toBeCloseTo(7 / 16, 1);
    expect(d[9]).toBeCloseTo(3 / 16, 1);
    expect(d[6] + d[7] + d[8] + d[9]).toBeCloseTo(1, 10);
  });

  it('từ chối cách chia không hợp lệ', () => {
    expect(() => yarrowChange(49, () => 0)).toThrow();
    expect(() => yarrowChange(49, () => 48)).toThrow();
  });
});
