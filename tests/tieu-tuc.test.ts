import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TIEU_TUC_HEXAGRAMS, monthHexagram } from '../src/lib/tieuTuc';

const hexagrams: { kingWenNumber: number; binary: string }[] = JSON.parse(readFileSync('public/data/hexagrams.json', 'utf8'));
const binaryOf = (n: number) => hexagrams.find((h) => h.kingWenNumber === n)!.binary;
/** Thời điểm theo giờ Việt Nam (UTC+7) → Date. */
const vn = (y: number, m: number, d: number, h = 12) => new Date(Date.UTC(y, m - 1, d, h - 7));

describe('quẻ tiêu tức', () => {
  it('Tý → Tỵ dương lớn dần từ dưới, Ngọ → Hợi âm lớn dần từ dưới', () => {
    const want = ['100000', '110000', '111000', '111100', '111110', '111111', '011111', '001111', '000111', '000011', '000001', '000000'];
    expect(TIEU_TUC_HEXAGRAMS.map(binaryOf)).toEqual(want);
  });

  it('tháng đổi theo tiết khí', () => {
    // Lập Xuân 2026 ≈ 4/2; Đông Chí nằm trong tháng Tý (từ Đại Tuyết ≈ 7/12).
    expect(monthHexagram(vn(2026, 2, 3)).branchName).toBe('Sửu');
    expect(monthHexagram(vn(2026, 2, 5))).toMatchObject({ branchName: 'Dần', hexagram: 11 });
    expect(monthHexagram(vn(2026, 12, 22))).toMatchObject({ branchName: 'Tý', hexagram: 24 });
    expect(monthHexagram(vn(2026, 6, 25))).toMatchObject({ branchName: 'Ngọ', hexagram: 44 });
  });
});

describe('ghi chú tháng', () => {
  it('đủ 12 câu', async () => {
    const { TIEU_TUC_NOTES } = await import('../src/lib/tieuTuc');
    expect(TIEU_TUC_NOTES).toHaveLength(12);
  });
});
