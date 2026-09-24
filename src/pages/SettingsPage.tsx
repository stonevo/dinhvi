import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db/db';
import { BackupError, exportAll, importAll, parseBackup, serializeBackup } from '../db/backup';
import { t } from '../i18n';
import type { Settings } from '../types/schema';
import {
  notificationSupport, remindOnOpen, requestNotificationPermission, syncBackgroundReminder,
  type NotificationSupport,
} from '../lib/notifications';
import { THEMES, getTheme, setTheme, type Theme } from '../lib/theme';
import { ChoiceGroup } from '../ui/controls';

export function SettingsPage() {
  const settings = useLiveQuery(() => getSettings(db));
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationSupport>(notificationSupport());
  const [theme, setThemeState] = useState<Theme>(getTheme());

  if (!settings) return <p className="muted">{t('common.loading')}</p>;

  const patch = (p: Partial<Settings>) => db.settings.put({ ...settings, ...p });

  async function toggleNotifications() {
    if (settings!.notificationsEnabled) {
      await patch({ notificationsEnabled: false });
      await syncBackgroundReminder(false);
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result !== 'granted') return;
    await patch({ notificationsEnabled: true });
    await syncBackgroundReminder(true);
    await remindOnOpen();
  }

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

      <ChoiceGroup
        label={t('settings.theme')}
        options={THEMES.map((v) => ({ value: v, label: t(`settings.theme.${v}`) }))}
        value={theme}
        onChange={(v) => {
          setTheme(v);
          setThemeState(v);
        }}
      />

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
        <span className="muted small">{t('settings.reminderDay.hint')}</span>
      </label>

      <h2>{t('settings.notifications')}</h2>
      {permission === 'unsupported' ? (
        <p className="muted">{t('settings.notifications.unsupported')}</p>
      ) : (
        <>
          <div className="row">
            <button type="button" onClick={toggleNotifications} aria-pressed={settings.notificationsEnabled}>
              {settings.notificationsEnabled ? t('settings.notifications.disable') : t('settings.notifications.enable')}
            </button>
          </div>
          {permission === 'denied' && <p className="soft-warn">{t('settings.notifications.denied')}</p>}
          <p className="muted small">{t('settings.notifications.hint')}</p>
        </>
      )}

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
