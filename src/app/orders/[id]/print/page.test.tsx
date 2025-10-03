import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'u1', email: 'a@a.com' } as { id: string; email: string },

  getOrderForUser: vi.fn(),
  hasStripe: vi.fn(() => true),
  retrieve: vi.fn(),
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
  stripe: { checkout: { sessions: { retrieve: h.retrieve } } },
}));

vi.mock('@/features/components', () => ({
  PrintAuto: () => <div data-testid="print-auto" />,
}));

vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) =>
    `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`,
}));

import * as session from '@/core/auth';
import Page from './page';

const makeOrder = (over: Partial<any> = {}): any => {
  const base: any = {
    id: 'o1',
    status: 'PAID',
    totalCents: 13000,
    createdAt: new Date('2024-01-02T03:04:05.000Z'),
    stripeSessionId: 'cs_test_1',
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
          name: 'Setor A',
          performance: {
            startsAt: new Date('2099-01-01T00:00:00Z'),
            venue: { city: 'Sampa' },
            event: { title: 'Banda X' },
          },
        },
      },
      {
        id: 'oi2',
        quantity: 2,
        unit_price_cents: 3000,
        ticketType: {
          name: 'VIP',
          performance: {
            startsAt: new Date('2099-01-01T00:00:00Z'),
            venue: { city: 'Sampa' },
            event: { title: 'Banda X' },
          },
        },
      },
      {
        id: 'oi3',
        quantity: 1,
        unitPriceCents: 1000,
        fee_cents: 2000,
        ticketType: null,
      },
    ],
  };
  return { ...base, ...over };
};

beforeEach(() => {
  vi.clearAllMocks();

  h.user = { id: 'u1', email: 'a@a.com' };
  (session.getSessionUser as any).mockImplementation(() =>
    Promise.resolve(h.user),
  );

  h.getOrderForUser.mockReset();
  h.hasStripe.mockReturnValue(true);
  h.retrieve.mockReset();
});

