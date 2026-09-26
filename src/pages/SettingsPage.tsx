import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db, getSettings } from '../db/db';
import { BackupError, exportAll, importAll, importProfiles, parseBackup, serializeBackup } from '../db/backup';
import { downloadText } from '../lib/download';
import { ProfileManager } from '../ui/ProfileManager';
import { t } from '../i18n';
import type { Settings } from '../types/schema';
import {
  notificationSupport, remindOnOpen, requestNotificationPermission, syncBackgroundReminder,
  type NotificationSupport,
} from '../lib/notifications';
import { THEMES, setTheme, useTheme } from '../lib/theme';
import { ChoiceGroup } from '../ui/controls';

export function SettingsPage() {
  const settings = useLiveQuery(() => getSettings(db));
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationSupport>(notificationSupport());
  const theme = useTheme();

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
    downloadText(`dinhvi-${new Date().toISOString().slice(0, 10)}.json`, text, 'application/json');
  }

  async function doImport(file: File) {
    try {
      const backup = parseBackup(await file.text());
      if (backup.scope === 'profile') {
        const names = backup.profiles.map((p) => p.name).join(', ');
        if (!window.confirm(t('settings.import.profileConfirm', { names }))) return;
        await importProfiles(db, backup);
        setMessage(t('settings.import.profileDone', { names }));
        return;
      }
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

      <h2>{t('profile.title')}</h2>
      <ProfileManager />

      <h2>{t('settings.display')}</h2>

      <ChoiceGroup
        label={t('settings.theme')}
        options={THEMES.map((v) => ({ value: v, label: t(`settings.theme.${v}`) }))}
        value={theme}
        onChange={setTheme}
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

      <h2>{t('settings.cast')}</h2>
      <label className="row-inline">
        <input type="checkbox" checked={settings.castSound ?? true} onChange={(e) => patch({ castSound: e.target.checked })} /> {t('settings.castSound')}
      </label>
      <label className="row-inline">
        <input type="checkbox" checked={settings.ziStartsNextDay ?? true} onChange={(e) => patch({ ziStartsNextDay: e.target.checked })} />{' '}
        {t('settings.ziStartsNextDay')}
      </label>
      <p className="muted small">{t('settings.ziStartsNextDay.hint')}</p>

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
      <p className="small">
        <Link to="/welcome">{t('welcome.again')}</Link>
      </p>
      <p className="muted small">{t('settings.privacy')}</p>
    </section>
  );
}
