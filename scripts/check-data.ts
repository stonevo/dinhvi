// Kiểm tra toàn vẹn dữ liệu tĩnh.
//   npx tsx scripts/check-data.ts                 → kiểm public/data/*.json (đủ 64 quẻ)
//   npx tsx scripts/check-data.ts --partial f.json → kiểm một phần, cho phép hào draft
//   npx tsx scripts/check-data.ts --partial-complete f.json → kiểm một phần, không cho draft
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateCommentary, validateHexagrams, validateLineTiers, validateTrigrams } from '../src/data/validate';

const DATA = join(import.meta.dirname, '..', 'public', 'data');
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

const args = process.argv.slice(2);
let errors: string[];
if (args[0] === '--partial' || args[0] === '--partial-complete') {
  // --partial-complete: mọi quẻ trong file đều phải viết kỹ (không draft).
  const complete = args[0] === '--partial-complete';
  errors = args.slice(1).flatMap((f) => {
    const list = read(f);
    const requireComplete = complete ? list.map((h: { kingWenNumber: number }) => h.kingWenNumber) : [];
    return validateHexagrams(list, { requireAll: false, requireComplete }).map((e) => `${f}: ${e}`);
  });
} else {
  errors = [
    ...validateTrigrams(read(join(DATA, 'trigrams.json'))).map((e) => `trigrams.json: ${e}`),
    ...validateLineTiers(read(join(DATA, 'lineTiers.json'))).map((e) => `lineTiers.json: ${e}`),
    ...validateHexagrams(read(join(DATA, 'hexagrams.json'))),
    ...validateCommentary(read(join(DATA, 'commentary.json'))).map((e) => `commentary.json: ${e}`),
  ];
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} lỗi.`);
  process.exit(1);
}
console.log('Dữ liệu hợp lệ.');
