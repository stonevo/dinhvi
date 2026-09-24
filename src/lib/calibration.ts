import type { Positioning } from '../types/schema';
import { distanceToStage } from './iching';

// Thống kê hiệu chỉnh (mục 6). Mọi con số đi kèm n. Chỉ nhìn quá khứ —
// không có hàm nào ở đây ước đoán kỳ sau.

export const MIN_HINDSIGHT_RECORDS = 8;

export type Ratio = { k: number; n: number; rate: number | null };

export function ratio(k: number, n: number): Ratio {
  return { k, n, rate: n === 0 ? null : k / n };
}

type Reviewed = Positioning & { hindsight: NonNullable<Positioning['hindsight']> };

export function reviewed(ps: Positioning[]): Reviewed[] {
  return ps.filter((p): p is Reviewed => p.hindsight !== null);
}

/** Tỉ lệ selfWasRight = yes theo từng mức confidence. */
export function calibrationByConfidence(ps: Positioning[]): Record<1 | 2 | 3 | 4 | 5, Ratio> {
  const rs = reviewed(ps);
  const out = {} as Record<1 | 2 | 3 | 4 | 5, Ratio>;
  for (const c of [1, 2, 3, 4, 5] as const) {
    const bucket = rs.filter((p) => p.confidence === c);
    out[c] = ratio(bucket.filter((p) => p.hindsight.selfWasRight === 'yes').length, bucket.length);
  }
  return out;
}

/**
 * Trung bình (actualLine − finalLine).
 * Âm = tự đặt mình ở hào cao hơn (giai đoạn muộn hơn) thực tế — lỗi hệ thống (a).
 * Dương = tự đặt thấp hơn thực tế.
 */
export function lineBias(ps: Positioning[]): { mean: number | null; n: number } {
  const diffs = reviewed(ps)
    .filter((p) => p.hindsight.actualLine !== null)
    .map((p) => p.hindsight.actualLine! - p.finalLine);
  return { mean: diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null, n: diffs.length };
}

/**
 * Thiên hướng quẻ đẹp: tỉ lệ đổi quẻ/hào sau phép thử, và trong số đã đổi,
 * tỉ lệ đổi về đúng quẻ người phê bình nêu.
 */
export function prettyHexagramBias(ps: Positioning[]): { changed: Ratio; towardCritic: Ratio } {
  const changed = ps.filter((p) => p.changedAfterTests);
  const toward = changed.filter((p) => p.criticHexagram !== null && p.finalHexagram === p.criticHexagram);
  return { changed: ratio(changed.length, ps.length), towardCritic: ratio(toward.length, changed.length) };
}

/**
 * Giá trị nhân chứng: với các bản ghi có nhân chứng và có hào nhìn lại, so
 * khoảng cách tới hào thực của nhân chứng và của chính mình. Nhân chứng đoán
 * hào thì dùng hào đó; không thì dùng khoảng hào của giai đoạn họ nêu.
 */
export function witnessValue(ps: Positioning[]): { closer: Ratio; tie: Ratio; farther: Ratio } {
  let closer = 0;
  let tie = 0;
  let farther = 0;
  for (const p of reviewed(ps)) {
    const actual = p.hindsight.actualLine;
    const w = p.witness;
    if (actual === null || !w) continue;
    let wDist: number;
    if (w.theirLineGuess !== null) wDist = Math.abs(w.theirLineGuess - actual);
    else if (w.theirStage !== 'unknown') wDist = distanceToStage(actual, w.theirStage);
    else continue;
    const selfDist = Math.abs(p.finalLine - actual);
    if (wDist < selfDist) closer++;
    else if (wDist === selfDist) tie++;
    else farther++;
  }
  const n = closer + tie + farther;
  return { closer: ratio(closer, n), tie: ratio(tie, n), farther: ratio(farther, n) };
}

