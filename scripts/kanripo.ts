// Đọc kinh văn Chu Dịch từ Kanripo KR1a0001 (một file mỗi quẻ, định dạng mandoku).
// Lấy lời quẻ, 6 lời hào, 用九 / 用六 của Càn, Khôn, và Thoán truyện, Đại tượng,
// Tiểu tượng từng hào; bỏ Văn ngôn.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const HAN_LABELS = ['初九', '初六', '九二', '六二', '九三', '六三', '九四', '六四', '九五', '六五', '上九', '上六'];
const LINE_RE = /^(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六|用九|用六)[：、]/;

export type CanonHexagram = {
  /** Tên quẻ khi tách riêng (《乾》元亨… → 乾), hoặc null khi tên là chữ đầu câu (履虎尾). */
  name: string | null;
  /** Lời quẻ, không kèm tên tách riêng. */
  judgment: string;
  /** Sáu lời hào, không kèm nhãn. */
  lines: string[];
  /** Nhãn gốc của từng hào (初九, 六二, …). */
  labels: string[];
  /** 用九 / 用六, chỉ có ở Càn, Khôn. */
  use: { label: string; text: string } | null;
  /** Thoán truyện (彖曰). */
  tuan: string;
  /** Đại tượng (象曰 cho cả quẻ). */
  image: string;
  /** Tiểu tượng của từng hào. */
  lineImages: string[];
  /** Tiểu tượng của 用九 / 用六. */
  useImage: string;
  /** Văn ngôn (chỉ Càn, Khôn), tách theo từng đoạn giảng. */
  wenyan: string[];
};

// Chỗ bắt đầu mỗi đoạn Văn ngôn (sau khi bỏ khoảng trắng, còn giữ ngoặc 「」).
const WENYAN_BREAKS: Record<number, string[]> = {
  1: ['初九曰、', '九二曰、', '九三曰、', '九四曰、', '九五曰、', '上九曰、', '「潛龍勿用」、下也', '「潛龍勿用」，陽氣',
    '《乾》「元」', '大哉乾乎', '「潛」之為言', '九三重剛', '九四重剛', '夫「大人」者', '「亢」之為言'],
  2: ['積善之家', '「直」其正也', '陰雖有美', '天地變化', '君子「黃」中', '陰疑於陽'],
};

function splitWenyan(n: number, raw: string): string[] {
  const i = raw.indexOf('《文言》曰：');
  if (i < 0 || !WENYAN_BREAKS[n]) return [];
  let t = raw.slice(i + 6).replace(/<pb:[^>]+>/g, '').replace(/[¶\s]/g, '');
  for (const b of WENYAN_BREAKS[n]) {
    const at = t.indexOf(b);
    if (at <= 0) throw new Error(`Văn ngôn quẻ ${n}: không thấy "${b}"`);
    t = t.slice(0, at) + '|' + t.slice(at);
  }
  return t.split('|').map((x) => cleanHan(x).replace(/[《》]/g, ''));
}

/** Giữ dấu câu Hán, bỏ ký hiệu đánh dấu và ngoặc trích dẫn. */
export const cleanHan = (s: string) => s.replace(/[¶\s「」『』]/g, '');

export function parseKanripo(dir: string): Map<number, CanonHexagram> {
  const out = new Map<number, CanonHexagram>();
  const files = readdirSync(dir).filter((f) => /^KR1a0001_0\d\d\.txt$/.test(f)).sort();
  for (const f of files) {
    const n = Number(f.slice(10, 13));
    if (n < 1 || n > 64) continue;
    const text = readFileSync(join(dir, f), 'utf8').replace(/^#.*$/gm, '').replace(/^\*\*.*$/gm, '');
    // Mỗi đoạn thường nằm trong một trang; đoạn nào vắt sang trang sau thì nối lại.
    const blocks: string[] = [];
    for (const b of text.split(/<pb:[^>]+>/).map(cleanHan).filter(Boolean)) {
      if (blocks.length && !/^(《|[䷀-䷿])/u.test(b) && !LINE_RE.test(b)) blocks[blocks.length - 1] += b;
      else blocks.push(b);
    }
    const hex: CanonHexagram = {
      name: null, judgment: '', lines: new Array(6).fill(''), labels: new Array(6).fill(''), use: null,
      tuan: '', image: '', lineImages: new Array(6).fill(''), useImage: '',
      wenyan: splitWenyan(n, text),
    };
    // Tượng gắn với lời đứng ngay trước nó: -1 = lời quẻ, 0..5 = hào, 6 = 用九/用六.
    let last = -1;
    for (const b of blocks) {
      if (b.startsWith('《文言》')) break;
      if (b.startsWith('《彖》曰：')) {
        hex.tuan ||= b.slice(5).replace(/[《》]/g, '');
        continue;
      }
      if (b.startsWith('《象》曰：')) {
        const body = b.slice(5);
        if (n === 1) {
          // Càn: Đại tượng và bảy Tiểu tượng gộp một khối, mỗi Tiểu tượng mở bằng câu trích.
          const raw = readFileSync(join(dir, f), 'utf8').replace(/<pb:[^>]+>/g, '');
          const seg = raw.slice(raw.indexOf('《象》曰：') + 5, raw.indexOf('《文言》')).replace(/[¶\s]/g, '');
          const parts = seg.split(/(?<=。)(?=「)/).map(cleanHan);
          hex.image = parts[0];
          parts.slice(1, 7).forEach((p, i) => (hex.lineImages[i] = p));
          hex.useImage = parts[7] ?? '';
        } else if (last === -1) hex.image ||= body;
        else if (last === 6) hex.useImage ||= body;
        else hex.lineImages[last] ||= body;
        continue;
      }
      // Lời quẻ: khối đầu tiên mở bằng 《tên》 mà không phải Thoán/Tượng/Văn ngôn.
      const hm = /^《([^》]+)》/.exec(b);
      if (!hex.judgment && hm && !/^(彖|象|文言)$/.test(hm[1])) {
        const body = b.slice(hm[0].length);
        // Có quẻ Kanripo lặp tên ở tiêu đề và đầu câu (《履》履虎尾) — khi đó tên thuộc câu.
        if (body.startsWith(hm[1])) hex.judgment = body;
        else {
          hex.name = hm[1];
          hex.judgment = body;
        }
      }
      const lm = LINE_RE.exec(b);
      if (!lm) continue;
      const body = b.slice(lm[0].length);
      if (lm[1] === '用九' || lm[1] === '用六') {
        hex.use ??= { label: lm[1], text: body };
        last = 6;
        continue;
      }
      const pos = HAN_LABELS.indexOf(lm[1]) >> 1;
      last = pos;
      if (!hex.lines[pos]) {
        hex.lines[pos] = body;
        hex.labels[pos] = lm[1];
      }
    }
    out.set(n, hex);
  }
  return out;
}
