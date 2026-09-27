import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { maskHexagramName } from '../src/lib/study';

type C = { kingWenNumber: number; judgment: { imageHan: string; image: string } };
type H = { kingWenNumber: number; nameHan: string; nameHanViet: string };
const commentary: C[] = JSON.parse(readFileSync('public/data/commentary.json', 'utf8'));
const hexagrams: H[] = JSON.parse(readFileSync('public/data/hexagrams.json', 'utf8'));

describe('thẻ Đại tượng', () => {
  it('che tên quẻ trong chữ Hán và bản dịch', () => {
    expect(maskHexagramName('地中有山，《謙》。君子以裒多益寡', '謙', 'Khiêm')).toBe('地中有山，《□》。君子以裒多益寡');
    expect(maskHexagramName('Trong đất có núi: hình tượng Khiêm.', '謙', 'Khiêm')).toBe('Trong đất có núi: hình tượng ….');
    expect(maskHexagramName('Khiêm nhường', '謙', 'Khiêm')).toBe('… nhường');
    expect(maskHexagramName('Khiêmx', '謙', 'Khiêm')).toBe('Khiêmx');
  });

  it('không câu Đại tượng nào còn lộ tên quẻ sau khi che', () => {
    for (const c of commentary) {
      const h = hexagrams.find((x) => x.kingWenNumber === c.kingWenNumber)!;
      const han = maskHexagramName(c.judgment.imageHan, h.nameHan, h.nameHanViet);
      const vi = maskHexagramName(c.judgment.image, h.nameHan, h.nameHanViet);
      expect(han.includes(h.nameHan), `${h.nameHanViet}: ${han}`).toBe(false);
      expect(vi.includes(h.nameHanViet), `${h.nameHanViet}: ${vi}`).toBe(false);
    }
  });
});
