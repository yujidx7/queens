import { describe, it, expect } from 'vitest';
import { encodeBase62FromString, decodeBase62ToString } from '../utils/base62';

describe('base62', () => {
  it('encodes and decodes a string', () => {
    const s = JSON.stringify({ a: 1, b: 'hello' });
    const e = encodeBase62FromString(s);
    const d = decodeBase62ToString(e);
    expect(d).toBe(s);
  });
});
