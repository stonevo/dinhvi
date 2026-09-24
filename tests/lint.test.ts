import { describe, expect, it } from 'vitest';
import { findEvaluativeWords } from '../src/lib/lint';

describe('findEvaluativeWords (bước 1, gợi ý mềm)', () => {
  it('bắt từ đánh giá', () => {
    expect(findEvaluativeWords('Dự án đang rất tốt, nhưng khó khăn')).toEqual(['tốt', 'khó']);
    expect(findEvaluativeWords('Mọi thứ ổn')).toEqual(['ổn']);
  });
  it('không bắt câu mô tả sự thật', () => {
    expect(findEvaluativeWords('Tôi họp bốn buổi mỗi tuần, dự án lùi hạn hai lần.')).toEqual([]);
  });
  it('khớp nguyên từ, cả chuỗi NFD', () => {
    expect(findEvaluativeWords('Tốt'.normalize('NFD'))).toEqual(['tốt']);
    expect(findEvaluativeWords('ổ đĩa')).toEqual([]);
  });
});
