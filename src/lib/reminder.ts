import type { Domain, Positioning, PositioningDraft, Settings } from '../types/schema';
import { periodOf } from './period';
import { domainStatus } from './status';

/** Ngày nhắc của một kỳ: ngày `reminderDay` của tháng đầu kỳ, giờ địa phương. */
export function reminderDate(period: string, reminderDay: number): Date {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return new Date(Number(q[1]), (Number(q[2]) - 1) * 3, reminderDay);
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, reminderDay);
  throw new Error(`Kỳ không hợp lệ: ${period}`);
}

/** Các lĩnh vực chưa xong trong kỳ (cần nhìn lại, cần định vị, hoặc đang viết dở). */
export function pendingDomains(
  domains: Domain[],
  positionings: Positioning[],
  drafts: PositioningDraft[],
  period: string,
): Domain[] {
  return domains.filter((d) => !d.archived && domainStatus(d.id, period, positionings, drafts) !== 'done');
}

export type ReminderState = {
  period: string;
  /** Đã qua ngày nhắc và còn lĩnh vực chưa xong — hiện dòng nhắc trong app. */
  inAppDue: boolean;
  /** Như trên, cộng: đã bật thông báo và kỳ này chưa gửi — gửi một thông báo. */
  notifyDue: boolean;
  pendingCount: number;
};

export function reminderState(
  now: Date,
  settings: Settings,
  domains: Domain[],
  positionings: Positioning[],
  drafts: PositioningDraft[],
): ReminderState {
  const period = periodOf(now, settings.cycle);
  const pendingCount = pendingDomains(domains, positionings, drafts, period).length;
  const inAppDue = pendingCount > 0 && now >= reminderDate(period, settings.reminderDay);
  const notifyDue = inAppDue && settings.notificationsEnabled && settings.lastReminderPeriod !== period;
  return { period, inAppDue, notifyDue, pendingCount };
}
