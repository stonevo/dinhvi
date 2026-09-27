import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { FIREBASE_CONFIG } from './config';
import type { SyncStatus } from './engine';

type Engine = typeof import('./engine');
let enginePromise: Promise<Engine> | null = null;

/** Nạp Firebase (chỉ khi đã cấu hình) và bắt đầu theo dõi đăng nhập, thay đổi dữ liệu. */
export function loadEngine(): Promise<Engine> | null {
  if (!FIREBASE_CONFIG) return null;
  enginePromise ??= import('./engine').then((m) => {
    m.start();
    return m;
  });
  return enginePromise;
}

function useSync(): { engine: Engine | null; status: SyncStatus | null } {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  useEffect(() => {
    let off: (() => void) | undefined;
    let alive = true;
    loadEngine()?.then((m) => {
      if (!alive) return;
      setEngine(m);
      off = m.subscribe(setStatus);
    });
    return () => {
      alive = false;
      off?.();
    };
  }, []);
  return { engine, status };
}

/** Máy này đã từng đăng nhập đồng bộ (có trạng thái lưu): nạp ngay khi mở app để kiểm bản trên mây. */
export function startIfUsedBefore(): void {
  try {
    if (localStorage.getItem('dinhvi.sync')) void loadEngine();
  } catch {
    /* không đọc được thì chờ người dùng mở Cài đặt */
  }
}

const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

/** Mục "Đồng bộ đám mây" trong Cài đặt. Ẩn khi chưa cấu hình Firebase. */
export function CloudSyncSection() {
  const { engine, status } = useSync();
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
          {status.kind === 'idle' && <p className="muted small">{t('sync.lastSynced', { at: time(status.at) })}</p>}
          {status.kind === 'working' && <p className="muted small">{t('sync.working')}</p>}
          {status.kind === 'error' && <p className="warning">{t('sync.error', { message: status.message })}</p>}
          {status.kind === 'conflict' && (
            <div className="soft-warn stack">
              <p>{t('sync.conflict', { at: time(status.cloudAt) })}</p>
              <div className="row">
                <button type="button" onClick={() => void engine.resolveConflict('cloud')}>
                  {t('sync.keepCloud')}
                </button>
                <button type="button" onClick={() => void engine.resolveConflict('local')}>
                  {t('sync.keepLocal')}
                </button>
              </div>
            </div>
          )}
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
