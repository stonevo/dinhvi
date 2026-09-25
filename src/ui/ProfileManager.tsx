import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { createProfile, db, deleteProfile, getSettings, setActiveProfile } from '../db/db';
import { exportProfile, serializeBackup } from '../db/backup';
import { t } from '../i18n';
import { downloadText } from '../lib/download';

/** Quản lý hồ sơ trong Cài đặt: thêm, đổi tên, dùng, xuất riêng, xoá. */
export function ProfileManager() {
  const q = useLiveQuery(async () => ({
    profiles: await db.profiles.orderBy('createdAt').toArray(),
    active: (await getSettings(db)).activeProfileId,
  }));
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!q) return null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = await createProfile(db, name);
    await setActiveProfile(db, id);
    setName('');
  }

  async function exportOne(id: string, profileName: string) {
    const text = serializeBackup(await exportProfile(db, id));
    downloadText(`dinhvi-${profileName}-${new Date().toISOString().slice(0, 10)}.json`, text, 'application/json');
  }

  return (
    <div className="stack">
      <p className="muted small">{t('profile.hint')}</p>
      <ul className="domain-list">
        {q.profiles.map((p) => (
          <li key={p.id} className="domain">
            <span className="domain-name">
              {p.name}
              {p.id === q.active && <span className="muted small"> · {t('profile.active')}</span>}
            </span>
            {p.id !== q.active ? (
              <button type="button" className="link" onClick={() => void setActiveProfile(db, p.id)}>
                {t('profile.use')}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="link"
              onClick={() => {
                const next = window.prompt(t('profile.rename'), p.name)?.trim();
                if (next) void db.profiles.update(p.id, { name: next });
              }}
            >
              {t('profile.rename')}
            </button>
            <span className="row-inline">
              <button type="button" className="link" onClick={() => void exportOne(p.id, p.name)}>
                {t('profile.export')}
              </button>
              {q.profiles.length > 1 && (
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    if (!window.confirm(t('profile.delete.confirm', { name: p.name }))) return;
                    deleteProfile(db, p.id).catch((err: unknown) => setError(String(err instanceof Error ? err.message : err)));
                  }}
                >
                  {t('profile.delete')}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <form className="row" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('profile.namePlaceholder')} aria-label={t('profile.namePlaceholder')} />
        <button type="submit">{t('profile.add')}</button>
      </form>
      {error && <p className="warning">{error}</p>}
    </div>
  );
}
