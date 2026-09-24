import { describe, expect, it } from 'vitest';
import { cryptoBit, readCast, tossCoins, type BitSource, type LineValue } from '../src/lib/cast';
import { applyPatch, derivedHexagram, finalizeDraft, stepComplete, type DraftData } from '../src/flow/draft';

/** Nguồn bit dựng sẵn để kiểm thử. */
const bits = (...seq: (0 | 1)[]): BitSource => {
  let i = 0;
  return () => seq[i++ % seq.length];
};

describe('tung ba đồng xu', () => {
  it.each([
    [[0, 0, 0], 6],
    [[1, 0, 0], 7],
    [[1, 1, 0], 8],
    [[1, 1, 1], 9],
  ] as const)('%j → %i', (seq, value) => {
    expect(tossCoins(bits(...seq)).value).toBe(value);
  });

  it('nguồn mật mã cho giá trị hợp lệ và phủ đủ 6..9', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 400; i++) seen.add(tossCoins(cryptoBit).value);
    expect([...seen].sort()).toEqual([6, 7, 8, 9]);
  });
});

describe('đọc quẻ gieo', () => {
  it('không hào động: chỉ có quẻ chính', () => {
    expect(readCast([7, 7, 7, 7, 7, 7])).toEqual({ primary: 1, moving: [], transformed: null });
    expect(readCast([8, 8, 8, 8, 8, 8])).toEqual({ primary: 2, moving: [], transformed: null });
  });

  it('hào động đổi âm dương ở quẻ biến', () => {
    // Càn, hào 1 lão dương → biến thành Cấu (44).
    expect(readCast([9, 7, 7, 7, 7, 7])).toEqual({ primary: 1, moving: [1], transformed: 44 });
    // Khôn, cả sáu hào lão âm → biến thành Càn.
    expect(readCast([6, 6, 6, 6, 6, 6])).toEqual({ primary: 2, moving: [1, 2, 3, 4, 5, 6], transformed: 1 });
    // Truân (Chấn dưới, Khảm trên): 9 8 8 8 7 6 → hào 1 và 6 động.
    const r = readCast([9, 8, 8, 8, 7, 6]);
    expect(r.primary).toBe(3);
    expect(r.moving).toEqual([1, 6]);
  });

  it('từ chối khi chưa đủ 6 hào', () => {
    expect(() => readCast([7, 7, 7] as LineValue[])).toThrow(RangeError);
  });
});

describe('bước 2 bằng cách gieo', () => {
  const rest: Partial<DraftData>[] = [
    { sequenceCheck: 'fits' },
    { tier: 'earth', tierEvidence: 'x' },
    { line: 1 },
    { painType: 'none' },
    { criticHexagram: 4, criticLine: 1, criticComparison: 'x' },
    { witnessSkipped: true },
    { confidence: 3, willNotDo: 'không làm gì đó' },
  ];

  it('đủ 6 hào thì có quẻ, không cần bằng chứng', () => {
    let d = applyPatch({ facts: ['a', 'b', 'c'] }, { method: 'cast' });
    d = applyPatch(d, { castLines: [9, 8, 8, 8, 7] });
    expect(stepComplete(2, d)).toBe(false);
    expect(derivedHexagram(d)).toBeNull();
    d = applyPatch(d, { castLines: [9, 8, 8, 8, 7, 6] });
    expect(stepComplete(2, d)).toBe(true);
    expect(derivedHexagram(d)).toBe(3);

    const p = finalizeDraft(rest.reduce(applyPatch, d), { id: 'x', domainId: 'd', period: '2026-Q3', createdAt: 'x' });
    expect(p).toMatchObject({ method: 'cast', castLines: [9, 8, 8, 8, 7, 6], hexagram: 3, innerEvidence: '' });
  });

  it('đổi cách chọn quẻ thì bỏ kết quả của cách cũ', () => {
    let d = applyPatch({}, { innerTrigram: 'kan', innerEvidence: 'e', outerTrigram: 'gen', outerEvidence: 'e' });
    expect(derivedHexagram(d)).toBe(4);
    d = applyPatch(d, { method: 'cast' });
    expect(derivedHexagram(d)).toBeNull();
    expect(d.innerEvidence).toBeUndefined();
    d = applyPatch(d, { castLines: [7, 7, 7, 7, 7, 7] });
    d = applyPatch(d, { method: 'self' });
    expect(d.castLines).toBeUndefined();
    expect(derivedHexagram(d)).toBeNull();
  });

  it('bản ghi tự ghép có method = self', () => {
    const d = [
      { facts: ['a', 'b', 'c'] },
      { innerTrigram: 'kan', innerEvidence: 'e', outerTrigram: 'gen', outerEvidence: 'e' } as Partial<DraftData>,
      ...rest,
    ].reduce<DraftData>(applyPatch, {});
    const p = finalizeDraft(d, { id: 'x', domainId: 'd', period: '2026-Q3', createdAt: 'x' });
    expect(p.method).toBe('self');
    expect(p.castLines).toBeUndefined();
  });
});
