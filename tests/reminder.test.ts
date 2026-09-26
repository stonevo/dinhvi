import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type Domain } from '../src/types/schema';
import { reminderDate, reminderState } from '../src/lib/reminder';
import { checkAndNotify } from '../src/lib/remind-run';
import { DinhViDB, ensureSeeded } from '../src/db/db';
import { makePositioning } from './fixtures';

const domains: Domain[] = [
  { id: 'd1', profileId: 'me', name: 'A', createdAt: '1', archived: false },
  { id: 'd2', profileId: 'me', name: 'B', createdAt: '2', archived: false },
  { id: 'd3', profileId: 'me', name: 'C', createdAt: '3', archived: true },
];
const on = { ...DEFAULT_SETTINGS, notificationsEnabled: true, reminderDay: 5 };

describe('ngày nhắc', () => {
  it('tháng đầu quý / tháng của kỳ', () => {
    expect(reminderDate('2026-Q3', 5)).toEqual(new Date(2026, 6, 5));
    expect(reminderDate('2026-09', 1)).toEqual(new Date(2026, 8, 1));
  });
});

describe('reminderState', () => {
  it('trước ngày nhắc: chưa nhắc', () => {
    const s = reminderState(new Date(2026, 6, 4), on, domains, [], []);
    expect(s).toMatchObject({ inAppDue: false, notifyDue: false, pendingCount: 2 });
  });
  it('từ ngày nhắc: nhắc; không tính lĩnh vực đã cất', () => {
    const s = reminderState(new Date(2026, 6, 5), on, domains, [], []);
    expect(s).toMatchObject({ period: '2026-Q3', inAppDue: true, notifyDue: true, pendingCount: 2 });
  });
  it('mọi lĩnh vực xong: không nhắc', () => {
    const ps = [makePositioning({ domainId: 'd1', period: '2026-Q3' }), makePositioning({ id: 'p2', domainId: 'd2', period: '2026-Q3' })];
    expect(reminderState(new Date(2026, 7, 1), on, domains, ps, []).inAppDue).toBe(false);
  });
  it('tắt thông báo: chỉ nhắc trong app', () => {
    const s = reminderState(new Date(2026, 7, 1), { ...on, notificationsEnabled: false }, domains, [], []);
    expect(s).toMatchObject({ inAppDue: true, notifyDue: false });
  });
  it('đã gửi trong kỳ này: không gửi lại', () => {
    const s = reminderState(new Date(2026, 7, 1), { ...on, lastReminderPeriod: '2026-Q3' }, domains, [], []);
    expect(s.notifyDue).toBe(false);
  });
});

describe('checkAndNotify', () => {
  let db: DinhViDB;
  let n = 0;
  beforeEach(async () => {
    db = new DinhViDB(`remind-${n++}`);
    await ensureSeeded(db);
    await db.settings.update('settings', { notificationsEnabled: true, reminderDay: 1 });
  });
  afterEach(() => db.delete());

  it('gửi đúng một lần mỗi kỳ', async () => {
    const shown: string[] = [];
    const show = async (title: string, o: NotificationOptions) => void shown.push(`${title}|${o.body}`);
    const now = new Date(2026, 8, 23);
    expect(await checkAndNotify(db, show, now)).toBe(true);
    expect(await checkAndNotify(db, show, now)).toBe(false);
    expect(shown).toHaveLength(1);
    expect(shown[0]).toContain('8 lĩnh vực');
    expect((await db.settings.get('settings'))?.lastReminderPeriod).toBe('2026-Q3');
    // Sang kỳ mới thì nhắc lại.
    expect(await checkAndNotify(db, show, new Date(2026, 9, 2))).toBe(true);
  });
});
