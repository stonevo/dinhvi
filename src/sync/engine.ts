// Đồng bộ đám mây bằng Firebase (đăng nhập Google + Firestore). Module này chỉ được
// nạp động khi cần (xem CloudSync.tsx), nên bản offline không phải tải Firebase.
//
// Dữ liệu: users/{uid}/backup/meta { updatedAt, parts, deviceId, enc? } và
// users/{uid}/backup/part-0 … part-(n-1) { text }. `text` là bản sao lưu JSON, hoặc bản
// mã hoá AES-GCM của nó nếu người dùng bật mã hoá. Luật Firestore chỉ cho chủ tài khoản
// đọc/ghi nhánh users/{uid} (xem firestore.rules).
//
// Hai máy cùng sửa: gộp ba chiều theo từng bản ghi, so với bản chung lần đồng bộ trước
// (lưu trên máy trong IndexedDB "dinhvi-sync"). Máy chưa từng đồng bộ mà đã có dữ liệu
// riêng thì hỏi người dùng.
import Dexie, { type Table } from 'dexie';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc, getFirestore, writeBatch } from 'firebase/firestore';
import { db } from '../db/db';
import { exportAll, importAll, parseBackup, serializeBackup } from '../db/backup';
import type { Backup } from '../types/schema';
import { FIREBASE_CONFIG } from './config';
import { decryptText, encryptText, newKey, unlockKey, type EncInfo } from './crypto';
import { decide, joinParts, mergeBackups, splitParts, type LocalSyncState } from './logic';

export type SyncStatus =
  | { kind: 'signedOut' }
  | { kind: 'idle'; user: string; at: string | null; encrypted: boolean; merged?: number }
  | { kind: 'working'; user: string; encrypted: boolean }
  | { kind: 'conflict'; user: string; cloudAt: string; encrypted: boolean }
  /** Bản trên mây đã mã hoá mà máy này chưa có khoá: cần nhập mật khẩu. */
  | { kind: 'needKey'; user: string }
  | { kind: 'error'; user: string | null; message: string; encrypted: boolean };

type Meta = { updatedAt: string; parts: number; deviceId: string; enc?: EncInfo };

const STATE_KEY = 'dinhvi.sync';
const DEVICE_KEY = 'dinhvi.device';
const UPLOAD_DELAY = 20_000;
const TABLES = ['profiles', 'domains', 'positionings', 'drafts', 'casts', 'quickNotes', 'study'] as const;

const app = initializeApp(FIREBASE_CONFIG!);
const auth = getAuth(app);
const store = getFirestore(app);

/** Kho riêng trên máy: bản chung lần đồng bộ trước và khoá mã hoá (CryptoKey không xuất được). */
class SyncDB extends Dexie {
  kv!: Table<unknown, string>;
  constructor() {
    super('dinhvi-sync');
    this.version(1).stores({ kv: '' });
  }
}
const kv = new SyncDB().kv;

let status: SyncStatus = { kind: 'signedOut' };
const listeners = new Set<(s: SyncStatus) => void>();
let user: User | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;
let running: Promise<void> | null = null;
let key: CryptoKey | null = null;
let keyInfo: EncInfo | null = null;

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

async function readMeta(uid: string): Promise<Meta | null> {
  const snap = await getDoc(metaRef(uid));
  return snap.exists() ? (snap.data() as Meta) : null;
}

async function readCloudBackup(uid: string, meta: Meta): Promise<Backup> {
  const snaps = await Promise.all(Array.from({ length: meta.parts }, (_, i) => getDoc(partRef(uid, i))));
  let text = joinParts(snaps.map((s) => (s.data()?.text as string | undefined) ?? ''));
  if (meta.enc) {
    if (!key) throw new NeedKey();
    text = await decryptText(text, key);
  }
  return parseBackup(text);
}

class NeedKey extends Error {}

async function saveBase(backup: Backup) {
  await kv.put(serializeBackup(backup), 'base');
}

