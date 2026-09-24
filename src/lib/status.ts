import type { Positioning, PositioningDraft } from '../types/schema';
import { comparePeriods } from './period';

export type DomainStatus = 'needsPositioning' | 'draft' | 'done';

/** Trạng thái định vị của một lĩnh vực trong kỳ hiện tại. */
export function domainStatus(
  domainId: string,
  currentPeriod: string,
  positionings: Positioning[],
  drafts: PositioningDraft[],
): DomainStatus {
  if (positionings.some((p) => p.domainId === domainId && p.period === currentPeriod)) return 'done';
  if (drafts.some((d) => d.domainId === domainId && d.period === currentPeriod)) return 'draft';
  return 'needsPositioning';
}

/** Mỗi lĩnh vực một bản ghi mỗi kỳ. Nhìn lại kỳ trước là tùy chọn, không chặn. */
export function canStartPositioning(domainId: string, period: string, positionings: Positioning[]): boolean {
  return !positionings.some((p) => p.domainId === domainId && p.period === period);
}

/** Bản ghi gần nhất trước kỳ hiện tại mà chưa nhìn lại, nếu có — để gợi ý. */
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
