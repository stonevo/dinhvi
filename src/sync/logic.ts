// Phần thuần của đồng bộ đám mây (kiểm thử được, không phụ thuộc Firebase).
// Mỗi tài khoản lưu MỘT bản sao lưu đầy đủ (định dạng như file backup JSON), chia
// thành nhiều phần vì mỗi tài liệu Firestore tối đa 1 MiB.

/** Số ký tự tối đa mỗi phần (UTF-8 tối đa ~3 byte/ký tự tiếng Việt → dưới 1 MiB). */
export const PART_CHARS = 300_000;

export function splitParts(text: string, size = PART_CHARS): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
  return parts.length ? parts : [''];
}

export const joinParts = (parts: string[]) => parts.join('');

/** Trạng thái đồng bộ lưu trên từng máy. */
export type LocalSyncState = {
  /** Mốc `updatedAt` của bản trên mây mà dữ liệu máy này đang khớp (null: chưa đồng bộ lần nào). */
  syncedCloudAt: string | null;
  /** Máy này có thay đổi chưa tải lên. */
  dirty: boolean;
};

export type CloudMeta = { updatedAt: string; parts: number; deviceId: string } | null;

export type SyncAction =
  | { kind: 'none' }
  | { kind: 'upload' }
  | { kind: 'download' }
  /** Cả máy này lẫn bản trên mây đều đổi kể từ lần đồng bộ trước: hỏi người dùng. */
  | { kind: 'conflict' };

/** Việc cần làm khi so dữ liệu máy này với bản trên mây. */
export function decide(local: LocalSyncState, cloud: CloudMeta): SyncAction {
  if (!cloud) return { kind: 'upload' };
  const cloudChanged = cloud.updatedAt !== local.syncedCloudAt;
  if (!cloudChanged) return local.dirty ? { kind: 'upload' } : { kind: 'none' };
  // Máy mới (chưa đồng bộ lần nào) mà đã có dữ liệu riêng: cũng phải hỏi.
  if (local.dirty) return { kind: 'conflict' };
  return { kind: 'download' };
}

// ---------- Gộp ba chiều ----------

type Row = { id: string };
type Tables<B> = { [K in keyof B]: B[K] extends Row[] ? K : never }[keyof B];

/** So sánh không phụ thuộc thứ tự khoá. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (v && typeof v === 'object')
    return `{${Object.keys(v as object)
      .sort()
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  return JSON.stringify(v);
}

const same = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);

/** Mốc sửa của một bản ghi (nếu có) để chọn khi hai bên cùng sửa. */
function stamp(r: object | undefined): string {
  if (!r) return '';
  const o = r as Record<string, unknown>;
  for (const k of ['updatedAt', 'lastReviewed', 'createdAt']) if (typeof o[k] === 'string') return o[k] as string;
  return '';
}

export type MergeResult<T> = { merged: T[]; conflicts: number };

/**
 * Gộp một bảng theo id, so với bản chung lần đồng bộ trước (`base`):
 * chỉ một bên đổi (thêm, sửa, xoá) thì lấy bên đó; cả hai cùng đổi khác nhau thì lấy
 * bản có mốc sửa muộn hơn (bằng nhau thì lấy máy này), bên xoá thua bên sửa.
 */
export function mergeRows<T extends Row>(base: T[], local: T[], cloud: T[]): MergeResult<T> {
  const B = new Map(base.map((r) => [r.id, r]));
  const L = new Map(local.map((r) => [r.id, r]));
  const C = new Map(cloud.map((r) => [r.id, r]));
  const ids = [...new Set([...local.map((r) => r.id), ...cloud.map((r) => r.id)])];
  const merged: T[] = [];
  let conflicts = 0;
  for (const id of ids) {
    const b = B.get(id);
    const l = L.get(id);
    const c = C.get(id);
    let pick: T | undefined;
    if (same(l, c)) pick = l;
    else if (same(l, b)) pick = c;
    else if (same(c, b)) pick = l;
    else {
      conflicts++;
      if (!l) pick = c;
      else if (!c) pick = l;
      else pick = stamp(c) > stamp(l) ? c : l;
    }
    if (pick) merged.push(pick);
  }
  return { merged, conflicts };
}

/** Gộp cả bản sao lưu: các bảng theo id; cài đặt thì máy này đổi thì giữ máy này, không thì lấy mây. */
export function mergeBackups<B extends { settings: unknown }>(base: B, local: B, cloud: B, tables: Tables<B>[]): { merged: B; conflicts: number } {
  const merged = { ...local };
  let conflicts = 0;
  for (const t of tables) {
    const r = mergeRows(base[t] as Row[], local[t] as Row[], cloud[t] as Row[]);
    (merged as Record<string, unknown>)[t as string] = r.merged;
    conflicts += r.conflicts;
  }
  merged.settings = same(local.settings, base.settings) ? cloud.settings : local.settings;
  return { merged, conflicts };
}
