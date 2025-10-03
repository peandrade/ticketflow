import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderDetailPage from './page';

const nav = vi.hoisted(() => ({ notFound: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: nav.notFound }));

const auth = vi.hoisted(() => ({ getSessionUser: vi.fn() }));
vi.mock('@/core/auth', () => ({ getSessionUser: auth.getSessionUser }));

const db = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock('@/core/clients', () => ({ prisma: { order: { findUnique: db.findUnique } } }));

vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
}));

function makeOrder(over: Partial<any> = {}) {
  return {
    id: 'o1',
    userEmail: 'u@a.com',
    status: 'PAID',
    orderItems: [
      { id: 'i1', unitPriceCents: 1500, quantity: 2, ticketType: { name: 'Pista' } },
      { id: 'i2', unitPriceCents: 2000, quantity: 1, ticketType: { name: 'Camarote' } },
    ],
    ...over,
  };
}

describe('orders/[orderId]/page (RSC) – OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getSessionUser.mockReset();
    db.findUnique.mockReset();
  });

  it('notFound quando não logado', async () => {
    auth.getSessionUser.mockResolvedValueOnce(null);

    await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);

    expect(nav.notFound).toHaveBeenCalled();
    expect(db.findUnique).not.toHaveBeenCalled();
  });

  it('notFound quando pedido não existe', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(null);

    await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);

    expect(nav.notFound).toHaveBeenCalled();
  });

  it('notFound quando pedido não pertence ao usuário', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'me@mine.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ userEmail: 'other@mail.com' }));

    await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);

    expect(nav.notFound).toHaveBeenCalled();
  });

  it('renderiza itens, total e status "Confirmado" quando PAID', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder());

    const ui = await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);
    render(ui as any);

    expect(screen.getByRole('heading', { name: /Pedido o1/i })).toBeInTheDocument();

    expect(screen.getByText('Pista')).toBeInTheDocument();
    expect(screen.getByText('2 × R$ 15.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 30.00')).toBeInTheDocument();

    expect(screen.getByText('Camarote')).toBeInTheDocument();
    expect(screen.getByText('1 × R$ 20.00')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 20.00').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 50.00')).toBeInTheDocument();

    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: /Meus pedidos/i });
    expect(backLink).toHaveAttribute('href', '/orders');
  });

  it('status "Falhou" para FAILED (mapeado)', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ status: 'FAILED' }));

    const ui = await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);
    render(ui as any);

    expect(screen.getByText('Falhou')).toBeInTheDocument();
  });

  it('status "Pendente" para CREATED e "Reembolsado" para REFUNDED', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ status: 'CREATED' }));

    const ui1 = await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);
    render(ui1 as any);
    expect(screen.getByText('Pendente')).toBeInTheDocument();

    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ status: 'REFUNDED' }));

    const ui2 = await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);
    render(ui2 as any);
    expect(screen.getByText('Reembolsado')).toBeInTheDocument();
  });

  it('usa o fallback "Ingresso" quando o ticketType não existe', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(
      makeOrder({
        orderItems: [{ id: 'i1', unitPriceCents: 1500, quantity: 2, ticketType: null as any }],
      }),
    );

    const ui = await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);
    render(ui as any);

    expect(screen.getByText('Ingresso')).toBeInTheDocument();
    expect(screen.getByText('2 × R$ 15.00')).toBeInTheDocument();

    const itemRow = screen.getByText('Ingresso').closest('li')!;
    expect(within(itemRow).getByText('R$ 30.00')).toBeInTheDocument();

    expect(screen.getAllByText('R$ 30.00').length).toBeGreaterThanOrEqual(2);
  });

  it('fallback do prettyStatus usa o valor bruto quando status é desconhecido', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ status: 'ON_HOLD' }));

    const ui = await OrderDetailPage({ params: Promise.resolve({ orderId: 'o1' }) } as any);
    render(ui as any);

    expect(screen.getByText('ON_HOLD')).toBeInTheDocument();
  });

  it('mostra aviso quando canceled="1" e status !== PAID', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ status: 'CREATED' }));

    const ui = await OrderDetailPage({
      params: Promise.resolve({ orderId: 'o1' }),
      searchParams: { canceled: '1' },
    } as any);
    render(ui as any);

    const alert = screen.getByRole('status');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveTextContent('Pagamento não concluído. Você pode retomar abaixo.');
  });

  it('mostra aviso quando canceled="true" e status !== PAID', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ status: 'CREATED' }));

    const ui = await OrderDetailPage({
      params: Promise.resolve({ orderId: 'o1' }),
      searchParams: { canceled: 'true' },
    } as any);
    render(ui as any);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Pagamento não concluído. Você pode retomar abaixo.',
    );
  });

  it('não mostra aviso quando status = PAID mesmo com canceled', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@a.com' });
    db.findUnique.mockResolvedValueOnce(makeOrder({ status: 'PAID' }));

    const ui = await OrderDetailPage({
      params: Promise.resolve({ orderId: 'o1' }),
      searchParams: { canceled: '1' },
    } as any);
    render(ui as any);

    expect(screen.queryByRole('status')).toBeNull();
  });
});
