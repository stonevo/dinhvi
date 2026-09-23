import type { DinhViDB } from '../db/db';
import { getSettings } from '../db/db';
import { t } from '../i18n';
import { formatPeriod } from './period';
import { reminderState } from './reminder';

export type ShowNotification = (title: string, options: NotificationOptions) => Promise<void>;

/**
 * Kiểm tra và gửi tối đa một thông báo mỗi kỳ. Dùng chung cho trang (khi mở
 * app) và service worker (periodic background sync, nếu trình duyệt hỗ trợ).
 */
export async function checkAndNotify(db: DinhViDB, show: ShowNotification, now = new Date()): Promise<boolean> {
  const [settings, domains, positionings, drafts] = await Promise.all([
    getSettings(db),
    db.domains.toArray(),
    db.positionings.toArray(),
    db.drafts.toArray(),
  ]);
  const s = reminderState(now, settings, domains, positionings, drafts);
  if (!s.notifyDue) return false;
  await show(t('notify.title'), {
    body: t('notify.body', { n: s.pendingCount, period: formatPeriod(s.period) }),
    tag: `dinhvi-${s.period}`,
    icon: 'icon.svg',
  });
  await db.settings.put({ ...settings, lastReminderPeriod: s.period });
  return true;
}
