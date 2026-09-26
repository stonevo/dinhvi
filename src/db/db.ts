import Dexie, { type Table } from 'dexie';
import {
  DEFAULT_PROFILE_ID,
  DEFAULT_SETTINGS,
  type CastRecord,
  type Domain,
  type Positioning,
  type PositioningDraft,
  type Profile,
  type QuickNote,
  type Settings,
  type StudyState,
} from '../types/schema';
import { newId } from '../lib/id';

export class DinhViDB extends Dexie {
  domains!: Table<Domain, string>;
  positionings!: Table<Positioning, string>;
  drafts!: Table<PositioningDraft, string>;
  settings!: Table<Settings, string>;
  casts!: Table<CastRecord, string>;
  profiles!: Table<Profile, string>;
  quickNotes!: Table<QuickNote, string>;
  study!: Table<StudyState, string>;

  constructor(name = 'dinhvi') {
    super(name);
    this.version(1).stores({
      domains: 'id, archived, createdAt',
      positionings: 'id, domainId, period, [domainId+period], createdAt',
      drafts: 'id, domainId, [domainId+period]',
      settings: 'id',
    });
    // v2: lịch sử gieo quẻ ở mục "Gieo quẻ" (tách khỏi bản ghi định vị).
    this.version(2).stores({ casts: 'id, createdAt' });
    // v3: nhiều hồ sơ + ghi nhanh. Dữ liệu cũ được gán vào hồ sơ mặc định.
    this.version(3)
      .stores({
        domains: 'id, profileId, archived, createdAt',
        casts: 'id, profileId, createdAt',
        profiles: 'id, createdAt',
        quickNotes: 'id, domainId, createdAt',
      })
      .upgrade(async (tx) => {
        await tx.table('domains').toCollection().modify((d: Partial<Domain>) => {
          d.profileId ??= DEFAULT_PROFILE_ID;
        });
        await tx.table('casts').toCollection().modify((c: Partial<CastRecord>) => {
          c.profileId ??= DEFAULT_PROFILE_ID;
        });
      });
    // v4: tiến độ trang Học.
    this.version(4).stores({ study: 'id, profileId, due' });
    // v5: bộ 8 lĩnh vực mặc định. Đổi tên 4 lĩnh vực mặc định cũ (giữ bản ghi), thêm các
    // lĩnh vực mới còn thiếu cho hồ sơ đang dùng bộ mặc định; lĩnh vực tự thêm giữ nguyên.
    this.version(5)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table('domains');
        const all = (await table.toArray()) as Domain[];
        const byProfile = new Map<string, Domain[]>();
        for (const d of all) byProfile.set(d.profileId, [...(byProfile.get(d.profileId) ?? []), d]);
        const now = Date.now();
        for (const [profileId, domains] of byProfile) {
          for (const d of domains) {
            const renamed = LEGACY_DOMAIN_RENAMES[d.name];
            if (renamed) await table.update(d.id, { name: renamed });
          }
          // Chỉ bổ sung cho hồ sơ đang dùng bộ mặc định; hồ sơ toàn lĩnh vực tự đặt thì để nguyên.
          if (!domains.some((d) => LEGACY_DOMAIN_RENAMES[d.name] || DEFAULT_DOMAIN_NAMES.includes(d.name))) continue;
          // Xếp bộ mặc định theo đúng thứ tự mới (sắp theo createdAt), bắt đầu từ lĩnh vực cũ nhất.
          const base = Math.min(...domains.map((d) => new Date(d.createdAt).getTime()).filter(Number.isFinite), now);
          const current = new Map(domains.map((d) => [LEGACY_DOMAIN_RENAMES[d.name] ?? d.name, d]));
          for (const [i, name] of DEFAULT_DOMAIN_NAMES.entries()) {
            const createdAt = new Date(base + i).toISOString();
            const existing = current.get(name);
            if (existing) await table.update(existing.id, { createdAt });
            else await table.add({ id: newId(now + i), profileId, name, createdAt, archived: false });
          }
        }
      });
  }
}

export const DEFAULT_DOMAIN_NAMES = [
  'Công việc/sự nghiệp',
  'Tài chính/kinh doanh',
  'Tình cảm/hôn nhân',
  'Gia đình/con cái',
  'Sức khoẻ',
  'Học tập/thi cử',
  'Đi lại/nơi ở/tìm kiếm',
  'Bản thân/tinh thần',
];

/** Tên 4 lĩnh vực mặc định trước v5 → tên mới. */
export const LEGACY_DOMAIN_RENAMES: Record<string, string> = {
  'Công việc': 'Công việc/sự nghiệp',
  'Tài chính': 'Tài chính/kinh doanh',
  'Gia đình': 'Gia đình/con cái',
  'Sức khỏe': 'Sức khoẻ',
};
export const DEFAULT_PROFILE_NAME = 'Tôi';

