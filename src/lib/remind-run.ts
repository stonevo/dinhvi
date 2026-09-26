import type { DinhViDB } from '../db/db';
import { getSettings } from '../db/db';
import { t } from '../i18n';
import { formatPeriod } from './period';
import { reminderState } from './reminder';
import { dueChecks, vnDateString } from './castLog';

export type ShowNotification = (title: string, options: NotificationOptions) => Promise<void>;

/**
 * Kiểm tra và gửi tối đa một thông báo mỗi kỳ. Dùng chung cho trang (khi mở
 * app) và service worker (periodic background sync, nếu trình duyệt hỗ trợ).
 */
export async function checkAndNotify(db: DinhViDB, show: ShowNotification, now = new Date()): Promise<boolean> {
  const [settings, domains, positionings, drafts, casts] = await Promise.all([
    getSettings(db),
    db.domains.toArray(),
    db.positionings.toArray(),
    db.drafts.toArray(),
    db.casts.toArray(),
  ]);
  let sent = false;
  let next = settings;
  const s = reminderState(now, settings, domains, positionings, drafts);
  if (s.notifyDue) {
    await show(t('notify.title'), {
      body: t('notify.body', { n: s.pendingCount, period: formatPeriod(s.period) }),
      tag: `dinhvi-${s.period}`,
      icon: 'icon.svg',
    });
    next = { ...next, lastReminderPeriod: s.period };
    sent = true;
  }
  // Lần gieo đến hạn đối chiếu: tối đa một thông báo mỗi ngày (giờ Việt Nam).
  const today = vnDateString(now);
  const due = settings.notificationsEnabled ? dueChecks(casts, today) : [];
  if (due.length && settings.lastCastReminderOn !== today) {
    await show(t('notify.castTitle'), {
      body: t('notify.castBody', { n: due.length, question: due[0].question || '—' }),
      tag: `dinhvi-cast-${today}`,
      icon: 'icon.svg',
    });
    next = { ...next, lastCastReminderOn: today };
    sent = true;
  }
  if (sent) await db.settings.put(next);
  return sent;
}
