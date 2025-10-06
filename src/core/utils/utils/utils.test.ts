import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cn } from './utils';

const STRIPE_H = vi.hoisted(() => ({
  Ctor: vi.fn().mockReturnValue({ _mock: 'stripe' }),
}));
vi.mock('stripe', () => ({ default: STRIPE_H.Ctor }));

describe('cn', () => {
  it('concatena strings e ignora valores falsy', () => {
    expect(cn('a', undefined as any, '', false as any, 'c')).toBe('a c');
  });

  it('mescla classes Tailwind conflitantes sem duplicar', () => {
    const result = cn('px-2 py-1', 'px-4', null as any);
    expect(result).toContain('px-4');
    expect(result).not.toMatch(/\bpx-2\b/);
    expect(result).toContain('py-1');
  });
});

describe('lib/stripe', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  beforeEach(() => {
    vi.resetModules();
    STRIPE_H.Ctor.mockReset();
  });

  it('hasStripe=false e stripe=null quando sem chave', async () => {
    const mod = await import('../../clients/stripe');
    expect(mod.hasStripe()).toBe(false);
    expect(STRIPE_H.Ctor).not.toHaveBeenCalled();
    expect(mod.stripe).toBeNull();
  });

  it('instancia Stripe com apiVersion quando existe chave', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    const mod = await import('../../clients/stripe');
    expect(mod.hasStripe()).toBe(true);
    expect(STRIPE_H.Ctor).toHaveBeenCalledWith(
      'sk_test_123',
      expect.objectContaining({ apiVersion: expect.any(String) }),
    );
    expect((STRIPE_H.Ctor as any).mock.instances[0]).toBe(mod.stripe);
    expect(mod.stripe).toBeTruthy();
  });
});
