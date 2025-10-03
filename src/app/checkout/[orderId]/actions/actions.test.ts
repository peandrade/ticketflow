import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { headers } from 'next/headers';

const auth = vi.hoisted(() => ({ getSessionUser: vi.fn() }));
vi.mock('@/core/auth', () => ({ getSessionUser: auth.getSessionUser }));

const stripeMock = vi.hoisted(() => ({
  checkout: { sessions: { retrieve: vi.fn(), create: vi.fn() } },
}));

const prismaMock = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), update: vi.fn() },
}));

vi.mock('@/core/clients/stripe/stripe', () => ({
  stripe: stripeMock,
}));

vi.mock('@/core/clients/prisma/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: (k: string) => (k === 'origin' ? 'http://test' : null) })),
}));

import { startCheckoutAction, continueCheckoutAction } from './actions';

describe('checkout/[orderId]/actions.startCheckoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripeMock.checkout.sessions.create.mockReset();
    stripeMock.checkout.sessions.retrieve.mockReset();
    prismaMock.order.update.mockReset();
    prismaMock.order.findUnique.mockReset();
    auth.getSessionUser.mockResolvedValue({ id: 'u1', email: 'u@e.com' });
  });

  it('lança erro quando não autenticado', async () => {
    auth.getSessionUser.mockResolvedValue(null);
    await expect(startCheckoutAction(new FormData())).rejects.toThrow('Não autenticado');
  });

  it('lança erro quando orderId é inválido', async () => {
    await expect(startCheckoutAction(new FormData())).rejects.toThrow('Parâmetro inválido');
  });

  it('lança erro quando pedido não existe ou não pertence ao usuário', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(startCheckoutAction(fd)).rejects.toThrow('Pedido não encontrado');
  });

  it('reaproveita sessão existente e redireciona', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      stripeSessionId: 'cs_123',
      orderItems: [],
    });
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({ url: 'https://stripe.test/cs_123' });

    await expect(startCheckoutAction(fd)).rejects.toThrow('redirect to: https://stripe.test/cs_123');
  });

  it('lança erro quando pedido está vazio', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      stripeSessionId: null,
      orderItems: [],
    });

    await expect(startCheckoutAction(fd)).rejects.toThrow('Pedido vazio');
  });

  it('cria sessão de checkout, atualiza pedido e redireciona (happy path)', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      stripeSessionId: null,
      orderItems: [
        { quantity: 2, unitPriceCents: 1000, ticketType: { name: 'Pista' } },
        { quantity: 1, unitPriceCents: 5000, ticketType: { name: 'VIP' } },
      ],
    });

    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'cs_new',
      url: 'https://stripe.test/cs_new',
    });

    await expect(startCheckoutAction(fd)).rejects.toThrow('redirect to: https://stripe.test/cs_new');

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer_email: 'u@e.com',
        line_items: [
          expect.objectContaining({ quantity: 2 }),
          expect.objectContaining({ quantity: 1 }),
        ],
        success_url: expect.stringContaining('/checkout/o1/success'),
        cancel_url: expect.stringContaining('/checkout/o1?canceled=1'),
        metadata: { orderId: 'o1' },
      }),
      { idempotencyKey: 'order_o1' },
    );

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { stripeSessionId: 'cs_new' },
    });
  });
});

describe('checkout/[orderId]/actions.startCheckoutAction – extras', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    vi.clearAllMocks();
    auth.getSessionUser.mockResolvedValue({ id: 'u1', email: 'u@e.com' });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  function withOrderItems() {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      stripeSessionId: null,
      orderItems: [
        { quantity: 2, unitPriceCents: 1000, ticketType: { name: 'Pista' } },
        { quantity: 1, unitPriceCents: 5000, ticketType: { name: 'VIP' } },
      ],
    });
  }

  it('usa NEXT_PUBLIC_APP_URL quando não há origin (cobre 2º termo do coalesce)', async () => {
    withOrderItems();
    (headers as any).mockResolvedValue({ get: () => null });
    process.env.NEXT_PUBLIC_APP_URL = 'https://env.example';

    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'cs_env',
      url: 'https://stripe.test/cs_env',
    });

    const fd = new FormData();
    fd.set('orderId', 'o1');

    await expect(startCheckoutAction(fd)).rejects.toThrow(
      'redirect to: https://stripe.test/cs_env',
    );
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalled();
  });

  it('usa http://localhost:3000 quando não há origin nem ENV (cobre 3º termo do coalesce)', async () => {
    withOrderItems();
    (headers as any).mockResolvedValue({ get: () => null });
    delete process.env.NEXT_PUBLIC_APP_URL;

    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'cs_def',
      url: 'https://stripe.test/cs_def',
    });

    const fd = new FormData();
    fd.set('orderId', 'o1');

    await expect(startCheckoutAction(fd)).rejects.toThrow(
      'redirect to: https://stripe.test/cs_def',
    );

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalled();
  });

  it('lança erro quando a sessão não tem URL (cobre throw "Sessão sem URL de checkout")', async () => {
    withOrderItems();
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'cs_no_url',
      url: null,
    });

    const fd = new FormData();
    fd.set('orderId', 'o1');

    await expect(startCheckoutAction(fd)).rejects.toThrow('Sessão sem URL de checkout');

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { stripeSessionId: 'cs_no_url' },
    });
  });
});