async function loadBase(): Promise<Backup | null> {
  const text = (await kv.get('base')) as string | undefined;
  if (!text) return null;
  try {
    return parseBackup(text);
  } catch {
    return null;
  }
}

async function uploadBackup(uid: string, backup: Backup, prev: Meta | null) {
  let text = serializeBackup(backup);
  if (key && keyInfo) text = await encryptText(text, key);
  const parts = splitParts(text);
  const updatedAt = new Date().toISOString();
  const batch = writeBatch(store);
  parts.forEach((p, i) => batch.set(partRef(uid, i), { text: p }));
  for (let i = parts.length; i < (prev?.parts ?? 0); i++) batch.delete(partRef(uid, i));
  const meta: Meta = { updatedAt, parts: parts.length, deviceId: deviceId(), ...(key && keyInfo ? { enc: keyInfo } : {}) };
  batch.set(metaRef(uid), meta);
  await batch.commit();
  await saveBase(backup);
  writeState({ syncedCloudAt: updatedAt, dirty: false });
}

async function applyLocal(backup: Backup) {
  applyingRemote = true;
  try {
    await importAll(db, backup);
  } finally {
    applyingRemote = false;
  }
}

function label(u: User) {
  return u.email ?? u.displayName ?? 'Google';
}

const encrypted = () => Boolean(key && keyInfo);

function fail(u: User | null, e: unknown) {
  if (e instanceof NeedKey && u) setStatus({ kind: 'needKey', user: label(u) });
  else setStatus({ kind: 'error', user: u ? label(u) : null, message: e instanceof Error ? e.message : String(e), encrypted: encrypted() });
}

/** Bản trên mây đã mã hoá (hoặc đã tắt mã hoá) theo khoá khác máy này: cập nhật khoá. */
async function syncKeyWith(meta: Meta | null) {
  if (!meta) return;
  if (!meta.enc) {
    // Máy khác đã tắt mã hoá.
    if (key) {
      key = null;
      keyInfo = null;
      await kv.delete('key');
      await kv.delete('keyInfo');
    }
    return;
  }
  if (!keyInfo || keyInfo.salt !== meta.enc.salt) {
    key = null;
    keyInfo = null;
    throw new NeedKey();
  }
}

