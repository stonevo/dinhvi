// Nhập chữ Hán gốc từ Kanripo KR1a0001 vào public/data/hexagrams.json:
// judgmentHan (lời quẻ), originalHan (lời hào), và allMoving (用九 / 用六) cho Càn, Khôn.
//   npx tsx scripts/import-han.ts <thư mục KR1a0001>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AllMoving, Hexagram } from '../src/types/schema';
import { parseKanripo } from './kanripo';

const dir = process.argv[2];
if (!dir) {
  console.error('Cách dùng: npx tsx scripts/import-han.ts <thư mục KR1a0001>');
  process.exit(2);
}

// Phần diễn giải cho Dụng cửu / Dụng lục (chữ Hán lấy từ Kanripo khi chạy).
const ALL_MOVING: Record<number, Omit<AllMoving, 'originalHan'>> = {
  1: {
    original: 'Dụng cửu: Kiến quần long vô thủ, cát.',
    situation:
      'Cả sáu hào đều động: mọi vị trí đều mạnh và đều đang đổi. Không ai cần đứng đầu; sức mạnh chung vận hành khi từng người làm tròn phần mình mà không tranh làm thủ lĩnh.',
    characteristicRisk: 'Ai cũng muốn cầm lái, và sức mạnh tập thể biến thành tranh giành.',
    commonFailure: 'Người ở tình huống này thường cố khẳng định vai trò đứng đầu đúng lúc việc chung cần mọi người ngang hàng.',
    traditionalCounsel:
      'Truyền thống khuyên rằng thấy bầy rồng không có đầu là tốt: dùng cái cương mà không làm đầu, để sức mạnh không thành kiêu.',
    whatTendsToFollow: 'Khi không ai giữ chặt ngôi đầu, cái cương mạnh thường chuyển dần sang sự mềm và tiếp nhận của Khôn.',
    reflectionQuestions: [
      'Nếu không ai đứng đầu trong việc này, việc có chạy được không?',
      'Bạn đang giữ vai trò dẫn dắt vì việc cần, hay vì bạn cần?',
    ],
  },
  2: {
    original: 'Dụng lục: Lợi vĩnh trinh.',
    situation:
      'Cả sáu hào đều động: sự mềm, nhường, tiếp nhận đi đến tận cùng và bắt đầu đổi chất. Điều giữ được mình lúc này là sự bền bỉ lâu dài, không phải một lần nhún nhường.',
    characteristicRisk: 'Nhường mãi thành mất mình; mềm mãi thành không còn điểm tựa.',
    commonFailure: 'Người ở tình huống này thường theo người khác đến mức quên mất hướng đi của chính mình.',
    traditionalCounsel:
      'Truyền thống khuyên rằng dùng số sáu thì lợi ở chỗ bền chính lâu dài: mềm mà giữ được cái ngay, lấy sự bền để đi đến chỗ lớn.',
    whatTendsToFollow: 'Cái mềm đến cực thường chuyển sang cứng: tiếp nhận lâu dài dần thành sức tự đứng.',
    reflectionQuestions: [
      'Bạn đã nhường ở việc này bao lâu rồi, và điều gì của bạn còn giữ được?',
      'Sự bền của bạn đang phục vụ hướng đi nào?',
    ],
  },
};

const TARGET = join(import.meta.dirname, '..', 'public', 'data', 'hexagrams.json');
const hexagrams: Hexagram[] = JSON.parse(readFileSync(TARGET, 'utf8'));
const canon = parseKanripo(dir);

/** Chèn khoá mới ngay sau một khoá có sẵn, giữ thứ tự trường dễ đọc trong JSON. */
function insertAfter<T extends object>(obj: T, after: string, key: string, value: unknown): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === key) continue;
    out[k] = v;
    if (k === after) out[key] = value;
  }
  return out as T;
}

const HAN_PUNCT = /[，。、：；！？]/;
const hanCount = (s: string) => [...s].filter((ch) => !HAN_PUNCT.test(ch)).length;

/**
 * Lời quẻ chữ Hán, khớp với phần trích Hán Việt trong `judgment`:
 * - Kanripo có khi tách tên ra tiêu đề (《乾》元亨…), có khi tên là chữ đầu câu
 *   (《艮》其背… đọc liền "Cấn kỳ bối"), có khi câu mở bằng chữ khác (《坎》習坎…).
 *   Chọn "tên + câu" hay "chỉ câu" theo số chữ khớp với số âm tiết Hán Việt.
 * - Nếu bản Hán Việt tách tên bằng dấu hai chấm ("Càn: nguyên hanh…"), đặt "：" ở cùng chỗ.
 */
function judgmentHan(h: Hexagram, name: string | null, body: string): string {
  const quote = /^“([^”]+)”/.exec(h.judgment)?.[1] ?? '';
  const syllables = quote.replace(/[.,:;!?]/g, ' ').split(/\s+/).filter(Boolean);
  const withName = name ? name + body : body;
  const han = name && hanCount(withName) === syllables.length ? withName : body;
  const colon = /^([^:,.]+):/.exec(quote);
  if (!colon) return han;
  const head = colon[1].trim().split(/\s+/).length;
  // Cắt sau `head` chữ Hán (không tính dấu câu) và chèn "：", bỏ dấu câu sẵn có ngay chỗ cắt.
  let seen = 0;
  let i = 0;
  while (i < han.length && seen < head) if (!HAN_PUNCT.test(han[i++])) seen++;
  const rest = han.slice(i).replace(/^[，。、：；]/, '');
  return `${han.slice(0, i)}：${rest}`;
}

const updated = hexagrams.map((h) => {
  const c = canon.get(h.kingWenNumber);
  if (!c || !c.judgment || c.lines.some((l) => !l)) throw new Error(`Kanripo thiếu dữ liệu quẻ ${h.kingWenNumber}`);
  let out = insertAfter(h, 'judgment', 'judgmentHan', judgmentHan(h, c.name, c.judgment));
  out = {
    ...out,
    lines: h.lines.map((l, i) => insertAfter(l, 'original', 'originalHan', `${c.labels[i]}：${c.lines[i]}`)),
  };
  const extra = ALL_MOVING[h.kingWenNumber];
  if (extra) {
    if (!c.use) throw new Error(`Kanripo thiếu 用九/用六 ở quẻ ${h.kingWenNumber}`);
    out = insertAfter(out, 'lines', 'allMoving', insertAfter(extra, 'original', 'originalHan', `${c.use.label}：${c.use.text}`));
  }
  return out;
});

writeFileSync(TARGET, JSON.stringify(updated, null, 2) + '\n', 'utf8');
console.log(`Đã ghi chữ Hán cho ${updated.length} quẻ.`);
