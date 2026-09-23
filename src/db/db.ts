import Dexie, { type Table } from 'dexie';
import {
  DEFAULT_SETTINGS,
  type Domain,
  type Positioning,
  type PositioningDraft,
  type Settings,
} from '../types/schema';
import { newId } from '../lib/id';

export class DinhViDB extends Dexie {
  domains!: Table<Domain, string>;
  positionings!: Table<Positioning, string>;
  drafts!: Table<PositioningDraft, string>;
  settings!: Table<Settings, string>;

  constructor(name = 'dinhvi') {
    super(name);
    this.version(1).stores({
      domains: 'id, archived, createdAt',
      positionings: 'id, domainId, period, [domainId+period], createdAt',
      drafts: 'id, domainId, [domainId+period]',
      settings: 'id',
    });
  }
}

export const DEFAULT_DOMAIN_NAMES = ['Công việc', 'Gia đình', 'Sức khỏe', 'Tài chính'];

/** Tạo lĩnh vực mặc định và cài đặt nếu DB còn trống. Idempotent. */
export async function ensureSeeded(db: DinhViDB, now = new Date()): Promise<void> {
  await db.transaction('rw', db.domains, db.settings, async () => {
    if (!(await db.settings.get('settings'))) await db.settings.put(DEFAULT_SETTINGS);
    if ((await db.domains.count()) === 0) {
      const createdAt = now.toISOString();
      await db.domains.bulkAdd(
        DEFAULT_DOMAIN_NAMES.map((name) => ({ id: newId(), name, createdAt, archived: false })),
      );
    }
  });
}

export async function getSettings(db: DinhViDB): Promise<Settings> {
  return (await db.settings.get('settings')) ?? DEFAULT_SETTINGS;
}

export const db = new DinhViDB();
