// Nhập số nét chữ Hán từ Unihan vào public/data/strokes.json = { "字": số nét }.
//   npx tsx scripts/import-strokes.ts [thư mục chứa Unihan_IRGSources.txt | Unihan.zip]
//
// Nguồn: trường kTotalStrokes (Unihan_IRGSources.txt). Chỉ giữ chữ có kIICore
// (bộ chữ lõi quốc tế) HOẶC có âm kVietnamese (Unihan_Readings.txt) để tệp gọn.
//
// Về số nét: Mai Hoa Dịch Số cổ đếm nét theo chữ phồn thể. kTotalStrokes có thể
// có hai giá trị "a b": theo UAX #38, giá trị đầu ưu tiên cho zh-Hans (nguồn G),
// giá trị sau ưu tiên cho zh-Hant (nguồn T). Ta lấy giá trị SAU (tức giá trị duy
// nhất nếu chỉ có một) vì gần với cách đếm phồn thể hơn. Lưu ý: một số sách Mai
// Hoa đếm theo Khang Hy, tính bộ thủ theo dạng gốc (氵= 4 nét của 水, 艹 = 6 của
// 艸...); dữ liệu này KHÔNG áp dụng quy ước đó — người dùng có thể tự nhập số nét.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SCRATCH_SRC =
  'C:\\Users\\TRUONG.VO\\AppData\\Local\\Temp\\claude\\F--Workspace-dinhvi\\c20882a1-29e0-437f-9272-0281900d112a\\scratchpad\\src';
const DEFAULT_ZIP = 'C:\\Users\\TRUONG.VO\\AppData\\Local\\Temp\\Unihan.zip';
const OUT = join('public', 'data', 'strokes.json');

function locate(dirArg: string | undefined): string {
  const dirs = [dirArg, SCRATCH_SRC].filter((d): d is string => !!d);
  for (const d of dirs) {
    if (existsSync(join(d, 'Unihan_IRGSources.txt')) && existsSync(join(d, 'Unihan_Readings.txt'))) return d;
  }
  // Chưa giải nén: tìm Unihan.zip rồi giải nén vào thư mục đích.
  const target = dirArg ?? SCRATCH_SRC;
  const zips = [dirArg && join(dirArg, 'Unihan.zip'), join(SCRATCH_SRC, 'Unihan.zip'), DEFAULT_ZIP].filter(
    (z): z is string => !!z && existsSync(z),
  );
  if (zips.length === 0) throw new Error('Không tìm thấy Unihan_IRGSources.txt hoặc Unihan.zip');
  mkdirSync(target, { recursive: true });
  try {
    execFileSync('unzip', ['-o', '-q', zips[0], 'Unihan_IRGSources.txt', 'Unihan_Readings.txt', '-d', target]);
  } catch {
    execFileSync('powershell', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Force -LiteralPath '${zips[0]}' -DestinationPath '${target}'`,
    ]);
  }
  return target;
}

function parse(file: string, field: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.startsWith('U+')) continue;
    const [cp, f, value] = line.replace(/\r$/, '').split('\t');
    if (f === field) out.set(String.fromCodePoint(parseInt(cp.slice(2), 16)), value);
  }
  return out;
}

const dir = locate(process.argv[2]);
const irg = join(dir, 'Unihan_IRGSources.txt');
const total = parse(irg, 'kTotalStrokes');
const core = parse(irg, 'kIICore');
const viet = parse(join(dir, 'Unihan_Readings.txt'), 'kVietnamese');

const entries: [string, number][] = [];
for (const [ch, v] of total) {
  if (!core.has(ch) && !viet.has(ch)) continue;
  const parts = v.trim().split(/\s+/);
  const n = parseInt(parts[parts.length - 1], 10);
  if (Number.isInteger(n) && n > 0) entries.push([ch, n]);
}
entries.sort((a, b) => a[0].codePointAt(0)! - b[0].codePointAt(0)!);

writeFileSync(OUT, JSON.stringify(Object.fromEntries(entries)) + '\n', 'utf8');
console.log(`Đã ghi ${entries.length} chữ vào ${OUT} (${(statSync(OUT).size / 1024).toFixed(1)} KB)`);
