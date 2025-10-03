import { describe, it, expect, vi, afterEach } from 'vitest';

const bcrypt = vi.hoisted(() => ({ hash: vi.fn(), compare: vi.fn() }));
vi.mock('bcryptjs', () => ({
  hash: bcrypt.hash,
  compare: bcrypt.compare,
}));

import { makeToken, hashToken, hashPassword, verifyPassword } from './crypto';
import { createHash } from 'node:crypto';

afterEach(() => {
  vi.clearAllMocks();
});

describe('lib/crypto', () => {
  it('makeToken retorna base64url válido com comprimento coerente para N bytes', () => {
    const N = 16;
    const t = makeToken(N);

    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBe(22);
  });

  it('hashToken calcula sha256 em base64url', () => {
    const input = 'abc';
    const expected = createHash('sha256').update(input).digest('base64url');
    expect(hashToken(input)).toBe(expected);
  });

  it('hashPassword delega para bcrypt.hash com 12 rounds', async () => {
    bcrypt.hash.mockResolvedValueOnce('hashed!');
    await expect(hashPassword('secret')).resolves.toBe('hashed!');
    expect(bcrypt.hash).toHaveBeenCalledWith('secret', 12);
  });

  it('verifyPassword delega para bcrypt.compare', async () => {
    bcrypt.compare.mockResolvedValueOnce(true);
    await expect(verifyPassword('a', 'b')).resolves.toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('a', 'b');
  });
});
