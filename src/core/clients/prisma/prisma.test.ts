import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const PRISMA_H = vi.hoisted(() => ({
  PrismaClient: vi.fn().mockImplementation((opts) => ({ __opts: opts })),
}));
vi.mock('@/generated/prisma', () => ({ PrismaClient: PRISMA_H.PrismaClient }));

describe('lib/prisma', () => {
  beforeEach(() => {
    vi.resetModules();
    PRISMA_H.PrismaClient.mockReset();
    delete (globalThis as any).prisma;
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('em development: cria PrismaClient com logs detalhados e grava em global', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const mod = await import('@/core/clients/prisma/prisma');

    expect(PRISMA_H.PrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({ log: ['query', 'error', 'warn'] }),
    );
    expect((globalThis as any).prisma).toBe(mod.prisma);
  });

  it('em production: não escreve no global e usa log=["error"]', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const mod = await import('@/core/clients/prisma/prisma');

    expect(PRISMA_H.PrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({ log: ['error'] }),
    );
    expect((globalThis as any).prisma).toBeUndefined();
    expect(mod.prisma).toBeTruthy();
  });
});
