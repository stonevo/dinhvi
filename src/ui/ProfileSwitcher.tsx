import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings, setActiveProfile } from '../db/db';
import { t } from '../i18n';

/** Chọn hồ sơ đang dùng. Ẩn khi chỉ có một hồ sơ. */
export function ProfileSwitcher() {
  const q = useLiveQuery(async () => ({
    profiles: await db.profiles.orderBy('createdAt').toArray(),
    active: (await getSettings(db)).activeProfileId,
  }));
  if (!q || q.profiles.length < 2) return null;
  return (
    <select
      className="profile-switcher"
      aria-label={t('profile.label')}
      value={q.active}
      onChange={(e) => void setActiveProfile(db, e.target.value)}
    >
      {q.profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
