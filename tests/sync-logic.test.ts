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
