import type { Positioning, PositioningDraft } from '../types/schema';
import { comparePeriods } from './period';

export type DomainStatus = 'needsReview' | 'needsPositioning' | 'draft' | 'done';

/**
 * Trạng thái một lĩnh vực trong kỳ hiện tại. "Cần nhìn lại" đứng trước việc
 * định vị: không được định vị kỳ mới khi kỳ trước chưa có hindsight.
 */
export function domainStatus(
  domainId: string,
  currentPeriod: string,
  positionings: Positioning[],
  drafts: PositioningDraft[],
): DomainStatus {
  const own = positionings.filter((p) => p.domainId === domainId);
  if (own.some((p) => p.period === currentPeriod)) return 'done';
  if (unreviewedBefore(domainId, currentPeriod, positionings)) return 'needsReview';
  if (drafts.some((d) => d.domainId === domainId && d.period === currentPeriod)) return 'draft';
  return 'needsPositioning';
}

/**
 * Cổng tạo bản ghi mới: chưa có bản ghi cho kỳ này, và mọi kỳ trước của cùng
 * lĩnh vực đều đã nhìn lại.
 */
export function canStartPositioning(domainId: string, period: string, positionings: Positioning[]): boolean {
  return (
    !positionings.some((p) => p.domainId === domainId && p.period === period) &&
    !unreviewedBefore(domainId, period, positionings)
  );
}

/** Bản ghi gần nhất trước kỳ hiện tại mà chưa có hindsight, nếu có. */
export function unreviewedBefore(
  domainId: string,
  currentPeriod: string,
  positionings: Positioning[],
): Positioning | undefined {
  return positionings
    .filter((p) => p.domainId === domainId && comparePeriods(p.period, currentPeriod) < 0)
    .sort((a, b) => comparePeriods(b.period, a.period))
    .find((p) => p.hindsight === null);
}
