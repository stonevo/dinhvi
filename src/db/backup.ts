import { BACKUP_SCHEMA_VERSION, DEFAULT_PROFILE_ID, backupSchema, type Backup } from '../types/schema';
import { clearProfileData, getSettings, type DinhViDB } from './db';

/** Sao lưu toàn bộ (mọi hồ sơ). */
export async function exportAll(db: DinhViDB, now = new Date()): Promise<Backup> {
  const [profiles, domains, positionings, drafts, settings, casts, quickNotes] = await Promise.all([
    db.profiles.orderBy('createdAt').toArray(),
    db.domains.orderBy('createdAt').toArray(),
    db.positionings.orderBy('createdAt').toArray(),
    db.drafts.toArray(),
    getSettings(db),
    db.casts.orderBy('createdAt').toArray(),
    db.quickNotes.orderBy('createdAt').toArray(),
  ]);
  return {
    app: 'dinhvi',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    scope: 'all',
    exportedAt: now.toISOString(),
    profiles,
    domains,
    positionings,
    drafts,
    settings,
    casts,
    quickNotes,
  };
}

/** Sao lưu một hồ sơ — để chuyển hoặc gửi riêng dữ liệu của một người. */
export async function exportProfile(db: DinhViDB, profileId: string, now = new Date()): Promise<Backup> {
  const all = await exportAll(db, now);
  const domains = all.domains.filter((d) => d.profileId === profileId);
  const ids = new Set(domains.map((d) => d.id));
  return {
    ...all,
    scope: 'profile',
    profiles: all.profiles.filter((p) => p.id === profileId),
    domains,
    positionings: all.positionings.filter((p) => ids.has(p.domainId)),
    drafts: all.drafts.filter((d) => ids.has(d.domainId)),
    casts: all.casts.filter((c) => c.profileId === profileId),
    quickNotes: all.quickNotes.filter((q) => ids.has(q.domainId)),
  };
}

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(backup, null, 2);
}

export class BackupError extends Error {}

/** Parse + validate. Ném BackupError với thông điệp đọc được nếu file sai. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('File không phải JSON hợp lệ.');
  }
  const result = backupSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new BackupError(`File backup không đúng định dạng: ${first.path.join('.')} — ${first.message}`);
  }
  const data = result.data;
  // File trước v3 không có hồ sơ: dữ liệu thuộc hồ sơ mặc định.
  if (data.profiles.length === 0)
    data.profiles = [{ id: DEFAULT_PROFILE_ID, name: 'Tôi', createdAt: data.exportedAt }];
  const profileIds = new Set(data.profiles.map((p) => p.id));
  const strayDomain = data.domains.find((d) => !profileIds.has(d.profileId));
  if (strayDomain) throw new BackupError(`Lĩnh vực ${strayDomain.id} trỏ tới hồ sơ không có trong file.`);
  const domainIds = new Set(data.domains.map((d) => d.id));
  const orphan =
    data.positionings.find((p) => !domainIds.has(p.domainId)) ?? data.quickNotes.find((q) => !domainIds.has(q.domainId));
  if (orphan) throw new BackupError(`Bản ghi ${orphan.id} trỏ tới lĩnh vực không tồn tại.`);
  return data;
}

const ALL_TABLES = (db: DinhViDB) => [db.profiles, db.domains, db.positionings, db.drafts, db.settings, db.casts, db.quickNotes];

/** Thay toàn bộ dữ liệu hiện có bằng nội dung backup, trong một transaction. */
export async function importAll(db: DinhViDB, backup: Backup): Promise<void> {
  await db.transaction('rw', ALL_TABLES(db), async () => {
    await Promise.all(ALL_TABLES(db).map((t) => t.clear()));
    await db.profiles.bulkAdd(backup.profiles);
    await db.domains.bulkAdd(backup.domains);
    await db.positionings.bulkAdd(backup.positionings);
    await db.drafts.bulkAdd(backup.drafts);
    await db.casts.bulkAdd(backup.casts);
    await db.quickNotes.bulkAdd(backup.quickNotes);
    const activeOk = backup.profiles.some((p) => p.id === backup.settings.activeProfileId);
    await db.settings.put({ ...backup.settings, activeProfileId: activeOk ? backup.settings.activeProfileId : backup.profiles[0].id });
  });
}

/**
 * Nhập các hồ sơ trong file vào dữ liệu hiện có: hồ sơ trùng id bị thay bằng
 * bản trong file, hồ sơ khác giữ nguyên. Cài đặt của máy này không đổi.
 */
export async function importProfiles(db: DinhViDB, backup: Backup): Promise<void> {
  await db.transaction('rw', ALL_TABLES(db), async () => {
    for (const p of backup.profiles) {
      await clearProfileData(db, p.id);
      await db.profiles.put(p);
    }
    await db.domains.bulkPut(backup.domains);
    await db.positionings.bulkPut(backup.positionings);
    await db.drafts.bulkPut(backup.drafts);
    await db.casts.bulkPut(backup.casts);
    await db.quickNotes.bulkPut(backup.quickNotes);
  });
}