/** Phép thử đau: tỉ lệ tự định vị đúng khi khó chịu cụ thể so với mơ hồ/không. */
export function painTest(ps: Positioning[]): { specific: Ratio; vagueOrNone: Ratio } {
  const rs = reviewed(ps);
  const rightIn = (xs: Reviewed[]) => ratio(xs.filter((p) => p.hindsight.selfWasRight === 'yes').length, xs.length);
  return {
    specific: rightIn(rs.filter((p) => p.painType === 'specific')),
    vagueOrNone: rightIn(rs.filter((p) => p.painType !== 'specific')),
  };
}

/** Kỷ luật willNotDo, bỏ qua các kỳ đánh "không áp dụng". */
export function willNotDoDiscipline(ps: Positioning[]): { yes: Ratio; partly: Ratio; no: Ratio } {
  const rs = reviewed(ps).filter((p) => p.hindsight.willNotDoKept !== 'na');
  const count = (v: 'yes' | 'partly' | 'no') => ratio(rs.filter((p) => p.hindsight.willNotDoKept === v).length, rs.length);
  return { yes: count('yes'), partly: count('partly'), no: count('no') };
}

/** Độ đúng theo cách có quẻ ở bước 2: tự ghép quái hay gieo. */
export function methodComparison(ps: Positioning[]): { self: Ratio; cast: Ratio } {
  const rs = reviewed(ps);
  const right = (m: 'self' | 'cast') => {
    const xs = rs.filter((p) => (p.method ?? 'self') === m);
    return ratio(xs.filter((p) => p.hindsight.selfWasRight === 'yes').length, xs.length);
  };
  return { self: right('self'), cast: right('cast') };
}

export type Zone = { hexagram: number; line: number | null; count: number };

/** Quẻ/hào hay lui tới theo nhìn lại, theo lĩnh vực. Sắp xếp xác định. */
export function frequentZones(ps: Positioning[]): Record<string, Zone[]> {
  const byDomain: Record<string, Map<string, Zone>> = {};
  for (const p of reviewed(ps)) {
    const hex = p.hindsight.actualHexagram;
    if (hex === null) continue;
    const line = p.hindsight.actualLine;
    const m = (byDomain[p.domainId] ??= new Map());
    const key = `${hex}:${line ?? '-'}`;
    const z = m.get(key) ?? { hexagram: hex, line, count: 0 };
    z.count++;
    m.set(key, z);
  }
  return Object.fromEntries(
    Object.entries(byDomain).map(([d, m]) => [
      d,
      [...m.values()].sort((a, b) => b.count - a.count || a.hexagram - b.hexagram || (a.line ?? 0) - (b.line ?? 0)),
    ]),
  );
}

export type CalibrationReport = {
  sufficient: boolean;
  reviewedCount: number;
  byConfidence: ReturnType<typeof calibrationByConfidence>;
  lineBias: ReturnType<typeof lineBias>;
  prettyBias: ReturnType<typeof prettyHexagramBias>;
  witness: ReturnType<typeof witnessValue>;
  pain: ReturnType<typeof painTest>;
  willNotDo: ReturnType<typeof willNotDoDiscipline>;
  zones: ReturnType<typeof frequentZones>;
  method: ReturnType<typeof methodComparison>;
};

/**
 * Báo cáo đầy đủ. Tất cả chỉ số tính trên các bản ghi đã có nhìn lại, để các
 * tỉ lệ cùng một mẫu và so được với nhau.
 */
export function calibrationReport(ps: Positioning[]): CalibrationReport {
  const rs = reviewed(ps);
  return {
    sufficient: rs.length >= MIN_HINDSIGHT_RECORDS,
    reviewedCount: rs.length,
    byConfidence: calibrationByConfidence(rs),
    lineBias: lineBias(rs),
    prettyBias: prettyHexagramBias(rs),
    witness: witnessValue(rs),
    pain: painTest(rs),
    willNotDo: willNotDoDiscipline(rs),
    zones: frequentZones(rs),
    method: methodComparison(rs),
  };
}
