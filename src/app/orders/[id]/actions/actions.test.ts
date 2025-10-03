import { describe, it, expect, vi, beforeEach } from 'vitest';

const H = vi.hoisted(() => ({
  user: { id: 'u1', email: 'a@b.com' } as { id: string; email: string },

  findFirst: vi.fn(),
  tx: {
    order: { update: vi.fn() },
    inventory: { upsert: vi.fn() },
  },
  runTxOk: true,
  $transaction: vi.fn(async (fn: any) => {
    if (!H.runTxOk) throw new Error('tx fail');
    return fn(H.tx);
  }),

  hasStripe: vi.fn(() => true),
  retrieve: vi.fn(),
  refundCreate: vi.fn(),

  rules: vi.fn<(p: any) => { ok: boolean; reason?: string }>(),
  reval: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getSessionUser: vi.fn(async () => H.user),
}));

vi.mock('@/core/clients', () => ({
  prisma: {
    order: { findFirst: H.findFirst },
    $transaction: H.$transaction,
  },
  hasStripe: H.hasStripe,
  stripe: {
    checkout: { sessions: { retrieve: H.retrieve } },
    refunds: { create: H.refundCreate },
  },
}));

vi.mock('@/usecases', () => ({
  refundOrderRules: H.rules as any,
}));

vi.mock('next/cache', () => ({
  revalidatePath: H.reval,
}));

import { getSessionUser } from '@/core/auth';
import { requestRefundAction } from './actions';

const baseOrder = (over: Partial<any> = {}) => ({
  id: 'o1',
  userEmail: 'user@mail.com',
  status: 'PAID',
  stripeSessionId: 'cs_test_1',
  totalCents: 3000,
  orderItems: [
    {
      ticketTypeId: 'tt1',
      quantity: 2,
      ticketType: { performance: { startsAt: new Date().toISOString() } },
    },
  ],
  ...over,
});

const makeFD = (orderId?: string) => {
  const fd = new FormData();
  if (orderId) fd.set('orderId', orderId);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();

  H.user = { id: 'u1', email: 'a@b.com' };
  (getSessionUser as any).mockImplementation(() => Promise.resolve(H.user));

  H.findFirst.mockReset();
  H.tx.order.update.mockReset();
  H.tx.inventory.upsert.mockReset();
  H.runTxOk = true;

  H.hasStripe.mockReturnValue(true);
  H.retrieve.mockReset();
  H.refundCreate.mockReset();

  H.rules.mockReset();
  H.rules.mockReturnValue({ ok: true });
  H.reval.mockReset();
});

