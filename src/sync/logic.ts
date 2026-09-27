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
