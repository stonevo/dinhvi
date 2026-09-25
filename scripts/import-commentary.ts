// Dựng public/data/commentary.json: chữ Hán (Thoán, Đại tượng, Tiểu tượng) lấy từ
// Kanripo KR1a0001; phần tiếng Việt giữ nguyên từ file hiện có, hoặc lấy từ các file
// <thư mục dịch>/vi-NN.json nếu truyền vào.
//   npx tsx scripts/import-commentary.ts <thư mục KR1a0001> [thư mục dịch]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CommentaryPart, HexagramCommentary } from '../src/types/schema';
import { parseKanripo } from './kanripo';

const [dir, viDir] = process.argv.slice(2);
if (!dir) {
  console.error('Cách dùng: npx tsx scripts/import-commentary.ts <thư mục KR1a0001> [thư mục dịch]');
  process.exit(2);
}

const OUT = join(import.meta.dirname, '..', 'public', 'data', 'commentary.json');
const current = new Map<number, HexagramCommentary>(
  existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')) as HexagramCommentary[]).map((c) => [c.kingWenNumber, c]) : [],
);

type ViPart = Partial<Omit<CommentaryPart, 'imageHan'>>;
type ViWenyan = { title?: string; vi?: string; explain?: string; views?: CommentaryPart['views'] };
type Vi = { judgment?: ViPart & { tuan?: string }; lines?: ViPart[]; allMoving?: ViPart; wenyan?: ViWenyan[] };

const empty = { literal: '', image: '', explain: '', views: [] };
const part = (imageHan: string, prev: Partial<CommentaryPart> | undefined, vi: ViPart | undefined): CommentaryPart => ({
  ...empty,
  ...prev,
  ...vi,
  imageHan,
});

const canon = parseKanripo(dir);
const out: HexagramCommentary[] = [];
for (let n = 1; n <= 64; n++) {
  const c = canon.get(n)!;
  const prev = current.get(n);
  const viPath = viDir && join(viDir, `vi-${String(n).padStart(2, '0')}.json`);
  const vi: Vi = viPath && existsSync(viPath) ? JSON.parse(readFileSync(viPath, 'utf8')) : {};
  const entry: HexagramCommentary = {
    kingWenNumber: n,
    judgment: {
      ...part(c.image, prev?.judgment, vi.judgment),
      tuanHan: c.tuan,
      tuan: vi.judgment?.tuan ?? prev?.judgment.tuan ?? '',
    },
    lines: c.lineImages.map((img, i) => part(img, prev?.lines[i], vi.lines?.[i])),
  };
  if (c.useImage) entry.allMoving = part(c.useImage, prev?.allMoving, vi.allMoving);
  if (c.wenyan.length)
    entry.wenyan = c.wenyan.map((han, i) => ({
      title: '',
      vi: '',
      explain: '',
      views: [],
      ...prev?.wenyan?.[i],
      ...vi.wenyan?.[i],
      han,
    }));
  out.push(entry);
}
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`Đã ghi ${OUT}`);
