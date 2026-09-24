// Gợi ý mềm ở bước 1: phát hiện từ đánh giá trong ô "sự thật" (không chặn).

const LETTER = '\\p{L}\\p{M}';

function phraseRegex(phrase: string): RegExp {
  const escaped = phrase.normalize('NFC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp(`(?<![${LETTER}])${escaped}(?![${LETTER}])`, 'giu');
}

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
