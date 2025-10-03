import { describe, it, expect } from 'vitest';
import type { OrderStatus } from '@/generated/prisma';
import { refundOrderRules, type RefundCheckInput } from './refundOrder';

function makeInput(partial: Partial<RefundCheckInput> = {}): RefundCheckInput {
  const base: RefundCheckInput = {
    status: 'PAID' as OrderStatus,
    now: new Date('2025-01-10T12:00:00Z'),
    performance: { startsAt: '2025-01-11T12:00:00Z' },
    items: [
      { ticketTypeId: 'vip', quantity: 2 },
      { ticketTypeId: 'meia', quantity: 1 },
    ],
  };
  return { ...base, ...partial };
}

describe('usecases/refundOrderRules', () => {
  it('nega quando o pedido não está pago', () => {
    const input = makeInput({ status: 'CREATED' as OrderStatus });
    const r = refundOrderRules(input);
    expect(r).toEqual({ ok: false, reason: 'Pedido não está pago.' });
  });

  it('nega quando o evento já ocorreu ou está em andamento (startsAt <= now)', () => {
    const now = new Date('2025-01-10T12:00:00Z');
    const input = makeInput({
      now,
      performance: { startsAt: '2025-01-10T12:00:00Z' }, // igual ao now
    });
    const r = refundOrderRules(input);
    expect(r).toEqual({ ok: false, reason: 'O evento já ocorreu ou está em andamento.' });
  });

  it('permite quando o evento ainda não ocorreu (startsAt > now)', () => {
    const now = new Date('2025-01-10T12:00:00Z');
    const input = makeInput({
      now,
      performance: { startsAt: '2025-01-10T12:00:01Z' },
    });
    const r = refundOrderRules(input);
    expect(r.ok).toBe(true);
    expect(r).toMatchObject({
      ok: true,
      restock: [
        { ticketTypeId: 'vip', quantity: 2 },
        { ticketTypeId: 'meia', quantity: 1 },
      ],
    });
  });

  it('permite mesmo sem performance (evento indefinido)', () => {
    const input = makeInput({ performance: null });
    const r = refundOrderRules(input);
    expect(r.ok).toBe(true);
    expect(r).toMatchObject({
      restock: [
        { ticketTypeId: 'vip', quantity: 2 },
        { ticketTypeId: 'meia', quantity: 1 },
      ],
    });
  });

  it('mapeia restock exatamente a partir dos items', () => {
    const input = makeInput({
      items: [
        { ticketTypeId: 'pista', quantity: 5 },
        { ticketTypeId: 'camarote', quantity: 3 },
      ],
    });
    const r = refundOrderRules(input);
    expect(r).toEqual({
      ok: true,
      restock: [
        { ticketTypeId: 'pista', quantity: 5 },
        { ticketTypeId: 'camarote', quantity: 3 },
      ],
    });
  });
});
