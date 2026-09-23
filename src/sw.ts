/// <reference lib="webworker" />
// Service worker: precache toàn bộ app + dữ liệu quẻ để dùng offline, và nhắc
// định kỳ qua Periodic Background Sync khi trình duyệt hỗ trợ (app đã cài).
// Không gửi gì ra mạng.
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { DinhViDB } from './db/db';
import { checkAndNotify } from './lib/remind-run';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', () => void self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const REMINDER_TAG = 'dinhvi-reminder';

type PeriodicSyncEvent = ExtendableEvent & { tag: string };

self.addEventListener('periodicsync', ((e: PeriodicSyncEvent) => {
  if (e.tag !== REMINDER_TAG) return;
  e.waitUntil(
    checkAndNotify(new DinhViDB(), async (title, options) => {
      await self.registration.showNotification(title, options);
    }),
  );
}) as EventListener);

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (windows[0]) return windows[0].focus();
      return self.clients.openWindow(self.registration.scope);
    })(),
  );
});
