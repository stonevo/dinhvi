import { describe, expect, it } from 'vitest';
import { slugify } from '../src/lib/slug';

describe('slugify', () => {
  it('bỏ dấu, chữ thường, nối bằng gạch', () => {
    expect(slugify('Đầy thì vơi, đi rồi trở lại')).toBe('day-thi-voi-di-roi-tro-lai');
    expect(slugify('  Thái cực đồ thuyết của Chu Đôn Di ')).toBe('thai-cuc-do-thuyet-cua-chu-don-di');
  });
});

describe('neo dẫn tới mục trong bài Nhập môn', () => {
  it('mục "Đầy thì vơi, đi rồi trở lại" (link từ trang Quỹ đạo) còn trong bài Đạo trời', async () => {
    const { readFileSync } = await import('node:fs');
    const intro: { id: string; blocks: { type: string; text?: string }[] }[] = JSON.parse(readFileSync('public/data/intro.json', 'utf8'));
    const heads = intro.find((s) => s.id === 'dao-troi')!.blocks.filter((b) => b.type === 'h').map((b) => slugify(b.text!));
    expect(heads).toContain('day-thi-voi-di-roi-tro-lai');
  });
});
