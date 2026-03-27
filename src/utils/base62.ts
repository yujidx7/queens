const ALPH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function encodeBase62FromString(s: string): string {
  const bytes = new TextEncoder().encode(s);
  // convert bytes to BigInt
  let v = 0n;
  for (let i = 0; i < bytes.length; i++) {
    v = (v << 8n) + BigInt(bytes[i]);
  }
  if (v === 0n) return '0';
  let out = '';
  while (v > 0n) {
    const r = Number(v % 62n);
    out = ALPH[r] + out;
    v = v / 62n;
  }
  return out;
}

export function decodeBase62ToString(s: string): string {
  let v = 0n;
  for (let i = 0; i < s.length; i++) {
    const idx = ALPH.indexOf(s[i]);
    if (idx < 0) throw new Error('Invalid base62');
    v = v * 62n + BigInt(idx);
  }
  // convert BigInt to bytes
  const bytes: number[] = [];
  while (v > 0n) {
    bytes.unshift(Number(v & 0xffn));
    v = v >> 8n;
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}
