import { describe, expect, it } from 'vitest';
import { suggestDomain } from '../src/cast/NextPositioning';
import type { Domain } from '../src/types/schema';

const d = (id: string, name: string): Domain => ({ id, profileId: 'me', name, createdAt: '1', archived: false });
const domains = [d('a', 'Công việc'), d('b', 'Gia đình'), d('c', 'Sức khỏe'), d('e', 'Tài chính')];

describe('gợi ý lĩnh vực sau khi gieo', () => {
  it('khớp tên lĩnh vực với ngữ cảnh câu hỏi, không phân biệt dấu', () => {
    expect(suggestDomain(domains, 'work')?.id).toBe('a');
    expect(suggestDomain(domains, 'money')?.id).toBe('e');
    expect(suggestDomain(domains, 'health')?.id).toBe('c');
    expect(suggestDomain(domains, 'love')?.id).toBe('b');
    expect(suggestDomain([d('x', 'SUC KHOE')], 'health')?.id).toBe('x');
  });
  it('bộ 8 lĩnh vực mặc định: mỗi ngữ cảnh khớp đúng lĩnh vực', async () => {
    const { DEFAULT_DOMAIN_NAMES } = await import('../src/db/db');
    const eight = DEFAULT_DOMAIN_NAMES.map((n, i) => d(String(i), n));
    expect(suggestDomain(eight, 'work')?.name).toBe('Công việc/sự nghiệp');
    expect(suggestDomain(eight, 'money')?.name).toBe('Tài chính/kinh doanh');
    expect(suggestDomain(eight, 'love')?.name).toBe('Tình cảm/hôn nhân');
    expect(suggestDomain(eight, 'health')?.name).toBe('Sức khoẻ');
    expect(suggestDomain(eight, 'travel')?.name).toBe('Đi lại/nơi ở/tìm kiếm');
  });
  it('không khớp hoặc không có ngữ cảnh thì không gợi ý', () => {
    expect(suggestDomain(domains, 'travel')).toBeUndefined();
    expect(suggestDomain(domains, undefined)).toBeUndefined();
  });
});
