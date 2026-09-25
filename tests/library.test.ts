import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Hexagram } from '../src/types/schema';
import { filterHexagrams, fold } from '../src/lib/library';

const hexagrams: Hexagram[] = JSON.parse(readFileSync(join(__dirname, '..', 'public', 'data', 'hexagrams.json'), 'utf8'));
const nums = (f: Parameters<typeof filterHexagrams>[1]) => filterHexagrams(hexagrams, f).map((h) => h.kingWenNumber);

describe('thư viện', () => {
  it('bỏ dấu khi tìm', () => {
    expect(fold('Truân Đỉnh')).toBe('truan dinh');
    expect(nums({ query: 'truan' })[0]).toBe(3); // khớp tên đứng trước khớp chủ đề
    expect(nums({ query: 'Thủy Lôi' })[0]).toBe(3); // cụm liền trong tên đứng trước (Lôi Thủy Giải vẫn khớp)
  });
  it('tìm theo số và chữ Hán', () => {
    expect(nums({ query: '64' })).toEqual([64]);
    expect(nums({ query: '屯' })).toEqual([3]);
  });
  it('lọc theo quái trên / dưới', () => {
    expect(nums({ upper: 'kan', lower: 'zhen' })).toEqual([3]);
    expect(nums({ upper: 'qian' })).toHaveLength(8);
  });
  it('lọc theo giai đoạn khớp dữ liệu', () => {
    const peak = nums({ stage: 'peak' });
    expect(peak.length).toBeGreaterThan(0);
    for (const n of peak) expect(hexagrams[n - 1].stageInCycle).toBe('peak');
  });
  it('không lọc gì → đủ 64', () => {
    expect(nums({})).toHaveLength(64);
  });
});
