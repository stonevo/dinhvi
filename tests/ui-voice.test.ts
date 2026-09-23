import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findForbidden } from '../src/lib/lint';

// "Không có câu nào trong app nói cho người dùng phải làm gì": ngoài vi.ts
// (đã lint riêng), quét mọi chuỗi viết cứng trong mã nguồn giao diện.

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// lint.ts chứa chính danh sách từ cấm; vi.ts được lint theo luật đầy đủ ở lint.test.ts.
const SKIP = [/lint\.ts$/, /i18n[\\/]vi\.ts$/];

/** Chuỗi trong nháy và nội dung text JSX (giữa > và <). */
function literals(source: string): string[] {
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const quoted = [...noComments.matchAll(/(['"`])((?:\\.|(?!\1).)*?)\1/g)].map((m) => m[2]);
  const jsxText = [...noComments.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
  return [...quoted, ...jsxText].filter((s) => /[\p{L}]/u.test(s));
}

describe('giọng giao diện', () => {
  it('bộ trích chuỗi bắt được chuỗi trong nháy và text JSX, bỏ qua comment', () => {
    const src = `// bạn nên đọc\nconst a = 'Bạn sẽ thắng';\nconst b = <p>Nên dừng lại</p>;\n/* phải */`;
    const found = literals(src).flatMap(findForbidden);
    expect(found).toEqual(['sẽ', 'nên']);
  });

  it('không có chuỗi mệnh lệnh/tiên tri viết cứng trong src/', () => {
    const offenders = walk(join(__dirname, '..', 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !SKIP.some((re) => re.test(f)))
      .flatMap((f) =>
        literals(readFileSync(f, 'utf8')).flatMap((s) => findForbidden(s).map((w) => `${f}: "${s}" (${w})`)),
      );
    expect(offenders).toEqual([]);
  });
});
