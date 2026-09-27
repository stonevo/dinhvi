import { describe, expect, it } from 'vitest';
import { decide, joinParts, splitParts } from '../src/sync/logic';

describe('đồng bộ: chia phần', () => {
  it('chia rồi ghép lại đúng nguyên văn', () => {
    const text = 'Định Vị '.repeat(100_000);
    const parts = splitParts(text, 300_000);
    expect(parts.length).toBe(3);
    expect(joinParts(parts)).toBe(text);
    expect(splitParts('')).toEqual(['']);
  });
});

describe('đồng bộ: quyết định', () => {
  const cloud = (updatedAt: string) => ({ updatedAt, parts: 1, deviceId: 'x' });
  it('mây trống thì tải lên', () => expect(decide({ syncedCloudAt: null, dirty: false }, null).kind).toBe('upload'));
  it('khớp, máy không đổi thì thôi; máy đổi thì tải lên', () => {
    expect(decide({ syncedCloudAt: 'a', dirty: false }, cloud('a')).kind).toBe('none');
    expect(decide({ syncedCloudAt: 'a', dirty: true }, cloud('a')).kind).toBe('upload');
  });
  it('mây mới hơn: máy không đổi thì tải về, máy cũng đổi thì hỏi', () => {
    expect(decide({ syncedCloudAt: 'a', dirty: false }, cloud('b')).kind).toBe('download');
    expect(decide({ syncedCloudAt: 'a', dirty: true }, cloud('b')).kind).toBe('conflict');
  });
  it('máy mới chưa đồng bộ: trống thì tải về, có dữ liệu riêng thì hỏi', () => {
    expect(decide({ syncedCloudAt: null, dirty: false }, cloud('b')).kind).toBe('download');
    expect(decide({ syncedCloudAt: null, dirty: true }, cloud('b')).kind).toBe('conflict');
  });
});

describe('đồng bộ: gộp ba chiều', async () => {
  const { mergeRows, mergeBackups } = await import('../src/sync/logic');
  const r = (id: string, v: string, updatedAt?: string) => ({ id, v, ...(updatedAt ? { updatedAt } : {}) });
  it('mỗi bên thêm, sửa, xoá khác bản ghi thì gộp đủ', () => {
    const base = [r('a', '1'), r('b', '1'), r('c', '1')];
    const local = [r('a', '2'), r('b', '1'), r('d', 'local')]; // sửa a, xoá c, thêm d
    const cloud = [r('a', '1'), r('b', '3'), r('c', '1'), r('e', 'cloud')]; // sửa b, thêm e
    const { merged, conflicts } = mergeRows(base, local, cloud);
    expect(conflicts).toBe(0);
    expect(merged.map((x) => `${x.id}${x.v}`).sort()).toEqual(['a2', 'b3', 'dlocal', 'ecloud']);
  });
  it('hai bên cùng sửa một bản ghi: lấy bản sửa muộn hơn; xoá thua sửa', () => {
    const base = [r('a', '1', '2026-01-01'), r('b', '1')];
    const local = [r('a', 'L', '2026-02-01')];
    const cloud = [r('a', 'C', '2026-03-01'), r('b', '2')];
    const { merged, conflicts } = mergeRows(base, local, cloud);
    expect(conflicts).toBe(2);
    expect(merged.map((x) => `${x.id}${x.v}`).sort()).toEqual(['aC', 'b2']);
  });
  it('cài đặt: máy này đổi thì giữ máy này', () => {
    const b = { settings: { t: 1 }, rows: [] as { id: string }[] };
    expect(mergeBackups(b, { ...b, settings: { t: 2 } }, { ...b, settings: { t: 3 } }, ['rows']).merged.settings).toEqual({ t: 2 });
    expect(mergeBackups(b, b, { ...b, settings: { t: 3 } }, ['rows']).merged.settings).toEqual({ t: 3 });
  });
});