function defaultDomains(profileId: string, createdAt: string): Domain[] {
  // Lệch createdAt từng mili giây để giữ đúng thứ tự khi sắp theo ngày tạo.
  const t0 = new Date(createdAt).getTime();
  return DEFAULT_DOMAIN_NAMES.map((name, i) => ({ id: newId(), profileId, name, createdAt: new Date(t0 + i).toISOString(), archived: false }));
}

/**
 * Bảo đảm có cài đặt, có hồ sơ mặc định, hồ sơ đang dùng tồn tại, và hồ sơ đó
 * có lĩnh vực. Idempotent.
 */
export async function ensureSeeded(db: DinhViDB, now = new Date()): Promise<void> {
  await db.transaction('rw', db.domains, db.settings, db.profiles, async () => {
    const createdAt = now.toISOString();
    // Cài đặt từ bản cũ có thể thiếu trường mới (vd. activeProfileId): ghi bổ sung.
    const stored = await db.settings.get('settings');
    const settings: Settings = { ...DEFAULT_SETTINGS, ...stored };
    if (!stored || Object.keys(settings).some((k) => !(k in stored))) await db.settings.put(settings);
    if ((await db.profiles.count()) === 0)
      await db.profiles.add({ id: DEFAULT_PROFILE_ID, name: DEFAULT_PROFILE_NAME, createdAt });
    const active = settings.activeProfileId ?? DEFAULT_PROFILE_ID;
    if (!(await db.profiles.get(active))) {
      const first = await db.profiles.orderBy('createdAt').first();
      await db.settings.put({ ...settings, activeProfileId: first!.id });
    }
    const activeId = (await db.settings.get('settings'))!.activeProfileId ?? DEFAULT_PROFILE_ID;
    if ((await db.domains.where('profileId').equals(activeId).count()) === 0)
      await db.domains.bulkAdd(defaultDomains(activeId, createdAt));
  });
}

/** Tạo hồ sơ mới kèm 8 lĩnh vực mặc định. Trả về id hồ sơ. */
export async function createProfile(db: DinhViDB, name: string, now = new Date()): Promise<string> {
  const id = newId(now.getTime());
  const createdAt = now.toISOString();
  await db.transaction('rw', db.profiles, db.domains, async () => {
    await db.profiles.add({ id, name: name.trim(), createdAt });
    await db.domains.bulkAdd(defaultDomains(id, createdAt));
  });
  return id;
}

/** Xoá một hồ sơ cùng toàn bộ dữ liệu của nó. Không xoá được hồ sơ cuối cùng. */
export async function deleteProfile(db: DinhViDB, profileId: string): Promise<void> {
  await db.transaction('rw', [db.profiles, db.domains, db.positionings, db.drafts, db.casts, db.quickNotes, db.study, db.settings], async () => {
    if ((await db.profiles.count()) <= 1) throw new Error('Không xoá được hồ sơ cuối cùng.');
    await clearProfileData(db, profileId);
    await db.profiles.delete(profileId);
    const settings = await getSettings(db);
    if (settings.activeProfileId === profileId) {
      const first = await db.profiles.orderBy('createdAt').first();
      await db.settings.put({ ...settings, activeProfileId: first!.id });
    }
  });
}

/** Xoá dữ liệu của một hồ sơ (lĩnh vực, bản ghi, nháp, ghi nhanh, lần gieo, tiến độ học); giữ bản thân hồ sơ. */
export async function clearProfileData(db: DinhViDB, profileId: string): Promise<void> {
  const domainIds = await db.domains.where('profileId').equals(profileId).primaryKeys();
  await db.positionings.where('domainId').anyOf(domainIds).delete();
  await db.drafts.where('domainId').anyOf(domainIds).delete();
  await db.quickNotes.where('domainId').anyOf(domainIds).delete();
  await db.domains.bulkDelete(domainIds);
  await db.casts.where('profileId').equals(profileId).delete();
  await db.study.where('profileId').equals(profileId).delete();
}

/** Cài đặt, luôn đủ trường: cài đặt lưu từ bản cũ được trộn với giá trị mặc định. */
export async function getSettings(db: DinhViDB): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get('settings')) };
}

export async function setActiveProfile(db: DinhViDB, profileId: string): Promise<void> {
  const settings = await getSettings(db);
  await db.settings.put({ ...settings, activeProfileId: profileId });
  await ensureSeeded(db);
}

/** Dữ liệu của hồ sơ đang dùng: lĩnh vực và mọi thứ gắn với chúng. */
export async function activeProfileData(db: DinhViDB) {
  const settings = await getSettings(db);
  const profileId = settings.activeProfileId ?? DEFAULT_PROFILE_ID;
  const domains = await db.domains.where('profileId').equals(profileId).sortBy('createdAt');
  const ids = domains.map((d) => d.id);
  const [positionings, drafts, quickNotes] = await Promise.all([
    db.positionings.where('domainId').anyOf(ids).toArray(),
    db.drafts.where('domainId').anyOf(ids).toArray(),
    db.quickNotes.where('domainId').anyOf(ids).toArray(),
  ]);
  return { settings, profileId, domains, positionings, drafts, quickNotes };
}

export const db = new DinhViDB();
