import { BACKUP_SCHEMA_VERSION, backupSchema, type Backup } from '../types/schema';
import { getSettings, type DinhViDB } from './db';

export async function exportAll(db: DinhViDB, now = new Date()): Promise<Backup> {
  const [domains, positionings, drafts, settings, casts] = await Promise.all([
    db.domains.orderBy('createdAt').toArray(),
    db.positionings.orderBy('createdAt').toArray(),
    db.drafts.toArray(),
    getSettings(db),
    db.casts.orderBy('createdAt').toArray(),
  ]);
  return {
    app: 'dinhvi',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    domains,
    positionings,
    drafts,
    settings,
    casts,
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
  const domainIds = new Set(result.data.domains.map((d) => d.id));
  const orphan = result.data.positionings.find((p) => !domainIds.has(p.domainId));
  if (orphan) throw new BackupError(`Bản ghi ${orphan.id} trỏ tới lĩnh vực không tồn tại.`);
  return result.data;
}

/** Thay toàn bộ dữ liệu hiện có bằng nội dung backup, trong một transaction. */
export async function importAll(db: DinhViDB, backup: Backup): Promise<void> {
  await db.transaction('rw', [db.domains, db.positionings, db.drafts, db.settings, db.casts], async () => {
    await Promise.all([db.domains.clear(), db.positionings.clear(), db.drafts.clear(), db.settings.clear(), db.casts.clear()]);
    await db.domains.bulkAdd(backup.domains);
    await db.positionings.bulkAdd(backup.positionings);
    await db.drafts.bulkAdd(backup.drafts);
    await db.settings.put(backup.settings);
    await db.casts.bulkAdd(backup.casts);
  });
}
