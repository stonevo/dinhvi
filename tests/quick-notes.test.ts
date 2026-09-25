import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DinhViDB, activeProfileData, ensureSeeded } from '../src/db/db';
import { exportAll, importAll, parseBackup, serializeBackup } from '../src/db/backup';
import { calibrationReport } from '../src/lib/calibration';

let n = 0;
let db: DinhViDB;
beforeEach(async () => {
  db = new DinhViDB(`quick-${n++}`);
  await ensureSeeded(db);
});
afterEach(() => db.delete());

describe('ghi nhanh', () => {
  it('thuộc hồ sơ qua lĩnh vực, có trong sao lưu, không vào hiệu chỉnh', async () => {
    const { domains } = await activeProfileData(db);
    await db.quickNotes.add({
      id: 'q1', domainId: domains[0].id, createdAt: '2026-09-25T00:00:00.000Z', period: '2026-Q3',
      method: 'cast', hexagram: 3, line: 2, castLines: [9, 6, 8, 8, 7, 8], note: 'họp căng',
    });

    const data = await activeProfileData(db);
    expect(data.quickNotes.map((q) => q.id)).toEqual(['q1']);
    expect(calibrationReport(data.positionings).reviewedCount).toBe(0);

    const text = serializeBackup(await exportAll(db, new Date(0)));
    const other = new DinhViDB(`quick-${n++}`);
    await importAll(other, parseBackup(text));
    expect(await other.quickNotes.get('q1')).toMatchObject({ note: 'họp căng', castLines: [9, 6, 8, 8, 7, 8] });
    expect(serializeBackup(await exportAll(other, new Date(0)))).toBe(text);
    await other.delete();
  });

  it('từ chối ghi nhanh trỏ tới lĩnh vực không tồn tại', async () => {
    const backup = await exportAll(db);
    backup.quickNotes.push({ id: 'x', domainId: 'không-có', createdAt: 'x', period: '2026-Q3', method: 'pick', hexagram: 1, line: 1, note: '' });
    expect(() => parseBackup(JSON.stringify(backup))).toThrow(/lĩnh vực không tồn tại/);
  });
});
