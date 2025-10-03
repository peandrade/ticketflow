import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const stripeMock = vi.hoisted(() => ({
  webhooks: { constructEvent: vi.fn(), constructEventAsync: vi.fn() },
}));

const prismaMock = vi.hoisted(() => ({
  order: { updateMany: vi.fn() },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: (k: string) => (k === 'stripe-signature' ? 'sig' : null) })),
}));

vi.mock('@/core/clients/stripe/stripe', () => ({
  stripe: stripeMock,
}));

vi.mock('@/core/clients/prisma/prisma', () => ({
  prisma: prismaMock,
}));

import { POST } from './route';
import { OrderStatus } from '@/generated/prisma';

describe('api/webhook/route POST', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('400 quando falta signature ou secret', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = '';
    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(400);
  });

  it('400 quando constructEvent lança erro de verificação', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Bad signature');
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(400);
  });

  it('checkout.session.completed → atualiza pedido para PAID', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123', metadata: { orderId: 'o1' } } },
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: { in: [OrderStatus.CREATED, OrderStatus.FAILED] } },
      data: { status: OrderStatus.PAID },
    });
  });

  it('checkout.session.completed (sem orderId) → usa session.id no where', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_fallback', metadata: {} } },
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        stripeSessionId: 'cs_fallback',
        status: { in: [OrderStatus.CREATED, OrderStatus.FAILED] },
      },
      data: { status: OrderStatus.PAID },
    });
  });

  it('payment_intent.payment_failed → marca como FAILED se não pago', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_123', metadata: { orderId: 'o2' } } },
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'o2', status: { not: OrderStatus.PAID } },
      data: { status: OrderStatus.FAILED },
    });
  });

  it('payment_intent.payment_failed (sem orderId) → não toca no DB', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_456', metadata: {} } },
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
  });

  it('charge.refunded → marca como REFUNDED', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: { object: { id: 'ch_123', metadata: { orderId: 'o3' } } },
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'o3' },
      data: { status: OrderStatus.REFUNDED },
    });
  });

  it('charge.refunded (sem orderId) → não toca no DB', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: { object: { id: 'ch_456', metadata: {} } },
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
  });

  it('evento não suportado (default): retorna 200 sem tocar no DB', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: { object: { id: 'in_123' } },
    });

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(200);
    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
  });

  it('erro interno no handler → 500', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_err', metadata: { orderId: 'oErr' } } },
    });
    prismaMock.order.updateMany.mockRejectedValueOnce(new Error('DB down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(new Request('https://test/webhook', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(500);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
