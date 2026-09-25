import { describe, expect, it } from 'vitest';
import { decodeAnswer, decodeRequest, encodeAnswer, encodeRequest, requestUrl } from '../src/lib/witness-link';

describe('link hỏi nhân chứng', () => {
  it('câu hỏi đi trọn qua link, kể cả tiếng Việt có dấu', () => {
    const url = requestUrl('https://example.org/dinhvi/#/position/x', { asker: 'Trương Võ', topic: 'công việc' });
    expect(url.startsWith('https://example.org/dinhvi/#/witness?r=')).toBe(true);
    const code = new URL(url.replace('#/witness', '')).searchParams.get('r')!;
    expect(decodeRequest(code)).toEqual({ v: 1, asker: 'Trương Võ', topic: 'công việc' });
    expect(encodeRequest({ asker: '', topic: '' })).not.toMatch(/[+/=]/); // an toàn trong URL
  });

  it('mã trả lời đi trọn, chịu được khoảng trắng khi dán', () => {
    const code = encodeAnswer({ who: 'Chị Hạnh', stage: 'rising', note: 'Đang lên nhưng vội', at: '2026-09-25T00:00:00.000Z' });
    expect(code.startsWith('DV1-')).toBe(true);
    const spaced = `  ${code.slice(0, 10)}\n${code.slice(10)}  `;
    expect(decodeAnswer(spaced)).toEqual({ v: 1, who: 'Chị Hạnh', stage: 'rising', note: 'Đang lên nhưng vội', at: '2026-09-25T00:00:00.000Z' });
  });

  it('từ chối mã hỏng hoặc sai loại', () => {
    expect(decodeAnswer('xyz')).toBeNull();
    expect(decodeAnswer('DV1-@@@')).toBeNull();
    expect(decodeRequest('không-phải-mã')).toBeNull();
    // Mã hợp lệ về định dạng nhưng giai đoạn lạ.
    const bad = 'DV1-' + btoa(JSON.stringify({ v: 1, who: 'a', stage: 'flying', note: '', at: 'x' })).replace(/=+$/, '');
    expect(decodeAnswer(bad)).toBeNull();
  });
});
