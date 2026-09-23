import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { BackupError, exportAll, importAll, parseBackup, serializeBackup } from '../db/backup';
import { t } from '../i18n';
import type { Settings } from '../types/schema';

export function SettingsPage() {
  const settings = useLiveQuery(() => getSettings(db));
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!settings) return <p className="muted">{t('common.loading')}</p>;

  const patch = (p: Partial<Settings>) => db.settings.put({ ...settings, ...p });

  async function doExport() {
    const text = serializeBackup(await exportAll(db));
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `dinhvi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport(file: File) {
    try {
      const backup = parseBackup(await file.text());
      if (!window.confirm(t('settings.import.confirm'))) return;
      await importAll(db, backup);
      setMessage(t('settings.import.done', { domains: backup.domains.length, positionings: backup.positionings.length }));
    } catch (err) {
      setMessage(err instanceof BackupError ? err.message : String(err));
    }
  }

  return (
    <section className="stack">
      <h1>{t('nav.settings')}</h1>

      <label className="field">
        <span>{t('settings.cycle')}</span>
        <select value={settings.cycle} onChange={(e) => patch({ cycle: e.target.value as Settings['cycle'] })}>
          <option value="quarter">{t('settings.cycle.quarter')}</option>
          <option value="month">{t('settings.cycle.month')}</option>
        </select>
      </label>

      <label className="field">
        <span>{t('settings.reminderDay')}</span>
        <input
          type="number"
          min={1}
          max={28}
          value={settings.reminderDay}
          onChange={(e) => patch({ reminderDay: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })}
        />
      </label>

      <h2>{t('settings.backup')}</h2>
      <p className="muted">{t('settings.backup.hint')}</p>
      <div className="row">
        <button onClick={doExport}>{t('settings.export')}</button>
        <button onClick={() => fileRef.current?.click()}>{t('settings.import')}</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = '';
          }}
        />
      </div>
      {message && <p className="note">{message}</p>}
      <p className="muted small">{t('settings.privacy')}</p>
    </section>
  );
}
