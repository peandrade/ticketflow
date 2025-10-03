import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const stripeMock = vi.hoisted(() => ({
  checkout: { sessions: { create: vi.fn() } },
}));

const prismaMock = vi.hoisted(() => ({
  ticketVariant: { findMany: vi.fn() },
  order: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
}));

const authMock = vi.hoisted(() => ({ getSessionUser: vi.fn() }));

vi.mock('@/core/clients', () => ({
  stripe: stripeMock,
  prisma: prismaMock,
}));

vi.mock('@/core/auth', () => ({
  getSessionUser: authMock.getSessionUser,
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: (_: string) => null })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { redirect } from 'next/navigation';

const loadSut = async () =>
  (await import('./startCheckoutFromCart')).startCheckoutFromCart;

describe('startCheckoutFromCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripeMock.checkout.sessions.create.mockReset();
    prismaMock.ticketVariant.findMany.mockReset();
    prismaMock.order.create.mockReset();
    prismaMock.order.update.mockReset();
    prismaMock.order.updateMany.mockReset();
    authMock.getSessionUser.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna NEEDS_AUTH quando usuário não está logado', async () => {
    const startCheckoutFromCart = await loadSut();

    const form = new FormData();
    const res = await startCheckoutFromCart({ ok: true }, form);
    expect(res).toEqual({
      ok: false,
      reason: 'NEEDS_AUTH',
      message: 'É necessário entrar para continuar.',
    });
  });

  it('retorna INVALID_CART quando não há items', async () => {
    const startCheckoutFromCart = await loadSut();

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });
    const form = new FormData();
    const res = await startCheckoutFromCart({ ok: true }, form);
    expect(res).toEqual({ ok: false, reason: 'INVALID_CART', message: 'Itens ausentes' });
  });

  it('retorna INVALID_CART quando o JSON de items é inválido', async () => {
    const startCheckoutFromCart = await loadSut();

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });
    const form = new FormData();
    form.set('items', 'não é json');
    const res = await startCheckoutFromCart({ ok: true }, form);
    expect(res).toEqual({ ok: false, reason: 'INVALID_CART', message: 'Carrinho inválido' });
  });

  it('fluxo feliz: cria Order, cria session do Stripe e chama redirect', async () => {
    const startCheckoutFromCart = await loadSut();

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });

    const items = [
      { ticketTypeId: 'tt1', variantId: 'v1', name: 'Inteira', qty: 2, unit: 1000, fee: 100 },
      { ticketTypeId: 'tt2', variantId: 'v2', name: 'Meia', qty: 1, unit: 500 },
    ];
    const form = new FormData();
    form.set('items', JSON.stringify(items));

    prismaMock.ticketVariant.findMany.mockResolvedValue([
      { id: 'v1', ticketTypeId: 'tt1', priceCents: 1000, feeCents: 100, kind: 'Inteira', ticketType: { name: 'Pista' } },
      { id: 'v2', ticketTypeId: 'tt2', priceCents: 500,  feeCents: 0,   kind: 'Meia',    ticketType: { name: 'Arquibancada' } },
    ]);

    prismaMock.order.create.mockResolvedValue({ id: 'o1' });
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'sess_123',
      url: 'https://stripe.test/checkout/sess_123',
    });

    const res = await startCheckoutFromCart({ ok: true }, form);

    expect(prismaMock.ticketVariant.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['v1', 'v2'] } },
      include: { ticketType: { select: { name: true } } },
    });

    expect(prismaMock.order.create).toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: 'teste@teste.com',
        line_items: expect.arrayContaining([
          expect.objectContaining({ quantity: 2 }),
          expect.objectContaining({ quantity: 1 }),
        ]),
        success_url: expect.stringContaining('/checkout/o1/success'),
        cancel_url: expect.stringContaining('/checkout/o1?canceled=1'),
      }),
      { idempotencyKey: 'order_o1' },
    );

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { stripeSessionId: 'sess_123' },
    });

    expect(redirect).toHaveBeenCalledWith('https://stripe.test/checkout/sess_123');
    expect(res).toEqual({ ok: true });
  });

  it('normaliza valores usando fallback do item e 0 quando ausentes (coalesce + ?? 0)', async () => {
    const startCheckoutFromCart = await loadSut();

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });

    const items = [
      { ticketTypeId: 'tt-vip', variantId: 'v-fallback', name: 'Inteira', qty: 3, unit: 700 },
    ];
    const form = new FormData();
    form.set('items', JSON.stringify(items));

    prismaMock.ticketVariant.findMany.mockResolvedValue([
      { id: 'v-fallback', ticketTypeId: 'tt-vip', priceCents: undefined, feeCents: undefined, kind: 'Inteira', ticketType: { name: 'VIP' } },
    ]);

    prismaMock.order.create.mockResolvedValue({ id: 'oX' });
    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'sess_X', url: 'https://stripe.test/checkout/sess_X' });

    const res = await startCheckoutFromCart({ ok: true }, form);
    expect(res).toEqual({ ok: true });

    expect(prismaMock.order.create).toHaveBeenCalled();
    const createArg = prismaMock.order.create.mock.calls[0][0];
    const createdItem = createArg.data.orderItems.create[0];

    expect(createdItem.unit_price_cents).toBe(700);
    expect(createdItem.fee_cents).toBe(0);
    expect(createdItem.unitPriceCents).toBe(700);
  });

  it('lança "Variantes inválidas" quando findMany não retorna todas as variants pedidas', async () => {
    const startCheckoutFromCart = await loadSut();

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });

    const items = [
      { ticketTypeId: 'tt1', variantId: 'v1', name: 'A', qty: 1, unit: 100, fee: 0 },
      { ticketTypeId: 'tt2', variantId: 'v2', name: 'B', qty: 1, unit: 200, fee: 0 },
    ];
    const form = new FormData();
    form.set('items', JSON.stringify(items));

    prismaMock.ticketVariant.findMany.mockResolvedValue([
      { id: 'v1', ticketTypeId: 'tt1', priceCents: 100, feeCents: 0, kind: 'A', ticketType: { name: 'S1' } },
    ]);

    await expect(startCheckoutFromCart({ ok: true }, form)).rejects.toThrow(/Variantes inválidas/);
  });

  it('lança erro quando variant não pertence ao ticketType informado', async () => {
    const startCheckoutFromCart = await loadSut();

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });

    const items = [
      { ticketTypeId: 'tt-certa', variantId: 'v-mismatch', name: 'X', qty: 1, unit: 100, fee: 0 },
    ];
    const form = new FormData();
    form.set('items', JSON.stringify(items));

    prismaMock.ticketVariant.findMany.mockResolvedValue([
      { id: 'v-mismatch', ticketTypeId: 'tt-errada', priceCents: 100, feeCents: 0, kind: 'Inteira', ticketType: { name: 'Setor' } },
    ]);

    await expect(startCheckoutFromCart({ ok: true }, form)).rejects.toThrow(
      /Variant não pertence ao TicketType informado/i,
    );
  });

  it('lança erro quando o Stripe cria sessão sem URL', async () => {
    const startCheckoutFromCart = await loadSut();

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });

    const items = [{ ticketTypeId: '01', variantId: '1', name: 'Inteira', qty: 1, unit: 100, fee: 10 }];
    const form = new FormData();
    form.set('items', JSON.stringify(items));

    prismaMock.ticketVariant.findMany.mockResolvedValue([
      { id: '1', ticketTypeId: '01', priceCents: 100, feeCents: 10, kind: 'Inteira', ticketType: { name: 'Pista' } },
    ]);
    prismaMock.order.create.mockResolvedValue({ id: 'o-no-url' });

    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'sess_no_url', url: undefined });

    await expect(startCheckoutFromCart({ ok: true }, form)).rejects.toThrow(/Sessão de checkout sem URL/);
  });
});

