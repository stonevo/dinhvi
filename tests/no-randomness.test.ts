import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { newId } from '../src/lib/id';

// Nguyên tắc: app không có bất kỳ nguồn ngẫu nhiên nào — không gieo, không tung xu.
const FORBIDDEN = [/Math\.random/, /getRandomValues/, /randomUUID/, /randomBytes/];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('không có ngẫu nhiên', () => {
  it('src/ không gọi API sinh số ngẫu nhiên', () => {
    const offenders = walk(join(__dirname, '..', 'src'))
      .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
      .flatMap((f) => {
        const text = readFileSync(f, 'utf8');
        return FORBIDDEN.filter((re) => re.test(text)).map((re) => `${f}: ${re}`);
      });
    expect(offenders).toEqual([]);
  });

  it('newId xác định và duy nhất trong cùng mili giây', () => {
    const ids = [newId(1000), newId(1000), newId(1000), newId(1001)];
    expect(new Set(ids).size).toBe(4);
    expect(ids[3]).toBe(`${(1001).toString(36)}-000`);
  });
});