describe('requestRefundAction', () => {
  it('retorna erro quando não logado', async () => {
    (getSessionUser as any).mockResolvedValueOnce(null);
    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ error: 'Faça login para continuar.' });
  });

  it('retorna erro quando orderId ausente/inválido', async () => {
    const res = await requestRefundAction({}, makeFD());
    expect(res).toEqual({ error: 'Pedido inválido.' });
  });

  it('retorna erro quando pedido não encontrado', async () => {
    H.user = { id: 'u1', email: 'user@mail.com' };
    (getSessionUser as any).mockResolvedValue(H.user);

    H.findFirst.mockResolvedValueOnce(null);

    const res = await requestRefundAction({}, makeFD('o1'));

    expect(H.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'o1',
          userEmail: 'user@mail.com',
        }),
        include: expect.any(Object),
      }),
    );
    expect(res).toEqual({ error: 'Pedido não encontrado.' });
  });

  it('retorna erro de negócio quando refundOrderRules nega', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder());
    H.rules.mockReturnValueOnce({ ok: false, reason: 'JANELA_EXPIRADA' });
    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ error: 'JANELA_EXPIRADA' });
    expect(H.refundCreate).not.toHaveBeenCalled();
  });

  it('sem stripe ou sem sessionId: só atualiza DB e revalida caminhos', async () => {
    H.hasStripe.mockReturnValueOnce(false);
    H.findFirst.mockResolvedValueOnce(baseOrder({ stripeSessionId: null }));
    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).not.toHaveBeenCalled();
    expect(H.tx.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'REFUNDED' },
    });
    expect(H.tx.inventory.upsert).toHaveBeenCalled();
    expect(H.reval).toHaveBeenCalledWith('/orders/o1');
    expect(H.reval).toHaveBeenCalledWith('/orders');
  });

  it('stripe ok: cria refund com amount = min(total, amount_received) e finaliza DB', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 3000 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: 4000,
      payment_intent: {
        id: 'pi_1',
        amount_received: 2500,
        latest_charge: { disputed: false, refunded: false },
      },
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
      amount: 2500,
      reason: 'requested_by_customer',
    });
    expect(H.tx.order.update).toHaveBeenCalled();
    expect(H.reval).toHaveBeenCalledWith('/orders/o1');
    expect(H.reval).toHaveBeenCalledWith('/orders');
  });

  it('stripe com charge disputada: retorna mensagem e não mexe no DB', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder());
    H.retrieve.mockResolvedValueOnce({
      amount_total: 3000,
      payment_intent: {
        id: 'pi_1',
        amount_received: 3000,
        latest_charge: { disputed: true, refunded: false },
      },
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res.error).toMatch(/disputa/i);
    expect(H.tx.order.update).not.toHaveBeenCalled();
  });

  it('stripe lança "charge_disputed": retorna erro específico', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder());
    H.retrieve.mockRejectedValueOnce({ code: 'charge_disputed' });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res.error).toMatch(/disputa/i);
    expect(H.tx.order.update).not.toHaveBeenCalled();
  });

  it('DB falha: já estornado no cartão => retorna mensagem especial', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder());
    H.retrieve.mockRejectedValueOnce({ code: 'charge_already_refunded' });
    H.runTxOk = false;

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res.error).toMatch(/estornado no cartão/i);
  });

  it('DB falha sem alreadyRefunded: retorna "Falha ao finalizar reembolso."', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder());
    H.hasStripe.mockReturnValueOnce(false);
    H.runTxOk = false;

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ error: 'Falha ao finalizar reembolso.' });
  });

  it('stripe lança erro com raw.code = "charge_disputed": retorna erro específico e não toca no DB', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder());
    H.retrieve.mockRejectedValueOnce({ raw: { code: 'charge_disputed' } });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res.error).toMatch(/disputa/i);
    expect(H.refundCreate).not.toHaveBeenCalled();
    expect(H.tx.order.update).not.toHaveBeenCalled();
    expect(H.tx.inventory.upsert).not.toHaveBeenCalled();
  });

  it('refund_already_exists via raw.code e DB falha: retorna mensagem de estorno no cartão', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 3000 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: 3000,
      payment_intent: {
        id: 'pi_1',
        amount_received: 3000,
        latest_charge: { disputed: false, refunded: false },
      },
    });
    H.refundCreate.mockRejectedValueOnce({ raw: { code: 'refund_already_exists' } });
    H.runTxOk = false;

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res.error).toMatch(/estornado no cartão/i);
  });

  it('session sem payment_intent: não cria refund e finaliza no DB', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder());
    H.retrieve.mockResolvedValueOnce({
      amount_total: 3000,
      payment_intent: null,
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).not.toHaveBeenCalled();
    expect(H.tx.order.update).toHaveBeenCalled();
  });

  it('latest_charge como string: trata como sem disputa e usa amount_received', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 4000 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: 9999,
      payment_intent: {
        id: 'pi_1',
        amount_received: 3500,
        latest_charge: 'ch_1',
      },
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
      amount: 3500,
      reason: 'requested_by_customer',
    });
  });

  it('amount_received ausente: usa amount_total da session', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 3000 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: 2000,
      payment_intent: {
        id: 'pi_1',
        amount_received: null,
        latest_charge: { disputed: false, refunded: false },
      },
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
      amount: 2000,
      reason: 'requested_by_customer',
    });
  });

  it('amount_received e amount_total ausentes: usa order.totalCents', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 4500 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: undefined,
      payment_intent: {
        id: 'pi_1',
        amount_received: undefined,
        latest_charge: { disputed: false, refunded: false },
      },
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
      amount: 4500,
      reason: 'requested_by_customer',
    });
  });

  it('latest_charge já refundado: não cria refund e segue DB', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 3000 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: 3000,
      payment_intent: {
        id: 'pi_1',
        amount_received: 3000,
        latest_charge: { disputed: false, refunded: true },
      },
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).not.toHaveBeenCalled();
    expect(H.tx.order.update).toHaveBeenCalled();
  });

  it('refund_already_exists  falha no DB: retorna mensagem especial de estorno no cartão', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 3000 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: 3000,
      payment_intent: {
        id: 'pi_1',
        amount_received: 3000,
        latest_charge: { disputed: false, refunded: false },
      },
    });
    H.refundCreate.mockRejectedValueOnce({ code: 'refund_already_exists' });
    H.runTxOk = false;

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res.error).toMatch(/estornado no cartão/i);
  });

  it('hasStripe true mas sem sessionId: não chama Stripe e só finaliza no DB', async () => {
    H.hasStripe.mockReturnValueOnce(true);
    H.findFirst.mockResolvedValueOnce(baseOrder({ stripeSessionId: null }));

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.retrieve).not.toHaveBeenCalled();
    expect(H.refundCreate).not.toHaveBeenCalled();
    expect(H.tx.order.update).toHaveBeenCalled();
  });

  it('atualiza inventário para cada item do pedido', async () => {
    const order = baseOrder({
      stripeSessionId: null,
      orderItems: [
        {
          ticketTypeId: 'tt1',
          quantity: 2,
          ticketType: { performance: { startsAt: new Date().toISOString() } },
        },
        {
          ticketTypeId: 'tt2',
          quantity: 1,
          ticketType: { performance: { startsAt: new Date().toISOString() } },
        },
      ],
    });
    H.hasStripe.mockReturnValueOnce(false);
    H.findFirst.mockResolvedValueOnce(order);

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.tx.inventory.upsert).toHaveBeenCalledTimes(2);
    expect(H.tx.inventory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ticketTypeId: 'tt1' },
        update: { available: { increment: 2 } },
      }),
    );
    expect(H.tx.inventory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ticketTypeId: 'tt2' },
        update: { available: { increment: 1 } },
      }),
    );
  });

  it('chama refundOrderRules com performance: null quando não há performance', async () => {
    const order = baseOrder({
      orderItems: [
        {
          ticketTypeId: 'tt1',
          quantity: 1,
          ticketType: { performance: null },
        },
      ],
    });
    H.findFirst.mockResolvedValueOnce(order);

    await requestRefundAction({}, makeFD('o1'));
    expect(H.rules).toHaveBeenCalledWith(
      expect.objectContaining({
        status: order.status,
        items: [{ ticketTypeId: 'tt1', quantity: 1 }],
        performance: null,
      }),
    );
  });

  it('latest_charge ausente (undefined): trata como null e cria refund normalmente', async () => {
    H.findFirst.mockResolvedValueOnce(baseOrder({ totalCents: 3000 }));
    H.retrieve.mockResolvedValueOnce({
      amount_total: 4000,
      payment_intent: {
        id: 'pi_1',
        amount_received: 2000,
        latest_charge: undefined,
      },
    });

    const res = await requestRefundAction({}, makeFD('o1'));
    expect(res).toEqual({ ok: true });
    expect(H.refundCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
      amount: 2000,
      reason: 'requested_by_customer',
    });
  });
});
