import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import { FIREBASE_CONFIG } from './config';
import type { SyncStatus } from './engine';

type Engine = typeof import('./engine');
let enginePromise: Promise<Engine> | null = null;
let engineRef: Engine | null = null;

// Trạng thái đồng bộ dùng chung cho mục Cài đặt và biểu tượng trên thanh menu.
let current: SyncStatus | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Nạp Firebase (chỉ khi đã cấu hình) và bắt đầu theo dõi đăng nhập, thay đổi dữ liệu. */
export function loadEngine(): Promise<Engine> | null {
  if (!FIREBASE_CONFIG) return null;
  enginePromise ??= import('./engine').then((m) => {
    m.start();
    engineRef = m;
    m.subscribe((s) => {
      current = s;
      emit();
    });
    return m;
  });
  return enginePromise;
}

/** Máy này đã từng đăng nhập đồng bộ (có trạng thái lưu): nạp ngay khi mở app để kiểm bản trên mây. */
export function startIfUsedBefore(): void {
  try {
    if (localStorage.getItem('dinhvi.sync')) void loadEngine();
  } catch {
    /* không đọc được thì chờ người dùng mở Cài đặt */
  }
}

/** Trạng thái đồng bộ hiện tại; `load` = nạp Firebase nếu chưa nạp. */
function useSync(load: boolean): { engine: Engine | null; status: SyncStatus | null } {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (load) loadEngine()?.then(l);
    return () => {
      listeners.delete(l);
    };
  }, [load]);
  return { engine: engineRef, status: current };
}

const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

/** Biểu tượng nhỏ trên thanh menu: đã lưu / đang lưu / cần chú ý. Chỉ hiện khi máy này đang dùng đồng bộ. */
export function SyncBadge() {
  const { status } = useSync(false);
  if (!status || status.kind === 'signedOut') return null;
  const [cls, text] =
    status.kind === 'working'
      ? ['working', t('sync.badge.working')]
      : status.kind === 'idle'
        ? ['ok', t('sync.badge.ok', { at: time(status.at) })]
        : ['alert', t('sync.badge.alert')];
  return (
    <Link to="/settings" className={`sync-badge ${cls}`} title={text} aria-label={text}>
      <span aria-hidden>{cls === 'working' ? '↻' : cls === 'ok' ? '☁' : '!'}</span>
    </Link>
  );
}

function PassForm({ label, submit, confirm }: { label: string; submit: (p: string) => Promise<string | null>; confirm?: boolean }) {
  const [p, setP] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (confirm && p !== p2) return setErr(t('sync.enc.mismatch'));
        if (p.length < 8) return setErr(t('sync.enc.short'));
        setBusy(true);
        setErr(await submit(p));
        setBusy(false);
      }}
    >
      <label className="field">
        <span className="small muted">{t('sync.enc.pass')}</span>
        <input type="password" autoComplete="new-password" value={p} onChange={(e) => setP(e.target.value)} />
      </label>
      {confirm && (
        <label className="field">
          <span className="small muted">{t('sync.enc.pass2')}</span>
          <input type="password" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} />
        </label>
      )}
      {err && <p className="warning small">{err}</p>}
      <div className="row">
        <button type="submit" className="primary" disabled={busy}>
          {label}
        </button>
      </div>
    </form>
  );
}

/** Phần mã hoá trong mục đồng bộ. */
function Encryption({ engine, on }: { engine: Engine; on: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="classic" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>{on ? t('sync.enc.on') : t('sync.enc.off')}</summary>
      <p className="small muted">{t('sync.enc.intro')}</p>
      <p className="small warning">{t('sync.enc.warn')}</p>
      <PassForm
        label={on ? t('sync.enc.change') : t('sync.enc.enable')}
        confirm
        submit={async (p) => {
          await engine.enableEncryption(p);
          setOpen(false);
          return null;
        }}
      />
      {on && (
        <div className="row">
          <button
            type="button"
            className="link"
            onClick={() => {
              if (window.confirm(t('sync.enc.disableConfirm'))) void engine.disableEncryption();
            }}
          >
            {t('sync.enc.disable')}
          </button>
        </div>
      )}
    </details>
  );
}

/** Mục "Đồng bộ đám mây" trong Cài đặt. Ẩn khi chưa cấu hình Firebase. */
export function CloudSyncSection() {
  const { engine, status } = useSync(true);
  if (!FIREBASE_CONFIG) return null;
  return (
    <section className="card stack">
      <h2>{t('sync.title')}</h2>
      <p className="muted small">{t('sync.intro')}</p>
      {!engine || !status ? (
        <p className="muted">{t('common.loading')}</p>
      ) : status.kind === 'signedOut' ? (
        <div className="row">
          <button type="button" className="primary" onClick={() => void engine.signIn()}>
            {t('sync.signIn')}
          </button>
        </div>
      ) : (
        <>
          {'user' in status && status.user && <p>{t('sync.signedInAs', { user: status.user })}</p>}
          {status.kind === 'idle' && (
            <p className="muted small">
              {t('sync.lastSynced', { at: time(status.at) })}
              {status.merged !== undefined && ` · ${status.merged ? t('sync.mergedConflicts', { n: status.merged }) : t('sync.merged')}`}
            </p>
          )}
          {status.kind === 'working' && <p className="muted small">{t('sync.working')}</p>}
          {status.kind === 'error' && <p className="warning">{t('sync.error', { message: status.message })}</p>}
          {status.kind === 'needKey' && (
            <div className="soft-warn stack">
              <p>{t('sync.enc.needKey')}</p>
              <PassForm label={t('sync.enc.unlock')} submit={async (p) => ((await engine.unlock(p)) ? null : t('sync.enc.wrong'))} />
              <button
                type="button"
                className="link"
                onClick={() => {
                  if (window.confirm(t('sync.enc.resetConfirm'))) void engine.resetCloudFromLocal();
                }}
              >
                {t('sync.enc.reset')}
              </button>
            </div>
          )}
          {status.kind === 'conflict' && (
            <div className="soft-warn stack">
              <p>{t('sync.conflict', { at: time(status.cloudAt) })}</p>
              <div className="row">
                <button type="button" className="primary" onClick={() => void engine.resolveConflict('both')}>
                  {t('sync.keepBoth')}
                </button>
                <button type="button" onClick={() => void engine.resolveConflict('cloud')}>
                  {t('sync.keepCloud')}
                </button>
                <button type="button" onClick={() => void engine.resolveConflict('local')}>
                  {t('sync.keepLocal')}
                </button>
              </div>
            </div>
          )}
          {status.kind !== 'needKey' && 'encrypted' in status && <Encryption engine={engine} on={status.encrypted} />}
          <div className="row">
            <button type="button" disabled={status.kind === 'working'} onClick={() => void engine.syncNow()}>
              {t('sync.now')}
            </button>
            <button type="button" className="link" onClick={() => void engine.signOutCloud()}>
              {t('sync.signOut')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
