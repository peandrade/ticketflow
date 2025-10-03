import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

const cookieStore: { value?: string } = {};
const cookiesMock = {
  get: vi.fn((n: string) =>
    n === 'session' && cookieStore.value ? { value: cookieStore.value } : undefined,
  ),
  set: vi.fn((n: string, v: string) => {
    if (n === 'session') cookieStore.value = v;
  }),
};

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => cookiesMock) }));

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
  session: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/core/clients/prisma/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(async (pw: string) => `hash(${pw})`), compare: vi.fn() },
}));

import bcrypt from 'bcryptjs';
import * as sessionMod from './session';
import { createSession, getSessionUser, logout } from './session';

describe('lib/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.value = '';
    prismaMock.session.delete.mockResolvedValue(undefined);
  });

  it('getSessionUser retorna null quando não há cookie', async () => {
    const u = await sessionMod.getSessionUser();
    expect(u).toBeNull();
  });

  it('loginWithPassword retorna null quando usuário não existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await sessionMod.loginWithPassword('x@y.com', 'pw');
    expect(res).toBeNull();
  });

  it('loginWithPassword retorna null quando senha não confere', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
    (bcrypt as any).compare.mockResolvedValue(false);
    const res = await sessionMod.loginWithPassword('x@y.com', 'pw');
    expect(res).toBeNull();
  });

  it('loginWithPassword retorna usuário quando senha confere (sessão tratada em outro nível)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'x@y.com',
      passwordHash: 'h',
    });
    (bcrypt as any).compare.mockResolvedValue(true);
    const res = await sessionMod.loginWithPassword('x@y.com', 'pw');
    expect(res).toMatchObject({ id: 'u1', email: 'x@y.com' });
  });

  it('registerUser cria user (email normalizado) e retorna o user', async () => {
    prismaMock.user.create.mockResolvedValue({ id: 'u2', email: 'a@b.com', name: 'A' });
    const res = await sessionMod.registerUser('A', 'A@B.com', 'pw123');
    expect(res).toMatchObject({ id: 'u2', email: 'a@b.com', name: 'A' });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { name: 'A', email: 'a@b.com', passwordHash: expect.stringContaining('hash(') },
    });
  });

  it('createSession persiste hash derivado do cookie e seta cookie httpOnly', async () => {
    await createSession('u1', 7);

    const token = cookieStore.value!;
    const expectedHash = createHash('sha256').update(token).digest('base64url');

    expect(prismaMock.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'u1', tokenHash: expectedHash }),
    });
    expect(cookiesMock.set).toHaveBeenCalledWith(
      'session',
      token,
      expect.objectContaining({ httpOnly: true, path: '/', maxAge: expect.any(Number) }),
    );
  });

  it('getSessionUser retorna usuário quando sessão é válida', async () => {
    const token = 'dummyToken';
    cookieStore.value = token;
    const tokenHash = createHash('sha256').update(token).digest('base64url');

    prismaMock.session.findUnique.mockResolvedValue({
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'u1', email: 'a@b.com' },
    });

    const user = await getSessionUser();
    expect(user).toMatchObject({ id: 'u1', email: 'a@b.com' });
    expect(prismaMock.session.findUnique).toHaveBeenCalledWith({
      where: { tokenHash },
      include: { user: true },
    });
  });

  it('getSessionUser expira sessão vencida e limpa cookie', async () => {
    const token = 'dummyToken2';
    cookieStore.value = token;
    const tokenHash = createHash('sha256').update(token).digest('base64url');

    prismaMock.session.findUnique.mockResolvedValue({
      tokenHash,
      expiresAt: new Date(Date.now() - 1),
      user: { id: 'u1' },
    });

    const user = await getSessionUser();
    expect(user).toBeNull();
    expect(prismaMock.session.delete).toHaveBeenCalledWith({ where: { tokenHash } });
  });

  it('logout deleta sessão e limpa cookie quando cookie existe', async () => {
    const token = 'dummyToken3';
    cookieStore.value = token;
    const tokenHash = createHash('sha256').update(token).digest('base64url');

    await logout();

    expect(prismaMock.session.delete).toHaveBeenCalledWith({ where: { tokenHash } });
    expect(cookiesMock.set).toHaveBeenCalledWith(
      'session',
      '',
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it('getSessionUser retorna null quando cookie existe mas sessão não encontrada', async () => {
    const token = 'ghost-token';
    cookieStore.value = token;
    const tokenHash = createHash('sha256').update(token).digest('base64url');

    prismaMock.session.findUnique.mockResolvedValue(null);

    const res = await getSessionUser();

    expect(prismaMock.session.findUnique).toHaveBeenCalledWith({
      where: { tokenHash },
      include: { user: true },
    });

    expect(res).toBeNull();
    expect(prismaMock.session.delete).not.toHaveBeenCalled();
    expect(cookiesMock.set).not.toHaveBeenCalledWith('session', '', expect.anything());
  });
});
