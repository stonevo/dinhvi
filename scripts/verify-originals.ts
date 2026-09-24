// Đối chiếu trường `original` (phiên âm Hán Việt) với kinh văn chữ Hán Kanripo
// KR1a0001, dùng âm Việt của từng chữ trong Unihan (kVietnamese) + bảng bổ sung.
//
//   git clone --depth 1 https://github.com/kanripo/KR1a0001.git <dir>
//   curl -LO https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip && unzip Unihan.zip Unihan_Readings.txt
//   npx tsx scripts/verify-originals.ts <dir KR1a0001> <Unihan_Readings.txt> [--json out.json]
//
// Nguồn không nằm trong repo. Kết quả in ra stdout (markdown).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Hexagram } from '../src/types/schema';
import { EXTRA_READINGS } from './hanviet-extra';

const [kanripoDir, unihanPath, ...rest] = process.argv.slice(2);
if (!kanripoDir || !unihanPath) {
  console.error('Cách dùng: npx tsx scripts/verify-originals.ts <KR1a0001> <Unihan_Readings.txt> [--json out.json]');
  process.exit(2);
}
const jsonOut = rest[0] === '--json' ? rest[1] : null;

// ---------- Âm tiết: so khớp bỏ qua chỗ đặt dấu và i/y ----------

const TONES: Record<string, string> = { '̀': '2', '́': '1', '̃': '4', '̉': '3', '̣': '5' };

export function syllableKey(s: string): string {
  const d = s.toLowerCase().normalize('NFD');
  let tone = '0';
  let base = '';
  for (const ch of d) {
    if (TONES[ch]) tone = TONES[ch];
    else base += ch;
  }
  base = base.normalize('NFC').replace(/[^a-zđăâêôơư]/g, '');
  // i/y cuối sau phụ âm: kỳ = kì, tỷ = tỉ, ly = li (không đụng "uy", "ay").
  base = base.replace(/(?<=[bcdđghklmnpqrstvx])y$/, 'i');
  return base + tone;
}

// ---------- Âm Hán Việt theo chữ ----------

const readings = new Map<string, Set<string>>();
for (const line of readFileSync(unihanPath, 'utf8').split('\n')) {
  const m = /^U\+([0-9A-F]+)\tkVietnamese\t(.+)$/.exec(line);
  if (!m) continue;
  const ch = String.fromCodePoint(parseInt(m[1], 16));
  readings.set(ch, new Set(m[2].trim().split(/\s+/).map(syllableKey)));
}
for (const [ch, list] of Object.entries(EXTRA_READINGS)) {
  const s = readings.get(ch) ?? new Set<string>();
  for (const r of list) s.add(syllableKey(r));
  readings.set(ch, s);
}
const canRead = (ch: string, syl: string) => readings.get(ch)?.has(syllableKey(syl)) ?? false;

// ---------- Tách kinh văn Kanripo ----------

const LABELS = ['初九', '初六', '九二', '六二', '九三', '六三', '九四', '六四', '九五', '六五', '上九', '上六'];
const HAN_PUNCT = /[\s¶，。、：；！？「」『』《》〈〉（）()·—…]/gu;

type Canon = { judgment: string; lines: string[] };

