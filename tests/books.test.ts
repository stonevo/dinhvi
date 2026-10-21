import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blockMarks } from '../src/data/validate';
import { bookChapterSchema, bookSchema } from '../src/types/schema';

const DATA = join(__dirname, '..', 'public', 'data');
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const book = bookSchema.parse(read('books.json')[0]);
const chapter = (id: string) => bookChapterSchema.parse(read(join('books', book.id, `${id}.json`)));

describe('Sách hay: Hoàng Đế Nội Kinh Tố Vấn (Nguyễn Tử Siêu dịch)', () => {
  it('mục lục: Tiểu dẫn, Lời dịch giả và 79 chương theo số của sách (không có 71, 73)', () => {
    const main = book.chapters.filter((c) => c.kind === 'chapter').map((c) => c.n);
    expect(book.chapters.slice(0, 2).map((c) => c.id)).toEqual(['tieu-dan', 'loi-dich-gia']);
    expect(main).toHaveLength(79);
    expect(main).not.toContain(71);
    expect(main).not.toContain(73);
    expect(main[0]).toBe(1);
    expect(main.at(-1)).toBe(81);
  });

  it('không còn lỗi phông ð / ñ', () => {
    for (const c of book.chapters) {
      const s = JSON.stringify(chapter(c.id));
      expect(s.includes('ð') || s.includes('ñ'), c.id).toBe(false);
    }
  });

  it('chương 2: đúng khối, đúng chú giải theo số (đối chiếu bản gõ trang 6)', () => {
    const ch = chapter('2');
    expect(ch.title).toBe('TỨ KHÍ ĐIỀU THẦN LUẬN');
    expect(ch.titleNote).toBe(1);
    const b0 = ch.blocks[0];
    expect(b0.text[0]).toMatch(/^Ba tháng mùa Xuân gọi là PHÁT TRẦN\[\^2\]/);
    expect(blockMarks(b0.text, ch.titleNote)).toEqual([1, 2, 3, 4, 5]);
    expect(b0.notes.find((n) => n.n === 2)?.paras[0]).toMatch(/^Nảy nở cái mới để thay đổi cái cũ/);
    expect(b0.notes.find((n) => n.n === 1)?.paras[0]).toMatch(/^Thần chứa ở 5 Tạng/);
  });

  it('chú gộp "(2-3)" ở chương 70 dùng cho cả hai dấu', () => {
    const n = chapter('70').blocks[0].notes.find((x) => x.to);
    expect(n).toMatchObject({ n: 2, to: 3 });
  });

  it('"số MỘT (1)" là chú số, không phải dấu chú giải (chương 20)', () => {
    const t = chapter('20').blocks[0].text.join(' ');
    expect(t).toContain('số MỘT (1)');
    expect(t).toContain('số CHÍN (9)');
  });

  it('phụ lục bảng thuốc chương 5: cột trái hết rồi mới tới cột phải, số thứ tự liên tục', () => {
    const paras = chapter('5').appendices![0].paras.join('\n');
    const first = paras.slice(paras.indexOf('1)- Những vị KHÍ-BẠC'), paras.indexOf('2)- Những vị KHÍ-HẬU'));
    const nums = [...first.matchAll(/(?:^|\s)(\d+)\. \p{Lu}/gu)].map((m) => Number(m[1]));
    expect(nums).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
  });

  it('bỏ phần 47 mục không thuộc Tố Vấn ở cuối bản gõ', () => {
    const s = JSON.stringify(chapter('81'));
    expect(s).not.toContain('tùng lâm');
    expect(s).not.toContain('TAM QUYẾT');
  });
});
