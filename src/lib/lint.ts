// Lint ngôn ngữ: chặn giọng tiên tri/mệnh lệnh trong dữ liệu và giao diện,
// và cảnh báo mềm từ đánh giá trong ô "sự thật" ở bước 1.

/** Cụm cấm (mục 9). So khớp theo ranh giới chữ, không phân biệt hoa thường. */
export const FORBIDDEN_PHRASES = ['sẽ', 'chắc chắn', 'nhất định', 'tránh ngay', 'không nên', 'nên', 'phải'];

/**
 * Cụm được miễn vì không mang nghĩa mệnh lệnh:
 * "không phải" = phủ định ("không phải muốn ở đâu"); "trở nên" = trở thành.
 */
export const ALLOWED_PHRASES = ['không phải', 'trở nên'];

/** Mở đầu hợp lệ của traditionalCounsel — khung "truyền thống khuyên", không phải lời app. */
export const COUNSEL_PREFIXES = [
  'Truyền thống khuyên rằng',
  'Theo truyền thống,',
  'Lời xưa khuyên rằng',
  'Các nhà chú giải xưa khuyên rằng',
];

const LETTER = '\\p{L}\\p{M}';

function phraseRegex(phrase: string): RegExp {
  const escaped = phrase.normalize('NFC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp(`(?<![${LETTER}])${escaped}(?![${LETTER}])`, 'giu');
}

const FORBIDDEN_RE = FORBIDDEN_PHRASES.map((p) => [p, phraseRegex(p)] as const);
const ALLOWED_RE = ALLOWED_PHRASES.map(phraseRegex);

/** Các cụm cấm xuất hiện trong text (sau khi bỏ các cụm được miễn). */
export function findForbidden(text: string): string[] {
  let t = text.normalize('NFC');
  for (const re of ALLOWED_RE) t = t.replace(re, ' ');
  const found: string[] = [];
  for (const [phrase, re] of FORBIDDEN_RE) {
    re.lastIndex = 0;
    if (re.test(t)) {
      found.push(phrase);
      // "không nên" đã bao "nên" — xoá để không báo trùng.
      t = t.replace(phraseRegex(phrase), ' ');
    }
  }
  return found;
}

export type LintViolation = { path: string; rule: string; text: string };

/**
 * Quét đệ quy một tài liệu JSON. Luật theo tên trường:
 * - traditionalCounsel: được dùng cụm cấm nhưng phải mở đầu bằng COUNSEL_PREFIXES
 * - reflectionQuestions: mỗi câu kết thúc bằng "?"
 * - mọi chuỗi khác: không chứa cụm cấm
 */
export function lintDocument(doc: unknown, root = ''): LintViolation[] {
  const out: LintViolation[] = [];
  const visit = (node: unknown, path: string, field: string) => {
    if (typeof node === 'string') {
      const text = node.normalize('NFC').trim();
      if (field === 'traditionalCounsel') {
        if (text && !COUNSEL_PREFIXES.some((p) => text.startsWith(p)))
          out.push({ path, rule: 'counsel-prefix', text });
      } else if (field === 'reflectionQuestions') {
        if (!text.endsWith('?')) out.push({ path, rule: 'question-mark', text });
      } else {
        for (const phrase of findForbidden(text)) out.push({ path, rule: `forbidden:${phrase}`, text });
      }
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => visit(v, `${path}[${i}]`, field));
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) visit(v, path ? `${path}.${k}` : k, k);
    }
  };
  visit(doc, root, '');
  return out;
}

// ---------- Bước 1: từ đánh giá (cảnh báo mềm, không chặn) ----------

export const EVALUATIVE_WORDS = [
  'tốt', 'tệ', 'ổn', 'khó', 'dở', 'xấu', 'tồi', 'kém', 'giỏi', 'tuyệt', 'hoàn hảo',
  'thất bại', 'thành công', 'đáng', 'quá tệ', 'tuyệt vời', 'tồi tệ', 'vất vả', 'may mắn', 'xui',
];

const EVALUATIVE_RE = EVALUATIVE_WORDS.map((w) => [w, phraseRegex(w)] as const);

export function findEvaluativeWords(text: string): string[] {
  const t = text.normalize('NFC');
  return EVALUATIVE_RE.filter(([, re]) => {
    re.lastIndex = 0;
    return re.test(t);
  }).map(([w]) => w);
}