function parseKanripo(dir: string): Map<number, Canon> {
  const out = new Map<number, Canon>();
  const files = readdirSync(dir).filter((f) => /^KR1a0001_0\d\d\.txt$/.test(f)).sort();
  for (const f of files) {
    const n = Number(f.slice(10, 13));
    if (n < 1 || n > 64) continue;
    const text = readFileSync(join(dir, f), 'utf8').replace(/^#.*$/gm, '').replace(/^\*\*.*$/gm, '');
    const blocks = text.split(/<pb:[^>]+>/).map((b) => b.replace(/¶/g, '').trim()).filter(Boolean);
    let judgment = '';
    const lines: string[] = new Array(6).fill('');
    for (const b of blocks) {
      // Giữ tên quẻ trong ngoặc: có quẻ mà tên là một phần của câu (艮其背, 履虎尾).
      // Có quẻ Kanripo lặp tên ở tiêu đề và đầu câu (《履》履虎尾) — khi đó bỏ tiêu đề.
      const hm = /^《([^》]+)》/.exec(b);
      if (!judgment && hm && !/^(彖|象|文言)$/.test(hm[1])) {
        const body = b.slice(hm[0].length);
        judgment = body.startsWith(hm[1]) ? body : b;
      }
      // Quẻ Càn dùng "初九、", các quẻ khác "初九："; loại "初九曰" của Văn ngôn.
      const lm = /^(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六)[：、]/.exec(b);
      if (lm) {
        const pos = LABELS.indexOf(lm[1]) >> 1; // cặp (dương, âm) cho mỗi vị trí
        if (!lines[pos]) lines[pos] = b.slice(lm[0].length);
      }
    }
    out.set(n, { judgment: judgment.replace(HAN_PUNCT, ''), lines: lines.map((l) => l.replace(HAN_PUNCT, '')) });
  }
  return out;
}

// ---------- Căn chỉnh chuỗi âm tiết ↔ chuỗi chữ ----------

type Op = { kind: 'ok' | 'sub' | 'extra' | 'missing'; syl?: string; ch?: string };

export function align(syls: string[], chars: string[]): Op[] {
  const n = syls.length;
  const m = chars.length;
  const cost = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) cost[i][0] = i;
  for (let j = 0; j <= m; j++) cost[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + (canRead(chars[j - 1], syls[i - 1]) ? 0 : 1),
        cost[i - 1][j] + 1,
        cost[i][j - 1] + 1,
      );
  const ops: Op[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + (canRead(chars[j - 1], syls[i - 1]) ? 0 : 1)) {
      ops.push({ kind: canRead(chars[j - 1], syls[i - 1]) ? 'ok' : 'sub', syl: syls[i - 1], ch: chars[j - 1] });
      i--;
      j--;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) {
      ops.push({ kind: 'extra', syl: syls[--i] });
    } else {
      ops.push({ kind: 'missing', ch: chars[--j] });
    }
  }
  return ops.reverse();
}

const tokenize = (vi: string) =>
  vi
    .normalize('NFC')
    .replace(/[“”"‘’.,:;!?()—–-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

// ---------- Chạy ----------

const hexagrams: Hexagram[] = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'public', 'data', 'hexagrams.json'), 'utf8'));
const canon = parseKanripo(kanripoDir);

type Finding = { ref: string; ours: string; han: string; ops: Op[] };
const findings: Finding[] = [];
let checked = 0;

function check(ref: string, ours: string, han: string) {
  checked++;
  const ops = align(tokenize(ours), [...han]);
  if (ops.some((o) => o.kind !== 'ok')) findings.push({ ref, ours, han, ops });
}

for (const h of hexagrams) {
  const c = canon.get(h.kingWenNumber);
  if (!c) {
    findings.push({ ref: `${h.kingWenNumber}`, ours: '(không tìm thấy trong Kanripo)', han: '', ops: [] });
    continue;
  }
  const jm = /^“([^”]+)”/.exec(h.judgment);
  if (jm) {
    // Cả hai bên đều mở đầu bằng tên quẻ ("Truân: …" ↔ 《屯》…); bỏ dấu hai chấm sau tên.
    check(`${h.kingWenNumber} lời quẻ`, jm[1], c.judgment);
  }
  h.lines.forEach((l, i) => check(`${h.kingWenNumber}.${i + 1}`, l.original.replace(/^[^:]+:\s*/, ''), c.lines[i]));
}

const fmt = (o: Op) =>
  o.kind === 'sub' ? `“${o.syl}” ≠ ${o.ch}` : o.kind === 'extra' ? `thừa “${o.syl}”` : `thiếu ${o.ch}`;

console.log(`# Đối chiếu lời hào với Kanripo KR1a0001\n`);
console.log(`Đã so ${checked} đoạn (64 lời quẻ + 384 lời hào). Lệch: ${findings.length}.\n`);
console.log('| Đoạn | Chữ Hán (Kanripo) | Chỗ lệch |\n|---|---|---|');
for (const f of findings) console.log(`| ${f.ref} | ${f.han} | ${f.ops.filter((o) => o.kind !== 'ok').map(fmt).join('; ')} |`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(findings, null, 2));
