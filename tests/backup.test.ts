import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DinhViDB, ensureSeeded, DEFAULT_DOMAIN_NAMES } from '../src/db/db';
import { BackupError, exportAll, importAll, parseBackup, serializeBackup } from '../src/db/backup';
import { makePositioning } from './fixtures';

let n = 0;
let db: DinhViDB;

beforeEach(async () => {
  db = new DinhViDB(`test-${n++}`);
  await db.open();
});
afterEach(async () => {
  await db.delete();
});

describe('seed', () => {
  it('tạo 4 lĩnh vực mặc định và cài đặt, idempotent', async () => {
    await ensureSeeded(db);
    await ensureSeeded(db);
    const names = (await db.domains.toArray()).map((d) => d.name).sort();
    expect(names).toEqual([...DEFAULT_DOMAIN_NAMES].sort());
    expect((await db.settings.get('settings'))?.cycle).toBe('quarter');
  });
});

describe('export/import round-trip', () => {
  it('xuất → nhập vào DB khác → xuất lại cho ra cùng dữ liệu', async () => {
    await ensureSeeded(db);
    const [d1] = await db.domains.toArray();
    await db.positionings.bulkAdd([
      makePositioning({ id: 'a', domainId: d1.id, period: '2026-Q1', createdAt: '2026-01-05T00:00:00.000Z',
        hindsight: {
          reviewedAt: '2026-04-01T00:00:00.000Z', actualHexagram: 3, actualLine: 2,
          selfWasRight: 'partly', whatHappened: 'x', willNotDoKept: 'yes', notes: '',
        } }),
      makePositioning({ id: 'b', domainId: d1.id, period: '2026-Q2', witness: null, criticHexagram: null, criticLine: null }),
    ]);
    await db.drafts.add({ id: 'dr', domainId: d1.id, period: '2026-Q3', step: 3, data: { facts: ['a'] }, updatedAt: 'x' });
    await db.settings.update('settings', { cycle: 'month', reminderDay: 15 });

    const now = new Date('2026-09-23T00:00:00.000Z');
    const text = serializeBackup(await exportAll(db, now));

    const other = new DinhViDB(`test-${n++}`);
    await other.open();
    await ensureSeeded(other); // dữ liệu cũ phải bị thay thế hoàn toàn
    await importAll(other, parseBackup(text));
    const again = serializeBackup(await exportAll(other, now));
    await other.delete();

    expect(again).toBe(text);
    const parsed = JSON.parse(again);
    expect(parsed.positionings).toHaveLength(2);
    expect(parsed.domains).toHaveLength(4);
    expect(parsed.settings.cycle).toBe('month');
  });

  it('từ chối JSON hỏng', () => {
    expect(() => parseBackup('{not json')).toThrow(BackupError);
  });

  it('từ chối file sai schema', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'dinhvi', schemaVersion: 1 }))).toThrow(BackupError);
  });

  it('từ chối bản ghi trỏ tới lĩnh vực không tồn tại', async () => {
    await ensureSeeded(db);
    const backup = await exportAll(db);
    backup.positionings.push(makePositioning({ domainId: 'không-có' }));
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(/lĩnh vực không tồn tại/);
  });

  it('không nhập gì nếu file sai (dữ liệu cũ còn nguyên)', async () => {
    await ensureSeeded(db);
    expect(() => parseBackup('[]')).toThrow();
    expect(await db.domains.count()).toBe(4);
  });
});
