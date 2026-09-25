import { describe, expect, it } from 'vitest';
import { lineStructure } from '../src/lib/structure';

describe('lineStructure', () => {
  // Truân ䷂: 100010 — hào 1 dương, hào 5 dương, còn lại âm.
  const zhun = '100010';

  it('đắc chính: dương ở vị lẻ, âm ở vị chẵn', () => {
    expect(lineStructure(zhun, 1).correct).toBe(true);
    expect(lineStructure(zhun, 2).correct).toBe(true);
    expect(lineStructure(zhun, 3).correct).toBe(false);
    expect(lineStructure(zhun, 5).correct).toBe(true);
  });

  it('đắc trung chỉ ở hào 2 và 5', () => {
    expect([1, 2, 3, 4, 5, 6].filter((p) => lineStructure(zhun, p).central)).toEqual([2, 5]);
  });

  it('ứng khi hai hào tương ứng khác tính', () => {
    const l2 = lineStructure(zhun, 2);
    expect(l2.partner).toBe(5);
    expect(l2.resonates).toBe(true);
    const l3 = lineStructure(zhun, 3);
    expect(l3.partner).toBe(6);
    expect(l3.resonates).toBe(false);
    expect(lineStructure(zhun, 4).partner).toBe(1);
  });

  it('âm cưỡi trên dương, âm đỡ dưới dương', () => {
    // Hào 2 âm nằm ngay trên hào 1 dương: "thừa cương" (Tiểu tượng: 六二之難、乘剛也).
    expect(lineStructure(zhun, 2).ridesYang).toBe(true);
    expect(lineStructure(zhun, 4).supportsYang).toBe(true);
    expect(lineStructure(zhun, 6).ridesYang).toBe(true);
    expect(lineStructure(zhun, 1).ridesYang).toBe(false);
  });

  it('từ chối đầu vào sai', () => {
    expect(() => lineStructure('10201', 1)).toThrow();
    expect(() => lineStructure(zhun, 7)).toThrow();
  });
});
