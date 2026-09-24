// Đọc kinh văn Chu Dịch từ Kanripo KR1a0001 (một file mỗi quẻ, định dạng mandoku).
// Lấy lời quẻ, 6 lời hào, và 用九 / 用六 của Càn, Khôn; bỏ Thoán, Tượng, Văn ngôn.
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
};

/** Giữ dấu câu Hán, bỏ ký hiệu đánh dấu và ngoặc trích dẫn. */
export const cleanHan = (s: string) => s.replace(/[¶\s「」『』]/g, '');

export function parseKanripo(dir: string): Map<number, CanonHexagram> {
  const out = new Map<number, CanonHexagram>();
  const files = readdirSync(dir).filter((f) => /^KR1a0001_0\d\d\.txt$/.test(f)).sort();
  for (const f of files) {
    const n = Number(f.slice(10, 13));
    if (n < 1 || n > 64) continue;
    const text = readFileSync(join(dir, f), 'utf8').replace(/^#.*$/gm, '').replace(/^\*\*.*$/gm, '');
    const blocks = text.split(/<pb:[^>]+>/).map(cleanHan).filter(Boolean);
    const hex: CanonHexagram = { name: null, judgment: '', lines: new Array(6).fill(''), labels: new Array(6).fill(''), use: null };
    for (const b of blocks) {
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
        continue;
      }
      const pos = HAN_LABELS.indexOf(lm[1]) >> 1;
      if (!hex.lines[pos]) {
        hex.lines[pos] = body;
        hex.labels[pos] = lm[1];
      }
    }
    out.set(n, hex);
  }
  return out;
}