describe('orders/[id]/print/page (RSC) – PrintOrderPage', () => {
  it('notFound quando não logado', async () => {
    (session.getSessionUser as any).mockResolvedValueOnce(null);
    await Page({ params: { id: 'o1' } } as any);
    expect(nav.notFound).toHaveBeenCalled();
  });

  it('notFound quando pedido não existe', async () => {
    h.getOrderForUser.mockResolvedValueOnce(null);
    await Page({ params: { id: 'o1' } } as any);
    expect(nav.notFound).toHaveBeenCalled();
  });

  it('renderiza recibo com itens; subtotais; taxa de serviço explícita; dados do cartão e status', async () => {
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.retrieve.mockResolvedValueOnce({
      payment_intent: { payment_method: { card: { brand: 'visa', last4: '4242' } } },
    });

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.getByTestId('print-auto')).toBeInTheDocument();
    expect(
      screen.getByText(/Detalhes do pedido #o1/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Banda X - Sampa/i)).toBeInTheDocument();

    expect(
      screen.getByText(/Pista - Meia-Entrada - Cadeira/),
    ).toBeInTheDocument();
    expect(screen.getByText('1 × R$ 48,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 48,00')).toBeInTheDocument();

    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('2 × R$ 30,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 60,00')).toBeInTheDocument();

    expect(screen.getByText('Ingresso')).toBeInTheDocument();
    expect(screen.getByText('1 × R$ 0,00')).toBeInTheDocument();
    expect(screen.getByText('Ingressos')).toBeInTheDocument();
    expect(screen.getByText('R$ 108,00')).toBeInTheDocument();
    expect(screen.getByText('Taxa de serviço')).toBeInTheDocument();
    expect(screen.getByText('R$ 22,00')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 130,00')).toBeInTheDocument();

    expect(screen.getByText(/Meio de pagamento/i)).toBeInTheDocument();
    expect(screen.getByText(/visa/i)).toBeInTheDocument();
    expect(screen.getByText(/\*{4} \*{4} \*{4} 4242/)).toBeInTheDocument();
    expect(screen.getByText(/Aprovado/i)).toBeInTheDocument();
  });

  it('service fee via fallback (sem fee explícita)', async () => {
    h.getOrderForUser.mockResolvedValueOnce(
      makeOrder({
        stripeSessionId: null,
        totalCents: 3500,
        orderItems: [
          { id: 'a', quantity: 1, unitPriceCents: 1000, ticketType: { name: 'A', performance: { startsAt: new Date(), venue: { city: 'X' }, event: { title: 'E' } } } },
          { id: 'b', quantity: 1, unit_price_cents: 2000, ticketType: { name: 'B', performance: { startsAt: new Date(), venue: { city: 'X' }, event: { title: 'E' } } } },
        ],
      }),
    );
    h.hasStripe.mockReturnValueOnce(false);

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.getByText('R$ 30,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 5,00')).toBeInTheDocument(); 
    expect(screen.getByText('R$ 35,00')).toBeInTheDocument();
  });

  it('Stripe retrieve falha → marca “—” para brand/last4', async () => {
    h.getOrderForUser.mockResolvedValueOnce(makeOrder());
    h.retrieve.mockRejectedValueOnce(new Error('boom')); // cai no catch

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0); // brand e/ou last4
  });

  it('usa event.name quando não há event.title', async () => {
    const order = makeOrder();
    (order.orderItems[0].ticketType.performance as any).event = { name: 'Artista Y' };
    h.getOrderForUser.mockResolvedValueOnce(order);
    h.hasStripe.mockReturnValueOnce(false);

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.getByText(/Artista Y - Sampa/i)).toBeInTheDocument();
  });

  it('paymentStatusLabel: mostra "Reembolsado", "Falhou" e default "Em processamento"', async () => {
    h.getOrderForUser.mockResolvedValueOnce(
      makeOrder({ status: 'REFUNDED', stripeSessionId: null })
    );
    h.hasStripe.mockReturnValueOnce(false);
    let Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText('Reembolsado')).toBeInTheDocument();

    h.getOrderForUser.mockResolvedValueOnce(
      makeOrder({ status: 'FAILED', stripeSessionId: null })
    );
    h.hasStripe.mockReturnValueOnce(false);
    Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText('Falhou')).toBeInTheDocument();

    h.getOrderForUser.mockResolvedValueOnce(
      makeOrder({ status: 'CREATED', stripeSessionId: null })
    );
    h.hasStripe.mockReturnValueOnce(false);
    Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);
    expect(screen.getByText('Em processamento')).toBeInTheDocument();
  });

  it('fallback do título: usa event.name quando event.title ausente e concatena cidade', async () => {
    const order = makeOrder();
    (order.orderItems[0].ticketType.performance as any).event = { name: 'Artista Y' };
    (order.orderItems[0].ticketType.performance as any).venue = { city: 'Sampa' };

    h.getOrderForUser.mockResolvedValueOnce(order);
    h.hasStripe.mockReturnValueOnce(false);

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.getByText(/Artista Y - Sampa/i)).toBeInTheDocument();
  });

  it('quando city ausente, não insere " - " após o título', async () => {
    const order = makeOrder();
    (order.orderItems[0].ticketType.performance as any).event = { title: 'Banda Z' };
    (order.orderItems[0].ticketType.performance as any).venue = {};

    h.getOrderForUser.mockResolvedValueOnce(order);
    h.hasStripe.mockReturnValueOnce(false);

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.getByText('Banda Z')).toBeInTheDocument();
    expect(screen.queryByText(/Banda Z\s*-\s*/)).toBeNull();
  });

  it('não havendo performance: ev=null, title undefined; não renderiza bloco de título/cidade', async () => {
    const order = makeOrder({
      stripeSessionId: null,
      orderItems: [
        {
          id: 'oi1',
          quantity: 1,
          unitPriceCents: 10000,
          ticketType: { name: 'Pista' },
        } as any,
      ],
    });

    h.getOrderForUser.mockResolvedValueOnce(order);
    h.hasStripe.mockReturnValueOnce(false);

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.queryByText(/ - /)).toBeNull();
    expect(screen.queryByText(/Sampa/i)).toBeNull();
    expect(screen.queryByText(/Banda X|Artista Y/i)).toBeNull();
  });

  it('havendo performance mas event=null: title continua undefined e header não aparece', async () => {
    const order = makeOrder();
    (order.orderItems[0].ticketType.performance as any).event = null;

    h.getOrderForUser.mockResolvedValueOnce(order);
    h.hasStripe.mockReturnValueOnce(false);

    const Comp = await Page({ params: { id: 'o1' } } as any);
    render(Comp as any);

    expect(screen.queryByText(/Banda X/i)).toBeNull();
    expect(screen.queryByText(/ - Sampa/i)).toBeNull();
  });

});
