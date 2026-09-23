import type { Domain, Positioning, StageInCycle } from '../types/schema';
import { comparePeriods } from './period';

// Dữ liệu quỹ đạo (mục 5). Chỉ ghi chép quá khứ và hiện tại — không ngoại suy.

export type TrajectoryPoint = {
  positioningId: string;
  period: string;
  hexagram: number;
  line: number;
  confidence: number;
  hindsight: { hexagram: number | null; line: number | null } | null;
  willNotDo: string;
  painfulSentence: string;
};

export function byPeriod(ps: Positioning[]): Positioning[] {
  return [...ps].sort((a, b) => comparePeriods(a.period, b.period) || a.createdAt.localeCompare(b.createdAt));
}

export function domainTrajectory(ps: Positioning[], domainId: string): TrajectoryPoint[] {
  return byPeriod(ps.filter((p) => p.domainId === domainId)).map((p) => ({
    positioningId: p.id,
    period: p.period,
    hexagram: p.finalHexagram,
    line: p.finalLine,
    confidence: p.confidence,
    hindsight: p.hindsight ? { hexagram: p.hindsight.actualHexagram, line: p.hindsight.actualLine } : null,
    willNotDo: p.willNotDo,
    painfulSentence: p.painfulSentence,
  }));
}

/** Trang quỹ đạo chỉ hiện khi có ít nhất 2 kỳ ở một lĩnh vực nào đó. */
export function hasTrajectory(ps: Positioning[]): boolean {
  const periods = new Map<string, Set<string>>();
  for (const p of ps) {
    const s = periods.get(p.domainId) ?? new Set();
    s.add(p.period);
    periods.set(p.domainId, s);
    if (s.size >= 2) return true;
  }
  return false;
}

export type OverviewRow = {
  domain: Domain;
  positioning: {
    hexagram: number;
    line: number;
    stage: StageInCycle | null;
    confidence: number;
  } | null;
};

/** Bảng tổng quan các lĩnh vực chưa cất trong một kỳ. */
export function periodOverview(
  domains: Domain[],
  ps: Positioning[],
  period: string,
  stageOf: (hexagram: number) => StageInCycle | null,
): OverviewRow[] {
  return domains
    .filter((d) => !d.archived)
    .map((domain) => {
      const p = ps.find((x) => x.domainId === domain.id && x.period === period);
      return {
        domain,
        positioning: p
          ? { hexagram: p.finalHexagram, line: p.finalLine, stage: stageOf(p.finalHexagram), confidence: p.confidence }
          : null,
      };
    });
}

export type SequenceStepKind = 'same' | 'next' | 'forwardJump' | 'backward';
export type SequenceStep = { from: number; to: number; kind: SequenceStepKind; distance: number };

/**
 * Lịch sử quẻ của một lĩnh vực đối chiếu với thứ tự King Wen: mỗi bước giữa
 * hai kỳ liên tiếp là ở lại, sang đúng quẻ kế tiếp, nhảy tới, hay lùi lại.
 */
export function hexagramHistory(ps: Positioning[], domainId: string): {
  hexagrams: number[];
  steps: SequenceStep[];
  followsSequence: { k: number; n: number };
} {
  const hexagrams = byPeriod(ps.filter((p) => p.domainId === domainId)).map((p) => p.finalHexagram);
  const steps: SequenceStep[] = [];
  for (let i = 1; i < hexagrams.length; i++) {
    const from = hexagrams[i - 1];
    const to = hexagrams[i];
    const d = to - from;
    const kind: SequenceStepKind = d === 0 ? 'same' : d === 1 ? 'next' : d > 1 ? 'forwardJump' : 'backward';
    steps.push({ from, to, kind, distance: d });
  }
  return {
    hexagrams,
    steps,
    followsSequence: { k: steps.filter((s) => s.kind === 'same' || s.kind === 'next').length, n: steps.length },
  };
}
