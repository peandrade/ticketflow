import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'u1', email: 'a@a.com' } as { id: string; email: string },

  getOrderForUser: vi.fn(),

  hasStripe: vi.fn(() => true),
  retrieve: vi.fn(),
  os: { lastProps: null as any },

  pr: { lastProps: null as any },
}));

const nav = vi.hoisted(() => ({ notFound: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: nav.notFound }));

vi.mock('@/core/auth', () => ({
  getSessionUser: vi.fn(async () => h.user),
}));

vi.mock('@/features/data', () => ({
  getOrderForUser: h.getOrderForUser,
}));

vi.mock('@/core/clients', () => ({
  hasStripe: h.hasStripe,
  stripe: {
    checkout: { sessions: { retrieve: h.retrieve } },
  },
}));

vi.mock('@/features/components', () => ({
  BackLink: () => <div data-testid="back-link" />,
  OrderSummary: (props: any) => {
    h.os.lastProps = props;
    return (
      <div data-testid="order-summary" data-can-refund={props?.canRefund ? 'true' : 'false'} />
    );
  },
  PrintReceiptButton: (props: any) => {
    h.pr.lastProps = props;
    return <div data-testid="print-receipt" />;
  },
}));

vi.mock('@/app/checkout/[orderId]/actions/actions', () => ({
  continueCheckoutAction: vi.fn(),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : ''} {...rest}>
      {children}
    </a>
  ),
}));

import * as session from '@/core/auth';
import Page from './page';

const makeOrder = (over: Partial<any> = {}): any => {
  const base: any = {
    id: 'o1',
    status: 'PAID',
    totalCents: 10000,
    createdAt: new Date().toISOString(),
    stripeSessionId: 'cs_test_1',
    orderItems: [
      {
        id: 'oi1',
        quantity: 1,
        unitPriceCents: 10000,
        ticketType: {
          name: 'Pista',
          performance: {
            startsAt: new Date('2099-01-01T00:00:00Z').toISOString(),
            venue: { city: 'Sampa' },
            event: { title: 'Banda X' },
          },
        },
      },
    ],
  };
  return { ...base, ...over };
};

beforeEach(() => {
  vi.clearAllMocks();

  h.user = { id: 'u1', email: 'a@a.com' };
  (session.getSessionUser as any).mockImplementation(() => Promise.resolve(h.user));

  h.getOrderForUser.mockReset();
  h.hasStripe.mockReturnValue(true);
  h.retrieve.mockReset();
  h.os.lastProps = null;
});

