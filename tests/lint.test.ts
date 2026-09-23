import { describe, expect, it } from 'vitest';
import { findEvaluativeWords, findForbidden, lintDocument } from '../src/lib/lint';
import { vi } from '../src/i18n/vi';

describe('findForbidden', () => {
  it.each([
    ['Bạn sẽ thành công', ['sẽ']],
    ['Nên dừng lại.', ['nên']],
    ['Không nên vội.', ['không nên']],
    ['Việc này chắc chắn qua.', ['chắc chắn']],
    ['Phải làm ngay', ['phải']],
    ['Nhất định có kết quả', ['nhất định']],
    ['cuối câu sẽ.', ['sẽ']],
  ])('"%s" → %j', (text, expected) => {
    expect(findForbidden(text)).toEqual(expected);
  });

  it.each([
    'Không phải muốn ở đâu — đang ở đâu.',
    'Mọi thứ trở nên rõ hơn.',
    'Chia sẻ với người khác.', // "sẻ" khác "sẽ"
    'Phái đoàn đã tới.', // "phái" khác "phải"
    'Nền tảng còn mỏng.', // "nền" khác "nên"
    'Người ở vị trí này thường vấp ở chỗ vội.',
  ])('không báo: "%s"', (text) => {
    expect(findForbidden(text)).toEqual([]);
  });

  it('bắt cả chuỗi Unicode dạng NFD', () => {
    expect(findForbidden('Bạn sẽ đi'.normalize('NFD'))).toEqual(['sẽ']);
  });
});

describe('lintDocument', () => {
  it('áp luật theo tên trường', () => {
    const doc = {
      lines: [
        {
          situation: 'Bạn sẽ gặp trở ngại.',
          traditionalCounsel: 'Truyền thống khuyên rằng nên giữ mình.',
          reflectionQuestions: ['Ai đang thực sự quyết?', 'Bạn có nên nghỉ'],
          behavioralSignals: ['Bạn phải làm mọi việc một mình'],
        },
        { traditionalCounsel: 'Nên giữ mình.' },
      ],
    };
    expect(lintDocument(doc, 'hexagrams.json').map((v) => [v.path, v.rule])).toEqual([
      ['hexagrams.json.lines[0].situation', 'forbidden:sẽ'],
      ['hexagrams.json.lines[0].reflectionQuestions[1]', 'question-mark'],
      ['hexagrams.json.lines[0].behavioralSignals[0]', 'forbidden:phải'],
      ['hexagrams.json.lines[1].traditionalCounsel', 'counsel-prefix'],
    ]);
  });

  it('chuỗi giao diện tiếng Việt không có giọng mệnh lệnh / tiên tri', () => {
    expect(lintDocument(vi, 'vi')).toEqual([]);
  });
});

describe('findEvaluativeWords (bước 1, cảnh báo mềm)', () => {
  it('bắt từ đánh giá', () => {
    expect(findEvaluativeWords('Dự án đang rất tốt, nhưng khó khăn')).toEqual(['tốt', 'khó']);
    expect(findEvaluativeWords('Mọi thứ ổn')).toEqual(['ổn']);
  });
  it('không bắt câu mô tả sự thật', () => {
    expect(findEvaluativeWords('Tôi họp bốn buổi mỗi tuần, dự án lùi hạn hai lần.')).toEqual([]);
  });
});
