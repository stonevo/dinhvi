// Mã hoá bản sao lưu trước khi gửi lên đám mây: khoá AES-GCM 256 bit suy từ mật khẩu
// người dùng tự đặt (PBKDF2-SHA-256). Khoá không rời khỏi máy; chủ dự án Firebase chỉ
// thấy chuỗi đã mã hoá. Quên mật khẩu thì không giải mã được bản trên mây.

export const KDF_ITERATIONS = 310_000;
/** Chuỗi mẫu mã hoá kèm trong meta để kiểm mật khẩu đúng hay sai. */
const CHECK_TEXT = 'dinhvi-ok';

export type EncInfo = { salt: string; iter: number; check: string };

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iter = KDF_ITERATIONS): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Mã hoá: base64(iv 12 byte ‖ bản mã). */
export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toB64(out);
}

export async function decryptText(b64: string, key: CryptoKey): Promise<string> {
  const data = fromB64(b64);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.subarray(0, 12) }, key, data.subarray(12));
  return dec.decode(pt);
}

/** Tạo khoá mới từ mật khẩu (muối ngẫu nhiên) kèm thông tin để máy khác mở khoá. */
export async function newKey(passphrase: string): Promise<{ key: CryptoKey; info: EncInfo }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  return { key, info: { salt: toB64(salt), iter: KDF_ITERATIONS, check: await encryptText(CHECK_TEXT, key) } };
}

/** Mở khoá bằng mật khẩu theo thông tin trong meta; sai mật khẩu thì trả null. */
export async function unlockKey(passphrase: string, info: EncInfo): Promise<CryptoKey | null> {
  const key = await deriveKey(passphrase, fromB64(info.salt), info.iter);
  try {
    return (await decryptText(info.check, key)) === CHECK_TEXT ? key : null;
  } catch {
    return null;
  }
}