describe('app/orders/[id]/page (RSC)', () => {
  it('notFound quando pedido não existe', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'user@ex.com' });
    h.getOrderForUser.mockResolvedValueOnce(null);

    await Page({ params: { id: 'invalid' } } as any);
    expect(nav.notFound).toHaveBeenCalled();
  });

  it('notFound quando não logado', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce(null);
    await Page({ params: { id: 'o1' } } as any);
    expect(nav.notFound).toHaveBeenCalled();
  });

  it('renderiza detalhes quando pedido existe', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.getOrderForUser.mockResolvedValueOnce({
      id: 'o1',
      status: 'PAID',
      totalCents: 10000,
      createdAt: new Date().toISOString(),
      orderItems: [],
      stripeSessionId: 'cs_x',
    });

    const Comp = await Page({ params: { id: 'o1' } } as any);

    expect(h.getOrderForUser).toHaveBeenCalledWith('o1', 'a@a.com');

    render(Comp as any);

    expect(screen.getByRole('heading', { level: 1, name: /pedido/i })).toBeInTheDocument();

    expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
    expect(screen.getByText('Detalhes do pagamento')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();

    expect(screen.queryByText(/o1/i)).not.toBeNull();
  });

  it('canRefund = true (PAID, evento futuro, sem bloqueio)', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(false);
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('true');
  });

  it('canRefund = false quando evento passado', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    const past = makeOrder({
      orderItems: [
        {
          id: 'oi1',
          quantity: 1,
          unitPriceCents: 10000,
          ticketType: {
            name: 'Pista',
            performance: {
              startsAt: new Date('2000-01-01T00:00:00Z').toISOString(),
              venue: { city: 'Sampa' },
              event: { title: 'Banda X' },
            },
          },
        },
      ],
    });
    h.getOrderForUser.mockResolvedValueOnce(past);
    h.hasStripe.mockReturnValueOnce(false);
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('false');
  });

  it('Stripe: charge em disputa → banner e canRefund=false', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockResolvedValueOnce({
      payment_intent: {
        payment_method: { card: { brand: 'visa', last4: '4242' } },
        latest_charge: { disputed: true, refunded: false },
      },
    });
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText(/Pagamento em disputa/i)).toBeInTheDocument();
    expect(screen.getByText(/indisponível/i)).toBeInTheDocument();
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('false');
    expect(screen.getByText(/visa/i)).toBeInTheDocument();
    expect(screen.getByText(/\*{4} \*{4} \*{4} 4242/)).toBeInTheDocument();
  });

  it('Stripe: charge já estornado → banner e canRefund=false', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockResolvedValueOnce({
      payment_intent: {
        payment_method: { card: { brand: 'visa', last4: '4242' } },
        latest_charge: { disputed: false, refunded: true },
      },
    });
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText(/Pagamento já estornado/i)).toBeInTheDocument();
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('false');
  });

  it('Stripe: latest_charge como string → sem bloqueio e canRefund=true', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockResolvedValueOnce({
      payment_intent: {
        payment_method: { card: { brand: 'mastercard', last4: '9999' } },
        latest_charge: 'ch_123',
      },
    });
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.queryByText(/Reembolso automático indisponível/i)).toBeNull();
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('true');
    expect(screen.getByText(/mastercard/i)).toBeInTheDocument();
    expect(screen.getByText(/\*{4} \*{4} \*{4} 9999/)).toBeInTheDocument();
  });

  it('label de status default (CREATED → "Em processamento")', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder({ status: 'CREATED' }));
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText('Em processamento')).toBeInTheDocument();
  });

  it('exibe artista via event.name quando title está ausente', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    const order = makeOrder();
    (order.orderItems[0].ticketType.performance as any).event = { name: 'Artista Y' };
    h.getOrderForUser.mockResolvedValueOnce(order);
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText(/Artista Y - Sampa/i)).toBeInTheDocument();
  });

  it('Stripe: somente brand sem last4 → mostra brand e mantém cartão como "—"', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockResolvedValueOnce({
      payment_intent: {
        payment_method: { card: { brand: 'amex' } },
        latest_charge: { disputed: false, refunded: false },
      },
    });
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText(/amex/i)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('Stripe: somente last4 sem brand → mostra **** 1234 e brand "—"', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockResolvedValueOnce({
      payment_intent: {
        payment_method: { card: { last4: '1234' } },
        latest_charge: { disputed: false, refunded: false },
      },
    });
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText(/\*{4} \*{4} \*{4} 1234/)).toBeInTheDocument();
  });

  it('Stripe: latest_charge com propriedade "dispute" (não "disputed") → bloqueia reembolso', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockResolvedValueOnce({
      payment_intent: {
        payment_method: { card: { brand: 'visa', last4: '4242' } },
        latest_charge: { dispute: { id: 'dp_1' } },
      },
    });
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText(/Pagamento em disputa/i)).toBeInTheDocument();
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('false');
  });

  it('Stripe: retrieve falha (catch silencioso) → sem banner e canRefund=true', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockRejectedValueOnce(new Error('boom'));
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.queryByText(/Reembolso automático indisponível/i)).toBeNull();
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('true');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('calcula serviceFeeCents explícito e mapeia itens/valores', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    const order = makeOrder({
      stripeSessionId: null,
      orderItems: [
        {
          id: 'oi1',
          quantity: 1,
          unitPriceCents: 5000,
          ticketType: {
            name: 'Setor A',
            performance: {
              startsAt: new Date('2099-01-01').toISOString(),
              venue: { city: 'Sampa' },
              event: { title: 'Banda X' },
            },
          },
          fee_cents: 200,
          kind: 'HALF',
          seat_type: 'Cadeira',
          sector: 'Pista',
        } as any,
        {
          id: 'oi2',
          quantity: 2,
          unitPriceCents: 3500,
          ticketType: {
            name: 'Setor B',
            performance: {
              startsAt: new Date('2099-01-01').toISOString(),
              venue: { city: 'Sampa' },
              event: { title: 'Banda X' },
            },
          },
          unit_price_cents: 3000,
        } as any,
      ],
      totalCents: 11500,
    });
    h.getOrderForUser.mockResolvedValueOnce(order);
    h.hasStripe.mockReturnValueOnce(false);
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(h.os.lastProps.serviceFeeCents).toBe(200);
    expect(h.os.lastProps.items).toHaveLength(2);
    expect(h.os.lastProps.items[0].unitPriceCents).toBe(4800);
    expect(h.os.lastProps.items[0].name).toMatch(/Pista - Meia-Entrada - Cadeira/);
    expect(h.os.lastProps.items[1].unitPriceCents).toBe(3000);
  });

  it('exibe artista e cidade quando performance presente', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText(/Banda X - Sampa/i)).toBeInTheDocument();
  });

  it('label de status correto (REFUNDED e FAILED)', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder({ status: 'REFUNDED' }));
    const Comp1 = await Page({ params: { id: 'o1' } } as any);
    render(Comp1 as any);
    expect(screen.getByText('Reembolsado')).toBeInTheDocument();

    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder({ status: 'FAILED' }));
    const Comp2 = await Page({ params: { id: 'o2' } } as any);
    render(Comp2 as any);
    expect(screen.getByText('Falhou')).toBeInTheDocument();
  });

  it('Stripe: latest_charge ausente (undefined) → sem bloqueio e canRefund=true', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'e@x.com' });
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.hasStripe.mockReturnValueOnce(true);
    h.retrieve.mockResolvedValueOnce({
      payment_intent: {
        payment_method: { card: { brand: 'elo', last4: '1111' } },
        latest_charge: undefined,
      },
    });

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.queryByText(/Reembolso automático indisponível/i)).toBeNull();
    expect(screen.getByTestId('order-summary').getAttribute('data-can-refund')).toBe('true');
    expect(screen.getByText(/elo/i)).toBeInTheDocument();
    expect(screen.getByText(/\*{4} \*{4} \*{4} 1111/)).toBeInTheDocument();
  });

  it('mapeia receiptItems (fee_cents, unit_price_cents, fallbacks) e mostra banner quando canceled="1" e status != PAID', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.hasStripe.mockReturnValueOnce(false);

    const order = makeOrder({
      status: 'CREATED',
      stripeSessionId: null,
      totalCents: 11500,
      orderItems: [
        {
          id: 'oi1',
          quantity: 1,
          unitPriceCents: 5000,
          fee_cents: 200,
          sector: 'Pista',
          kindLabel: 'Meia-Entrada',
          seat_type: 'Cadeira',
          ticketType: {
            name: 'Ignorado',
            performance: {
              startsAt: new Date('2099-01-01T00:00:00Z').toISOString(),
              venue: { city: 'Sampa' },
              event: { title: 'Banda X' },
            },
          },
        } as any,
        {
          id: 'oi2',
          quantity: 2,
          unit_price_cents: 3000,
          ticketType: {
            name: 'VIP',
            performance: {
              startsAt: new Date('2099-01-01T00:00:00Z').toISOString(),
              venue: { city: 'Sampa' },
              event: { title: 'Banda X' },
            },
          },
        } as any,
        {
          id: 'oi3',
          quantity: 1,
          unitPriceCents: 1000,
          fee_cents: 2000,
          ticketType: {} as any,
        } as any,
      ],
    });

    h.getOrderForUser.mockResolvedValueOnce(order);

    const Comp = await Page({ params: { id: 'o1' }, searchParams: { canceled: '1' } } as any);
    render(Comp as any);

    expect(screen.getByRole('status')).toHaveTextContent(/Pagamento cancelado/i);

    const pr = h.pr.lastProps!;
    expect(pr.orderId).toBe('o1');
    expect(pr.items).toHaveLength(3);

    expect(pr.items[0]).toMatchObject({
      id: 'oi1',
      quantity: 1,
      unitPriceCents: 4800,
    });
    expect(pr.items[0].name).toMatch(/Pista - Meia-Entrada - Cadeira/);

    expect(pr.items[1]).toMatchObject({
      id: 'oi2',
      quantity: 2,
      unitPriceCents: 3000,
      name: 'VIP',
    });

    expect(pr.items[2]).toMatchObject({
      id: 'oi3',
      quantity: 1,
      unitPriceCents: 0,
      name: 'Ingresso',
    });
  });

  it('mostra banner quando canceled="true" e status != PAID; não mostra quando PAID', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.hasStripe.mockReturnValueOnce(false);
    h.getOrderForUser.mockResolvedValueOnce(
      makeOrder({ status: 'CREATED', stripeSessionId: null }),
    );
    const Comp1 = await Page({ params: { id: 'o1' }, searchParams: { canceled: 'true' } } as any);
  
    const r1 = render(Comp1 as any);
    expect(screen.getByRole('status')).toHaveTextContent(/Pagamento cancelado/i);
  
    r1.unmount();
  
    (session.getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@a.com' });
    h.hasStripe.mockReturnValueOnce(false);
    h.getOrderForUser.mockResolvedValueOnce(makeOrder({ status: 'PAID' }));
    const Comp2 = await Page({ params: { id: 'o1' }, searchParams: { canceled: 'true' } } as any);
    render(Comp2 as any);
  
    expect(screen.queryByRole('status')).toBeNull();
  });
});