/** So máy này với bản trên mây rồi làm việc cần làm (không chạy chồng). */
export function syncNow(): Promise<void> {
  if (!user) return Promise.resolve();
  running ??= (async () => {
    const u = user!;
    setStatus({ kind: 'working', user: label(u), encrypted: encrypted() });
    try {
      const local = readState() ?? (await initialState());
      writeState(local);
      const meta = await readMeta(u.uid);
      await syncKeyWith(meta);
      const action = decide(local, meta);
      let merged: number | undefined;
      if (action.kind === 'upload') await uploadBackup(u.uid, await exportAll(db), meta);
      else if (action.kind === 'download') {
        const cloud = await readCloudBackup(u.uid, meta!);
        await applyLocal(cloud);
        await saveBase(cloud);
        writeState({ syncedCloudAt: meta!.updatedAt, dirty: false });
      } else if (action.kind === 'conflict') {
        const base = await loadBase();
        if (!base) {
          // Máy chưa từng đồng bộ mà đã có dữ liệu riêng: để người dùng chọn.
          setStatus({ kind: 'conflict', user: label(u), cloudAt: meta!.updatedAt, encrypted: encrypted() });
          return;
        }
        const cloud = await readCloudBackup(u.uid, meta!);
        const r = mergeBackups(base, await exportAll(db), cloud, [...TABLES]);
        await applyLocal(r.merged);
        await uploadBackup(u.uid, r.merged, meta);
        merged = r.conflicts;
      }
      setStatus({ kind: 'idle', user: label(u), at: readState()?.syncedCloudAt ?? null, encrypted: encrypted(), merged });
    } catch (e) {
      fail(u, e);
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

/**
 * Máy chưa từng đồng bộ mà đã có dữ liệu riêng: giữ bản trên máy này (ghi đè mây), bản
 * trên mây (thay dữ liệu máy này), hoặc gộp cả hai (giữ mọi bản ghi của hai bên).
 */
export async function resolveConflict(keep: 'local' | 'cloud' | 'both'): Promise<void> {
  if (!user) return;
  const u = user;
  setStatus({ kind: 'working', user: label(u), encrypted: encrypted() });
  try {
    const meta = await readMeta(u.uid);
    await syncKeyWith(meta);
    if (keep === 'local' || !meta) await uploadBackup(u.uid, await exportAll(db), meta);
    else {
      const cloud = await readCloudBackup(u.uid, meta);
      const result = keep === 'cloud' ? cloud : mergeBackups({ ...cloud, ...emptyTables() }, await exportAll(db), cloud, [...TABLES]).merged;
      await applyLocal(result);
      if (keep === 'cloud') {
        await saveBase(cloud);
        writeState({ syncedCloudAt: meta.updatedAt, dirty: false });
      } else await uploadBackup(u.uid, result, meta);
    }
    setStatus({ kind: 'idle', user: label(u), at: readState()?.syncedCloudAt ?? null, encrypted: encrypted() });
  } catch (e) {
    fail(u, e);
  }
}

function emptyTables() {
  return Object.fromEntries(TABLES.map((t) => [t, []])) as unknown as Pick<Backup, (typeof TABLES)[number]>;
}

// ---------- Mã hoá ----------

/** Bật mã hoá (hoặc đổi mật khẩu): tạo khoá mới rồi tải lên bản đã mã hoá. */
export async function enableEncryption(passphrase: string): Promise<void> {
  const r = await newKey(passphrase);
  key = r.key;
  keyInfo = r.info;
  await kv.put(key, 'key');
  await kv.put(keyInfo, 'keyInfo');
  await forceUpload();
}

/** Nhập mật khẩu để mở bản trên mây đã mã hoá. Trả false nếu sai mật khẩu. */
export async function unlock(passphrase: string): Promise<boolean> {
  if (!user) return false;
  const meta = await readMeta(user.uid);
  if (!meta?.enc) return true;
  const k = await unlockKey(passphrase, meta.enc);
  if (!k) return false;
  key = k;
  keyInfo = meta.enc;
  await kv.put(key, 'key');
  await kv.put(keyInfo, 'keyInfo');
  await syncNow();
  return true;
}

/** Tắt mã hoá: tải lên bản không mã hoá. */
export async function disableEncryption(): Promise<void> {
  key = null;
  keyInfo = null;
  await kv.delete('key');
  await kv.delete('keyInfo');
  await forceUpload();
}

/** Quên mật khẩu: bỏ bản trên mây, tải lên dữ liệu của máy này (không mã hoá). */
export async function resetCloudFromLocal(): Promise<void> {
  await disableEncryption();
}

async function forceUpload() {
  if (!user) return;
  const u = user;
  setStatus({ kind: 'working', user: label(u), encrypted: encrypted() });
  try {
    await uploadBackup(u.uid, await exportAll(db), await readMeta(u.uid));
    setStatus({ kind: 'idle', user: label(u), at: readState()?.syncedCloudAt ?? null, encrypted: encrypted() });
  } catch (e) {
    fail(u, e);
  }
}

// ---------- Đăng nhập ----------

export async function signIn(): Promise<void> {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    fail(null, e);
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
  void (async () => {
    key = ((await kv.get('key')) as CryptoKey | undefined) ?? null;
    keyInfo = ((await kv.get('keyInfo')) as EncInfo | undefined) ?? null;
    onAuthStateChanged(auth, (u) => {
      user = u;
      if (u) void syncNow();
      else setStatus({ kind: 'signedOut' });
    });
  })();
  // Quay lại app (chuyển tab, mở lại trên điện thoại): kiểm bản trên mây.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
}
