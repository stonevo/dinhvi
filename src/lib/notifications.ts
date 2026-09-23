import { db } from '../db/db';
import { checkAndNotify } from './remind-run';

// Phía trang: xin quyền, gửi thông báo qua service worker, đăng ký nhắc nền.

const TAG = 'dinhvi-reminder';
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export type NotificationSupport = 'unsupported' | 'default' | 'granted' | 'denied';

export function notificationSupport(): NotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (notificationSupport() === 'unsupported') return 'unsupported';
  return Notification.requestPermission();
}

async function show(title: string, options: NotificationOptions): Promise<void> {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, options);
  else new Notification(title, options);
}

type PeriodicSyncManager = {
  register(tag: string, o: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
};

/** Bật/tắt nhắc nền. Chỉ có tác dụng ở trình duyệt hỗ trợ và khi app đã cài. */
export async function syncBackgroundReminder(enabled: boolean): Promise<void> {
  try {
    const reg = (await navigator.serviceWorker?.ready) as (ServiceWorkerRegistration & { periodicSync?: PeriodicSyncManager }) | undefined;
    if (!reg?.periodicSync) return;
    if (!enabled) return void (await reg.periodicSync.unregister(TAG));
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
    if (status.state === 'granted') await reg.periodicSync.register(TAG, { minInterval: TWELVE_HOURS });
  } catch {
    // Không hỗ trợ — nhắc vẫn chạy khi mở app.
  }
}

/** Gọi khi app mở hoặc quay lại tab. */
export async function remindOnOpen(): Promise<void> {
  if (notificationSupport() !== 'granted') return;
  await checkAndNotify(db, show);
}
