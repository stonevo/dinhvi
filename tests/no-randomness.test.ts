import { describe, expect, it } from 'vitest';
import { newId } from '../src/lib/id';

// ID bản ghi dựa trên thời gian + bộ đếm (không ngẫu nhiên) để thứ tự tạo luôn
// suy ra được từ ID. Phép gieo quẻ dùng nguồn ngẫu nhiên riêng ở src/lib/cast.ts.
describe('newId', () => {
  it('xác định và duy nhất trong cùng mili giây', () => {
    const ids = [newId(1000), newId(1000), newId(1000), newId(1001)];
    expect(new Set(ids).size).toBe(4);
    expect(ids[3]).toBe(`${(1001).toString(36)}-000`);
  });
});
