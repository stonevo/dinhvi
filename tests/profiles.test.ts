import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_DOMAIN_NAMES, DinhViDB, activeProfileData, createProfile, deleteProfile, ensureSeeded, getSettings, setActiveProfile,
} from '../src/db/db';
import { exportAll, exportProfile, importProfiles, parseBackup, serializeBackup } from '../src/db/backup';
import { makePositioning } from './fixtures';

let n = 0;
let db: DinhViDB;
beforeEach(async () => {
  db = new DinhViDB(`prof-${n++}`);
  await ensureSeeded(db);
});
afterEach(() => db.delete());

describe('nâng DB lên v3', () => {
  it('gán dữ liệu cũ vào hồ sơ mặc định', async () => {
    const name = `legacy-${n++}`;
    const old = new Dexie(name);
    old.version(1).stores({ domains: 'id, archived, createdAt', positionings: 'id, domainId, period, [domainId+period], createdAt', drafts: 'id, domainId, [domainId+period]', settings: 'id' });
    old.version(2).stores({ casts: 'id, createdAt' });
    await old.open();
    await old.table('domains').add({ id: 'd-old', name: 'Cũ', createdAt: '1', archived: false });
    await old.table('casts').add({ id: 'c-old', createdAt: '1', question: '', lines: [7, 7, 7, 7, 7, 7], primary: 1, moving: [], transformed: null, notes: '' });
    old.close();

    const upgraded = new DinhViDB(name);
    await ensureSeeded(upgraded);
    expect((await upgraded.domains.get('d-old'))?.profileId).toBe('me');
    expect((await upgraded.casts.get('c-old'))?.profileId).toBe('me');
    expect((await upgraded.profiles.get('me'))?.name).toBe('Tôi');
    // Hồ sơ mặc định đã có lĩnh vực nên không bị thêm 4 lĩnh vực mặc định.
    expect(await upgraded.domains.count()).toBe(1);
    await upgraded.delete();
  });
});

describe('cài đặt từ bản cũ', () => {
  it('thiếu activeProfileId vẫn đọc được và được ghi bổ sung khi khởi động', async () => {
    const raw = (await db.settings.get('settings'))!;
    const { activeProfileId: _drop, ...old } = raw;
    await db.settings.put(old as typeof raw);
    expect((await getSettings(db)).activeProfileId).toBe('me');
    // Truy vấn theo hồ sơ (như trang Gieo quẻ) không còn nhận khoá undefined.
    const { activeProfileId } = await getSettings(db);
    await expect(db.casts.where('profileId').equals(activeProfileId).toArray()).resolves.toEqual([]);
    await ensureSeeded(db);
    expect((await db.settings.get('settings'))?.activeProfileId).toBe('me');
  });
});

describe('nhiều hồ sơ', () => {
  it('mỗi hồ sơ có lĩnh vực và bản ghi riêng', async () => {
    const me = await activeProfileData(db);
    await db.positionings.add(makePositioning({ id: 'p-me', domainId: me.domains[0].id }));

    const lan = await createProfile(db, 'Lan');
    await setActiveProfile(db, lan);
    const lanData = await activeProfileData(db);
    expect(lanData.profileId).toBe(lan);
    expect(lanData.domains).toHaveLength(8);
    expect(lanData.positionings).toEqual([]);

    await setActiveProfile(db, 'me');
    expect((await activeProfileData(db)).positionings.map((p) => p.id)).toEqual(['p-me']);
  });

  it('xoá hồ sơ xoá cả dữ liệu, chuyển về hồ sơ còn lại; không xoá được hồ sơ cuối', async () => {
    const lan = await createProfile(db, 'Lan');
    await setActiveProfile(db, lan);
    const lanDomain = (await activeProfileData(db)).domains[0];
    await db.positionings.add(makePositioning({ id: 'p-lan', domainId: lanDomain.id }));

    await deleteProfile(db, lan);
    expect(await db.profiles.get(lan)).toBeUndefined();
    expect(await db.positionings.get('p-lan')).toBeUndefined();
    expect(await db.domains.where('profileId').equals(lan).count()).toBe(0);
    expect((await getSettings(db)).activeProfileId).toBe('me');
    await expect(deleteProfile(db, 'me')).rejects.toThrow();
  });
});

