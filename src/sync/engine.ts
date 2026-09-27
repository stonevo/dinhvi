// Đồng bộ đám mây bằng Firebase (đăng nhập Google + Firestore). Module này chỉ được
// nạp động khi FIREBASE_CONFIG khác null, nên bản offline không phải tải Firebase.
//
// Dữ liệu: users/{uid}/backup/meta { updatedAt, parts, deviceId } và
// users/{uid}/backup/part-0 … part-(n-1) { text }. Luật Firestore chỉ cho chủ tài khoản
// đọc/ghi nhánh users/{uid} (xem firestore.rules).
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, writeBatch } from 'firebase/firestore';
import { db } from '../db/db';
import { exportAll, importAll, parseBackup, serializeBackup } from '../db/backup';
import { FIREBASE_CONFIG } from './config';
import { decide, joinParts, splitParts, type CloudMeta, type LocalSyncState } from './logic';

export type SyncStatus =
  | { kind: 'signedOut' }
  | { kind: 'idle'; user: string; at: string | null }
  | { kind: 'working'; user: string }
  | { kind: 'conflict'; user: string; cloudAt: string }
  | { kind: 'error'; user: string | null; message: string };

const STATE_KEY = 'dinhvi.sync';
const DEVICE_KEY = 'dinhvi.device';
const UPLOAD_DELAY = 20_000;

const app = initializeApp(FIREBASE_CONFIG!);
const auth = getAuth(app);
const store = getFirestore(app);

let status: SyncStatus = { kind: 'signedOut' };
const listeners = new Set<(s: SyncStatus) => void>();
let user: User | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;
let running: Promise<void> | null = null;

function setStatus(s: SyncStatus) {
  status = s;
  listeners.forEach((l) => l(s));
}

export function subscribe(l: (s: SyncStatus) => void): () => void {
  listeners.add(l);
  l(status);
  return () => listeners.delete(l);
}

function readState(): LocalSyncState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as LocalSyncState) : null;
  } catch {
    return null;
  }
}

function writeState(s: LocalSyncState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    /* không lưu được thì lần sau hỏi lại */
  }
}

function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

/** Máy chưa từng đồng bộ: coi là "có thay đổi" nếu đã có dữ liệu người dùng tự ghi. */
async function initialState(): Promise<LocalSyncState> {
  const counts = await Promise.all([db.positionings.count(), db.casts.count(), db.quickNotes.count(), db.study.count(), db.drafts.count()]);
  return { syncedCloudAt: null, dirty: counts.some((n) => n > 0) };
}

const metaRef = (uid: string) => doc(store, 'users', uid, 'backup', 'meta');
const partRef = (uid: string, i: number) => doc(store, 'users', uid, 'backup', `part-${i}`);

async function readMeta(uid: string): Promise<CloudMeta> {
  const snap = await getDoc(metaRef(uid));
  return snap.exists() ? (snap.data() as NonNullable<CloudMeta>) : null;
}

async function upload(uid: string, prev: CloudMeta) {
  const text = serializeBackup(await exportAll(db));
  const parts = splitParts(text);
  const updatedAt = new Date().toISOString();
  const batch = writeBatch(store);
  parts.forEach((p, i) => batch.set(partRef(uid, i), { text: p }));
  for (let i = parts.length; i < (prev?.parts ?? 0); i++) batch.delete(partRef(uid, i));
  batch.set(metaRef(uid), { updatedAt, parts: parts.length, deviceId: deviceId() });
  await batch.commit();
  writeState({ syncedCloudAt: updatedAt, dirty: false });
}

async function download(uid: string, meta: NonNullable<CloudMeta>) {
  const snaps = await Promise.all(Array.from({ length: meta.parts }, (_, i) => getDoc(partRef(uid, i))));
  const text = joinParts(snaps.map((s) => (s.data()?.text as string | undefined) ?? ''));
  const backup = parseBackup(text);
  applyingRemote = true;
  try {
    await importAll(db, backup);
  } finally {
    applyingRemote = false;
  }
  writeState({ syncedCloudAt: meta.updatedAt, dirty: false });
}

function label(u: User) {
  return u.email ?? u.displayName ?? 'Google';
}

/** So máy này với bản trên mây rồi làm việc cần làm (không chạy chồng). */
export function syncNow(): Promise<void> {
  if (!user) return Promise.resolve();
  running ??= (async () => {
    const u = user!;
    setStatus({ kind: 'working', user: label(u) });
    try {
      const local = readState() ?? (await initialState());
      writeState(local);
      const meta = await readMeta(u.uid);
      const action = decide(local, meta);
      if (action.kind === 'upload') await upload(u.uid, meta);
      else if (action.kind === 'download') await download(u.uid, meta!);
      else if (action.kind === 'conflict') {
        setStatus({ kind: 'conflict', user: label(u), cloudAt: meta!.updatedAt });
        return;
      }
      setStatus({ kind: 'idle', user: label(u), at: readState()?.syncedCloudAt ?? null });
    } catch (e) {
      setStatus({ kind: 'error', user: label(u), message: e instanceof Error ? e.message : String(e) });
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

/** Giải quyết xung đột: giữ bản trên máy này (ghi đè mây) hoặc bản trên mây (thay dữ liệu máy này). */
export async function resolveConflict(keep: 'local' | 'cloud'): Promise<void> {
  if (!user) return;
  const u = user;
  setStatus({ kind: 'working', user: label(u) });
  try {
    const meta = await readMeta(u.uid);
    if (keep === 'local' || !meta) await upload(u.uid, meta);
    else await download(u.uid, meta);
    setStatus({ kind: 'idle', user: label(u), at: readState()?.syncedCloudAt ?? null });
  } catch (e) {
    setStatus({ kind: 'error', user: label(u), message: e instanceof Error ? e.message : String(e) });
  }
}

export async function signIn(): Promise<void> {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    setStatus({ kind: 'error', user: null, message: e instanceof Error ? e.message : String(e) });
  }
}

export async function signOutCloud(): Promise<void> {
  clearTimeout(timer);
  await signOut(auth);
}

/** Có thay đổi trên máy: đánh dấu và hẹn tải lên. */
function markDirty() {
  if (applyingRemote) return;
  const s = readState();
  if (s && !s.dirty) writeState({ ...s, dirty: true });
  if (!user) return;
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), UPLOAD_DELAY);
}

let started = false;

export function start(): void {
  if (started) return;
  started = true;
  for (const table of db.tables) {
    table.hook('creating', () => void queueMicrotask(markDirty));
    table.hook('updating', () => void queueMicrotask(markDirty));
    table.hook('deleting', () => void queueMicrotask(markDirty));
  }
  onAuthStateChanged(auth, (u) => {
    user = u;
    if (u) void syncNow();
    else setStatus({ kind: 'signedOut' });
  });
  // Quay lại app (chuyển tab, mở lại trên điện thoại): kiểm bản trên mây.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
}
