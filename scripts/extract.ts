// Trích một dải quẻ từ public/data/hexagrams.json ra để viết tiếp, rồi gộp lại
// bằng merge-chunks.
//   npx tsx scripts/extract.ts 9 16 > data-src/chunks/full-09-16.json
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Hexagram } from '../src/types/schema';

const [from, to] = process.argv.slice(2).map(Number);
const all: Hexagram[] = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'public', 'data', 'hexagrams.json'), 'utf8'));
console.log(JSON.stringify(all.filter((h) => h.kingWenNumber >= from && h.kingWenNumber <= to), null, 2));