describe('xuất / nhập một hồ sơ', () => {
  it('nhập hồ sơ chỉ thay hồ sơ đó, giữ hồ sơ khác', async () => {
    const lan = await createProfile(db, 'Lan');
    await setActiveProfile(db, lan);
    const lanDomain = (await activeProfileData(db)).domains[0];
    await db.positionings.add(makePositioning({ id: 'p-lan', domainId: lanDomain.id }));
    const file = serializeBackup(await exportProfile(db, lan));

    // Trên máy này, dữ liệu của Lan thay đổi; hồ sơ "Tôi" có bản ghi riêng.
    await db.positionings.delete('p-lan');
    await db.positionings.add(makePositioning({ id: 'p-lan-new', domainId: lanDomain.id, period: '2026-Q1' }));
    const meDomain = (await db.domains.where('profileId').equals('me').first())!;
    await db.positionings.add(makePositioning({ id: 'p-me', domainId: meDomain.id }));

    const parsed = parseBackup(file);
    expect(parsed.scope).toBe('profile');
    expect(parsed.profiles.map((p) => p.name)).toEqual(['Lan']);
    await importProfiles(db, parsed);

    expect(await db.positionings.get('p-lan')).toBeDefined();
    expect(await db.positionings.get('p-lan-new')).toBeUndefined();
    expect(await db.positionings.get('p-me')).toBeDefined();
    expect(await db.profiles.count()).toBe(2);
  });

  it('file sao lưu trước v3 được gán vào hồ sơ mặc định', async () => {
    const backup = JSON.parse(serializeBackup(await exportAll(db)));
    backup.schemaVersion = 2;
    delete backup.profiles;
    delete backup.quickNotes;
    delete backup.scope;
    for (const d of backup.domains) delete d.profileId;
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.scope).toBe('all');
    expect(parsed.profiles.map((p) => p.id)).toEqual(['me']);
    expect(parsed.domains.every((d) => d.profileId === 'me')).toBe(true);
  });
});

describe('nâng DB lên v5: bộ 8 lĩnh vực', () => {
  it('đổi tên 4 lĩnh vực mặc định cũ (giữ bản ghi), thêm lĩnh vực mới; hồ sơ tự đặt giữ nguyên', async () => {
    const name = `v4-${n++}`;
    const old = new Dexie(name);
    old.version(1).stores({ domains: 'id, archived, createdAt', positionings: 'id, domainId, period, [domainId+period], createdAt', drafts: 'id, domainId, [domainId+period]', settings: 'id' });
    old.version(2).stores({ casts: 'id, createdAt' });
    old.version(3).stores({ domains: 'id, profileId, archived, createdAt', casts: 'id, profileId, createdAt', profiles: 'id, createdAt', quickNotes: 'id, domainId, createdAt' });
    old.version(4).stores({ study: 'id, profileId, due' });
    await old.open();
    await old.table('profiles').bulkAdd([{ id: 'me', name: 'Tôi', createdAt: '1' }, { id: 'lan', name: 'Lan', createdAt: '2' }]);
    await old.table('domains').bulkAdd([
      { id: 'w', profileId: 'me', name: 'Công việc', createdAt: '2026-01-01T00:00:00.000Z', archived: false },
      { id: 'h', profileId: 'me', name: 'Sức khỏe', createdAt: '2026-01-01T00:00:00.001Z', archived: false },
      { id: 'x', profileId: 'me', name: 'Viết sách', createdAt: '2026-01-02T00:00:00.000Z', archived: false },
      { id: 'l1', profileId: 'lan', name: 'Chạy bộ', createdAt: '2026-01-03T00:00:00.000Z', archived: false },
    ]);
    await old.table('positionings').add({ ...makePositioning({ id: 'p1', domainId: 'w' }) });
    old.close();

    const up = new DinhViDB(name);
    await up.open();
    const me = await up.domains.where('profileId').equals('me').toArray();
    const names = me.map((d) => d.name);
    expect(names).toContain('Công việc/sự nghiệp');
    expect(names).toContain('Sức khoẻ');
    expect(names).not.toContain('Công việc');
    expect(names).toContain('Viết sách');
    expect(me).toHaveLength(9); // 8 mặc định + 1 tự thêm
    const ordered = (await up.domains.where('profileId').equals('me').sortBy('createdAt')).map((d) => d.name);
    expect(ordered.slice(0, 8)).toEqual(DEFAULT_DOMAIN_NAMES);
    expect(ordered[8]).toBe('Viết sách');
    expect((await up.domains.get('w'))?.name).toBe('Công việc/sự nghiệp');
    expect((await up.positionings.get('p1'))?.domainId).toBe('w');
    const lan = await up.domains.where('profileId').equals('lan').toArray();
    expect(lan.map((d) => d.name)).toEqual(['Chạy bộ']);
    await up.delete();
  });
});