/* ===========================
   continueCheckoutAction
   =========================== */

describe('checkout/[orderId]/actions.continueCheckoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripeMock.checkout.sessions.create.mockReset();
    stripeMock.checkout.sessions.retrieve.mockReset();
    prismaMock.order.update.mockReset();
    prismaMock.order.findUnique.mockReset();
    auth.getSessionUser.mockResolvedValue({ id: 'u1', email: 'u@e.com' });
    // headers -> origin padrão
    (headers as any).mockResolvedValue({ get: (k: string) => (k === 'origin' ? 'http://test' : null) });
  });

  it('erro quando não autenticado', async () => {
    auth.getSessionUser.mockResolvedValue(null);
    await expect(continueCheckoutAction(new FormData())).rejects.toThrow('Não autenticado');
  });

  it('erro quando orderId ausente', async () => {
    await expect(continueCheckoutAction(new FormData())).rejects.toThrow('Pedido inválido');
  });

  it('erro quando pedido não existe', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(continueCheckoutAction(fd)).rejects.toThrow('Pedido inválido');
  });

  it('erro quando pedido não pertence ao usuário', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'x@z.com',
      status: 'CREATED',
      stripeSessionId: null,
      orderItems: [],
    });

    await expect(continueCheckoutAction(fd)).rejects.toThrow('Pedido inválido');
  });

  it('status PAID: redireciona para success e não chama Stripe', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      status: 'PAID',
      stripeSessionId: 'cs_prev',
      orderItems: [],
    });

    await expect(continueCheckoutAction(fd)).rejects.toThrow('redirect to: /checkout/o1/success');
    expect(stripeMock.checkout.sessions.retrieve).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('stripeSessionId existente e session paga: atualiza status e redireciona para success com session_id', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      status: 'CREATED',
      stripeSessionId: 'cs_prev',
      orderItems: [],
    });

    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      id: 'cs_prev',
      payment_status: 'paid',
    });

    await expect(continueCheckoutAction(fd)).rejects.toThrow(
      'redirect to: /checkout/o1/success?session_id=cs_prev',
    );

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'PAID' },
    });
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('stripeSessionId existente e session aberta com URL: redireciona para URL existente', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      status: 'CREATED',
      stripeSessionId: 'cs_prev',
      orderItems: [],
    });

    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      status: 'open',
      url: 'https://stripe.test/existing',
    });

    await expect(continueCheckoutAction(fd)).rejects.toThrow('redirect to: https://stripe.test/existing');
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it('sem session válida: cria nova sessão com fallback "Ingresso", salva sessionId e redireciona', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      status: 'CREATED',
      stripeSessionId: 'cs_prev',
      orderItems: [
        { quantity: 2, unitPriceCents: 1500, ticketType: { name: 'Pista' } },
        { quantity: 1, unitPriceCents: 3000, ticketType: null }, // <- fallback "Ingresso"
      ],
    });

    stripeMock.checkout.sessions.retrieve.mockResolvedValue(null);
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'cs_new',
      url: 'https://stripe.test/new',
    });

    await expect(continueCheckoutAction(fd)).rejects.toThrow('redirect to: https://stripe.test/new');

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer_email: 'u@e.com',
        line_items: [
          expect.objectContaining({
            quantity: 2,
            price_data: expect.objectContaining({
              unit_amount: 1500,
              product_data: expect.objectContaining({ name: 'Pista' }),
            }),
          }),
          expect.objectContaining({
            quantity: 1,
            price_data: expect.objectContaining({
              unit_amount: 3000,
              product_data: expect.objectContaining({ name: 'Ingresso' }), // fallback
            }),
          }),
        ],
        success_url: 'http://test/checkout/o1/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://test/checkout/o1?canceled=1',
        metadata: { orderId: 'o1' },
      }),
      { idempotencyKey: 'order_o1_resume' },
    );

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { stripeSessionId: 'cs_new' },
    });
  });

  it('cria nova sessão sem URL: lança "Sessão sem URL de checkout"', async () => {
    const fd = new FormData();
    fd.set('orderId', 'o1');
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'o1',
      userEmail: 'u@e.com',
      status: 'CREATED',
      stripeSessionId: null,
      orderItems: [{ quantity: 1, unitPriceCents: 1000, ticketType: { name: 'Pista' } }],
    });

    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'cs_no_url', url: null });

    await expect(continueCheckoutAction(fd)).rejects.toThrow('Sessão sem URL de checkout');

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { stripeSessionId: 'cs_no_url' },
    });
  });
});
