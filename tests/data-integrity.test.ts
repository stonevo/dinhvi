import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Hexagram } from '../src/types/schema';
import {
  lineLabel, validateHexagrams, validateLineTiers, validateTrigrams,
} from '../src/data/validate';
import { CANONICAL_NAMES, fullHexagramName } from '../src/data/names';
import { hexagramFromTrigrams, oppositeHexagram } from '../src/lib/iching';

const DATA = join(__dirname, '..', 'public', 'data');
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));

const hexagrams: Hexagram[] = read('hexagrams.json');

describe('toàn vẹn dữ liệu tĩnh', () => {
  it('trigrams.json', () => expect(validateTrigrams(read('trigrams.json'))).toEqual([]));
  it('lineTiers.json', () => expect(validateLineTiers(read('lineTiers.json'))).toEqual([]));
  it('hexagrams.json: schema, 64 quẻ, binary, quái, bàng thông, hào', () =>
    expect(validateHexagrams(hexagrams)).toEqual([]));

  it('tên quẻ khớp bảng chuẩn độc lập', () => {
    expect(hexagrams.map((h) => [h.nameHanViet, h.nameHan])).toEqual(CANONICAL_NAMES);
  });

  it('cả 64 quẻ viết kỹ, không còn hào draft', () => {
    expect(hexagrams.flatMap((h) => h.lines).filter((l) => l.draft)).toEqual([]);
  });

  it('không hào nào bỏ trống original / situation', () => {
    for (const h of hexagrams)
      for (const l of h.lines) {
        expect(l.original.length).toBeGreaterThan(lineLabel(l.position, l.yinYang).length + 2);
        expect(l.situation.trim()).not.toBe('');
      }
  });
});

describe('validator bắt được lỗi', () => {
  const clone = () => structuredClone(hexagrams);

  it('binary sai', () => {
    const h = clone();
    h[2].binary = h[3].binary;
    expect(validateHexagrams(h).some((e) => e.includes('binary'))).toBe(true);
  });

  it('bàng thông sai', () => {
    const h = clone();
    h[0].oppositeHexagram = 3;
    expect(validateHexagrams(h)).toContain('#1.oppositeHexagram: 3 ≠ 2');
  });

  it('tier không khớp position', () => {
    const h = clone();
    h[0].lines[0].tier = 'heaven';
    expect(validateHexagrams(h).some((e) => e.includes('lines[0].tier'))).toBe(true);
  });

  it('tên hào không khớp âm dương', () => {
    const h = clone();
    h[0].lines[0].original = h[0].lines[0].original.replace('Sơ cửu', 'Sơ lục');
    expect(validateHexagrams(h).some((e) => e.includes('original'))).toBe(true);
  });

  it('thiếu quẻ', () => {
    expect(validateHexagrams(clone().slice(0, 63)).some((e) => e.includes('64'))).toBe(true);
  });

  it('hào bị để draft', () => {
    const h = clone();
    h[40].lines[0].draft = true;
    expect(validateHexagrams(h).some((e) => e.includes('hào còn draft'))).toBe(true);
  });
});

describe('tiện ích tên', () => {
  it('tên đầy đủ', () => {
    expect(fullHexagramName(hexagrams[2])).toBe('Thủy Lôi Truân');
    expect(fullHexagramName(hexagrams[0])).toBe('Thuần Càn');
    expect(fullHexagramName(hexagrams[62])).toBe('Thủy Hỏa Ký Tế');
  });
  it('dữ liệu nhất quán với logic', () => {
    for (const h of hexagrams) {
      expect(hexagramFromTrigrams(h.lowerTrigram, h.upperTrigram)).toBe(h.kingWenNumber);
      expect(h.oppositeHexagram).toBe(oppositeHexagram(h.kingWenNumber));
    }
  });});
