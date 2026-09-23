import { describe, expect, it } from 'vitest';
import type { Hindsight, Positioning, Witness } from '../src/types/schema';
import { calibrationReport, MIN_HINDSIGHT_RECORDS, ratio } from '../src/lib/calibration';
import { makePositioning } from './fixtures';

type Row = {
  conf: 1 | 2 | 3 | 4 | 5;
  right?: Hindsight['selfWasRight'];
  final: number;
  actual?: number | null;
  actualHex?: number | null;
  changed?: boolean;
  finalHex?: number;
  critic?: number | null;
  pain: Positioning['painType'];
  witness?: Partial<Witness> | null;
  kept?: Hindsight['willNotDoKept'];
  domain?: string;
  noHindsight?: boolean;
};

function build(rows: Row[]): Positioning[] {
  return rows.map((r, i) =>
    makePositioning({
      id: `r${i + 1}`,
      domainId: r.domain ?? 'd1',
      period: `20${20 + Math.floor(i / 4)}-Q${(i % 4) + 1}`,
      confidence: r.conf,
      finalLine: r.final,
      finalHexagram: r.finalHex ?? 4,
      changedAfterTests: r.changed ?? false,
      criticHexagram: r.critic ?? null,
      painType: r.pain,
      witness: r.witness
        ? { who: 'x', theirStage: 'unknown', theirLineGuess: null, note: '', askedAt: 'x', ...r.witness }
        : null,
      hindsight: r.noHindsight
        ? null
        : {
            reviewedAt: 'x',
            actualHexagram: r.actualHex === undefined ? 4 : r.actualHex,
            actualLine: r.actual === undefined ? null : r.actual,
            selfWasRight: r.right!,
            whatHappened: '',
            willNotDoKept: r.kept!,
            notes: '',
          },
    }),
  );
}

// Bộ dữ liệu giả, giá trị kỳ vọng tính tay (xem chú thích từng dòng).
const DATA = build([
  /* R1 */ { conf: 5, right: 'yes', final: 5, actual: 3, actualHex: 4, pain: 'specific', witness: { theirLineGuess: 3 }, kept: 'yes' },
  /* R2 */ { conf: 5, right: 'no', final: 5, actual: 4, actualHex: 4, changed: true, finalHex: 3, critic: 3, pain: 'vague', witness: { theirStage: 'rising' }, kept: 'no' },
  /* R3 */ { conf: 5, right: 'yes', final: 2, actual: 2, actualHex: 3, pain: 'specific', witness: { theirLineGuess: 4 }, kept: 'yes' },
  /* R4 */ { conf: 4, right: 'partly', final: 3, actual: 2, actualHex: 3, changed: true, finalHex: 5, critic: 3, pain: 'none', kept: 'partly' },
  /* R5 */ { conf: 4, right: 'yes', final: 1, actual: 1, actualHex: 4, pain: 'specific', witness: { theirStage: 'unknown' }, kept: 'na' },
  /* R6 */ { conf: 3, right: 'no', final: 6, actual: 4, actualHex: 4, pain: 'vague', witness: { theirStage: 'peak' }, kept: 'yes' },
  /* R7 */ { conf: 3, right: 'yes', final: 4, actual: null, actualHex: null, pain: 'specific', witness: { theirLineGuess: 4 }, kept: 'yes' },
  /* R8 */ { conf: 1, right: 'no', final: 3, actual: 3, actualHex: 4, pain: 'none', witness: { theirLineGuess: 3 }, kept: 'no' },
  /* R9 */ { conf: 5, final: 5, changed: true, pain: 'specific', noHindsight: true },
  /* R10 */ { conf: 2, right: 'yes', final: 2, actual: 3, actualHex: 4, pain: 'specific', kept: 'yes', domain: 'd2' },
]);

describe('calibrationReport', () => {
  const r = calibrationReport(DATA);

  it('chỉ tính bản ghi đã nhìn lại; đủ ngưỡng', () => {
    expect(r.reviewedCount).toBe(9);
    expect(r.sufficient).toBe(true);
  });

  it('dưới ngưỡng thì báo chưa đủ dữ liệu', () => {
    const few = DATA.filter((p) => p.hindsight).slice(0, MIN_HINDSIGHT_RECORDS - 1);
    expect(calibrationReport(few).sufficient).toBe(false);
  });

  it('calibration theo confidence', () => {
    expect(r.byConfidence[5]).toEqual(ratio(2, 3));
    expect(r.byConfidence[4]).toEqual(ratio(1, 2)); // "partly" không tính là đúng
    expect(r.byConfidence[3]).toEqual(ratio(1, 2));
    expect(r.byConfidence[2]).toEqual(ratio(1, 1));
    expect(r.byConfidence[1]).toEqual(ratio(0, 1));
  });

  it('thiên hướng hào: trung bình actual − final, bỏ bản ghi không có hào nhìn lại', () => {
    // −2, −1, 0, −1, 0, −2, 0, +1 → −5 / 8
    expect(r.lineBias).toEqual({ mean: -0.625, n: 8 });
  });

  it('thiên hướng quẻ đẹp', () => {
    expect(r.prettyBias.changed).toEqual(ratio(2, 9));
    expect(r.prettyBias.towardCritic).toEqual(ratio(1, 2));
  });

  it('giá trị nhân chứng', () => {
    // R1 gần hơn, R2 gần hơn (đang lên = 2–4 chứa 4), R3 xa hơn, R6 gần hơn, R8 hoà;
    // R5 (không rõ) và R7 (không có hào nhìn lại) bị bỏ.
    expect(r.witness.closer).toEqual(ratio(3, 5));
    expect(r.witness.tie).toEqual(ratio(1, 5));
    expect(r.witness.farther).toEqual(ratio(1, 5));
  });

  it('phép thử đau', () => {
    expect(r.pain.specific).toEqual(ratio(5, 5));
    expect(r.pain.vagueOrNone).toEqual(ratio(0, 4));
  });

  it('kỷ luật willNotDo, bỏ "na"', () => {
    expect(r.willNotDo.yes).toEqual(ratio(5, 8));
    expect(r.willNotDo.partly).toEqual(ratio(1, 8));
    expect(r.willNotDo.no).toEqual(ratio(2, 8));
  });

  it('vùng hay lui tới, theo lĩnh vực, sắp xếp xác định', () => {
    expect(r.zones.d1).toEqual([
      { hexagram: 3, line: 2, count: 2 },
      { hexagram: 4, line: 3, count: 2 },
      { hexagram: 4, line: 4, count: 2 },
      { hexagram: 4, line: 1, count: 1 },
    ]);
    expect(r.zones.d2).toEqual([{ hexagram: 4, line: 3, count: 1 }]);
  });

  it('không dữ liệu → tỉ lệ null, không NaN', () => {
    const empty = calibrationReport([]);
    expect(empty.byConfidence[5].rate).toBeNull();
    expect(empty.lineBias.mean).toBeNull();
    expect(empty.witness.closer.rate).toBeNull();
  });
});
