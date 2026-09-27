import { describe, expect, it } from 'vitest';
import { decryptText, encryptText, newKey, unlockKey } from '../src/sync/crypto';

describe('mã hoá đồng bộ', () => {
  it('mã hoá rồi giải mã đúng nguyên văn; mật khẩu sai thì không mở được', async () => {
    const { key, info } = await newKey('mật khẩu riêng');
    const text = 'Định Vị — nhật ký tự soi '.repeat(2000);
    const ct = await encryptText(text, key);
    expect(ct).not.toContain('Định');
    expect(await decryptText(ct, key)).toBe(text);
    const again = await unlockKey('mật khẩu riêng', info);
    expect(again).not.toBeNull();
    expect(await decryptText(ct, again!)).toBe(text);
    expect(await unlockKey('sai', info)).toBeNull();
  }, 30_000);
});