describe('startCheckoutFromCart – cobre unitNoFee ?? 0', () => {
  it('usa 0 quando priceCents e unit estão ausentes (fallback ?? 0)', async () => {
    vi.resetModules();

    vi.doMock('zod', () => {
      const chain = () => ({ int: chain, min: chain, optional: chain });
      const z = {
        string: chain,
        number: chain,
        object: () => ({}) as any,
        array: () => ({ min: () => ({ parse: (x: any) => x }) }) as any,
      };
      return { z };
    });

    vi.doMock('@/core/clients', () => ({ stripe: stripeMock, prisma: prismaMock }));
    vi.doMock('@/core/auth', () => ({ getSessionUser: authMock.getSessionUser }));
    vi.doMock('next/headers', () => ({ headers: vi.fn(async () => ({ get: () => null })) }));
    vi.doMock('next/navigation', () => ({ redirect }));

    const { startCheckoutFromCart } = await import('./startCheckoutFromCart');

    authMock.getSessionUser.mockResolvedValue({ id: '1', email: 'teste@teste.com' });

    const form = new FormData();
    form.set('items', JSON.stringify([{ ticketTypeId: 'tt1', variantId: 'v1', name: 'Inteira', qty: 2 }]));

    prismaMock.ticketVariant.findMany.mockResolvedValue([
      { id: 'v1', ticketTypeId: 'tt1', priceCents: undefined, feeCents: undefined, kind: 'Inteira', ticketType: { name: 'Pista' } },
    ]);
    prismaMock.order.create.mockResolvedValue({ id: 'o1' });
    stripeMock.checkout.sessions.create.mockResolvedValue({ id: 'sess_1', url: 'https://stripe.test/checkout/sess_1' });

    await startCheckoutFromCart({ ok: true }, form);

    expect(prismaMock.order.create).toHaveBeenCalled();
    const createArg = prismaMock.order.create.mock.calls[0][0];
    const createdItem = createArg.data.orderItems.create[0];
    expect(createdItem.unit_price_cents).toBe(0);
    expect(createdItem.unitPriceCents).toBe(0);
  });
});
