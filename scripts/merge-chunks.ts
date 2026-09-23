// Gộp data-src/chunks/*.json vào public/data/hexagrams.json. Quẻ ở chunk sau
// ghi đè quẻ cùng số ở file hiện có (dùng khi viết lại từng dải quẻ).
//   npx tsx scripts/merge-chunks.ts
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Hexagram } from '../src/types/schema';

const ROOT = join(import.meta.dirname, '..');
const CHUNKS = join(ROOT, 'data-src', 'chunks');
const TARGET = join(ROOT, 'public', 'data', 'hexagrams.json');

const byNumber = new Map<number, Hexagram>();
if (existsSync(TARGET)) for (const h of JSON.parse(readFileSync(TARGET, 'utf8')) as Hexagram[]) byNumber.set(h.kingWenNumber, h);
for (const f of readdirSync(CHUNKS).filter((f) => f.endsWith('.json')).sort()) {
  for (const h of JSON.parse(readFileSync(join(CHUNKS, f), 'utf8')) as Hexagram[]) byNumber.set(h.kingWenNumber, h);
}
const merged = [...byNumber.values()].sort((a, b) => a.kingWenNumber - b.kingWenNumber);
writeFileSync(TARGET, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log(`Đã ghi ${merged.length} quẻ vào ${TARGET}`);
