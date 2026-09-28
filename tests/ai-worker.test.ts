import { describe, expect, it } from 'vitest';
import { buildUserPrompt, geminiRetryAt, nextMidnightIn, nextUtcMidnight, userDayKey, validateInput, type ReadingInput } from '../worker/src/logic';

const input: ReadingInput = {
  question: 'Tôi có nên nhận lời mời sang công ty mới không?',
  context: 'Công việc',
  primary: { name: 'Bác', image: 'Núi trên đất.', time: 'Nền móng bị bào mòn.', do: ['giữ mình'], avoid: ['mở rộng'] },
  moving: [{ position: 5, of: 'Bác', line: 'Dẫn nhóm đang yếu quy về một người vững.', context: 'Sắp xếp lại trật tự.' }],
  transformed: { name: 'Tụng', time: 'Hai bên cùng tin mình có lý.' },
  rule: 'Có ba hào động: đọc lời quẻ chính và quẻ biến.',
};

describe('máy chủ AI: dữ liệu vào', () => {
  it('nhận dữ liệu đúng, từ chối dữ liệu sai', () => {
    expect(validateInput(input)).not.toBeNull();
    expect(validateInput({ ...input, question: '' })).toBeNull();
    expect(validateInput({ ...input, question: 'x'.repeat(501) })).toBeNull();
    expect(validateInput({ ...input, moving: [{ position: 7, line: 'x' }] })).toBeNull();
    expect(validateInput(null)).toBeNull();
  });

  it('câu lệnh chứa câu hỏi, lĩnh vực, quy tắc đọc và đúng hào động', () => {
    const p = buildUserPrompt(input);
    expect(p).toContain(input.question);
    expect(p).toContain('Lĩnh vực: Công việc');
    expect(p).toContain('Quy tắc đọc:');
    expect(p).toContain('Hào 5 của quẻ Bác');
    expect(p).toContain('Quẻ biến: Tụng');
  });
});

describe('máy chủ AI: thời điểm mở lượt lại', () => {
  const now = new Date('2026-09-28T10:30:00Z'); // 03:30 giờ Thái Bình Dương (PDT)

  it('hết lượt theo phút: chờ đúng retryDelay', () => {
    const body = { error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '31s' }] } };
    expect(geminiRetryAt(now, body).getTime() - now.getTime()).toBe(31_000);
  });

  it('hết lượt theo ngày: chờ tới nửa đêm giờ Thái Bình Dương', () => {
    const body = { error: { details: [{ violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }] } };
    expect(geminiRetryAt(now, body).toISOString()).toBe('2026-09-29T07:00:00.000Z');
  });

  it('không rõ lý do: chờ một phút', () => {
    expect(geminiRetryAt(now, null).getTime() - now.getTime()).toBe(60_000);
  });

  it('nửa đêm UTC và giờ Thái Bình Dương', () => {
    expect(nextUtcMidnight(now).toISOString()).toBe('2026-09-29T00:00:00.000Z');
    expect(nextMidnightIn(now, 'America/Los_Angeles').toISOString()).toBe('2026-09-29T07:00:00.000Z');
  });

  it('khoá đếm lượt theo người và ngày', () => {
    expect(userDayKey('abc', now)).toBe('u:abc:2026-09-28');
  });
});
