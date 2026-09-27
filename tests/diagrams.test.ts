import { describe, expect, it } from 'vitest';
import {
  DIRECTION_ANGLE, HOUTIAN_DIRECTION, LUOSHU, XIANTIAN_DIRECTION, XIANTIAN_ORDER,
  binaryOfFuxi, circleAngle, fuxiIndex, squareIndex,
} from '../src/lib/diagrams';
import { TRIGRAM_BINARY, hexagramFromBinary } from '../src/lib/iching';

describe('đồ hình', () => {
  it('thứ tự Phục Hy: tám quẻ đầu cùng quái dưới Càn, quái trên theo thứ tự Tiên thiên', () => {
    for (let k = 0; k < 8; k++) {
      expect(binaryOfFuxi(k + 1)).toBe(TRIGRAM_BINARY.qian + TRIGRAM_BINARY[XIANTIAN_ORDER[k]]);
    }
    expect(hexagramFromBinary(binaryOfFuxi(1))).toBe(1); // Càn
    expect(hexagramFromBinary(binaryOfFuxi(64))).toBe(2); // Khôn
    expect(hexagramFromBinary(binaryOfFuxi(32))).toBe(24); // Phục
    expect(hexagramFromBinary(binaryOfFuxi(33))).toBe(44); // Cấu
  });

  it('fuxiIndex và binaryOfFuxi ngược nhau', () => {
    for (let i = 1; i <= 64; i++) expect(fuxiIndex(binaryOfFuxi(i))).toBe(i);
  });

  it('vòng tròn: Càn, Cấu ở đỉnh; Phục, Khôn ở đáy; nửa đầu bên trái (Đông)', () => {
    const x = (i: number) => Math.cos((circleAngle(i) * Math.PI) / 180);
    const y = (i: number) => Math.sin((circleAngle(i) * Math.PI) / 180);
    expect(y(1)).toBeLessThan(-0.99);
    expect(y(33)).toBeLessThan(-0.99);
    expect(y(32)).toBeGreaterThan(0.99);
    expect(y(64)).toBeGreaterThan(0.99);
    for (let i = 2; i <= 31; i++) expect(x(i)).toBeLessThan(0);
    for (let i = 34; i <= 63; i++) expect(x(i)).toBeGreaterThan(0);
  });

  it('hình vuông dùng đủ 64 quẻ một lần', () => {
    const seen = new Set<number>();
    for (let r = 1; r <= 8; r++) for (let c = 1; c <= 8; c++) seen.add(squareIndex(r, c));
    expect(seen.size).toBe(64);
  });

  it('phương vị: mỗi quái một phương, không trùng', () => {
    expect(new Set(Object.values(XIANTIAN_DIRECTION)).size).toBe(8);
    expect(new Set(Object.values(HOUTIAN_DIRECTION)).size).toBe(8);
    expect(DIRECTION_ANGLE.S).toBe(-90); // Nam ở trên
    expect(DIRECTION_ANGLE.E).toBe(180); // Đông bên trái
  });

  it('Lạc thư: ô vuông kỳ ảo, mỗi hàng, cột, chéo cộng 15', () => {
    const sums = [
      ...LUOSHU.map((r) => r.reduce((a, b) => a + b, 0)),
      ...[0, 1, 2].map((c) => LUOSHU.reduce((a, r) => a + r[c], 0)),
      LUOSHU[0][0] + LUOSHU[1][1] + LUOSHU[2][2],
      LUOSHU[0][2] + LUOSHU[1][1] + LUOSHU[2][0],
    ];
    expect(new Set(sums)).toEqual(new Set([15]));
  });
});
