import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

const stripeMock = vi.hoisted(() => ({
  checkout: { sessions: { retrieve: vi.fn() } },
}));

const prismaMock = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('@/core/clients', () => ({
  stripe: stripeMock,
  prisma: prismaMock,
}));

describe('checkout/[orderId]/success/page (RSC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripeMock.checkout.sessions.retrieve.mockReset();
    prismaMock.order.findUnique.mockReset();
    prismaMock.order.update.mockReset();
    prismaMock.order.updateMany.mockReset();
  });

  it('redireciona para "/" quando não há session_id', async () => {
    const { default: CheckoutSuccessPage } = await import('./page');

    await expect(
      CheckoutSuccessPage({ params: { orderId: 'o1' }, searchParams: {} as any } as any),
    ).rejects.toThrow(/redirect:\/$/);
  });

  it('com session_id: consulta Stripe e mostra tela de processamento CTAs', async () => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      id: 'cs_123',
      payment_status: 'paid',
      customer_email: 'u@e.com',
    });
    prismaMock.order.findUnique.mockResolvedValue({ id: 'o1', status: 'PENDING' });

    const { default: CheckoutSuccessPage } = await import('./page');
    const ui = await CheckoutSuccessPage({
      params: { orderId: 'o1' },
      searchParams: { session_id: 'cs_123' } as any,
    } as any);
    render(ui);

    await waitFor(() => expect(stripeMock.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_123'));
    expect(prismaMock.order.updateMany).toHaveBeenCalled();

    expect(screen.getByRole('heading', { name: /processamento/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /meus pedidos/i })).toHaveAttribute('href', '/orders');
    expect(screen.getByRole('button', { name: /atualizar status/i })).toBeInTheDocument();
  });

  it('quando pedido já está pago: exibe título e mensagem de confirmação e oculta CTA de atualizar', async () => {
    (stripeMock.checkout.sessions.retrieve as any).mockResolvedValue({
      id: 'cs_999',
      payment_status: 'paid',
    });
    (prismaMock.order.findUnique as any).mockResolvedValue({ id: 'o1', status: 'PAID' });

    const { default: CheckoutSuccessPage } = await import('./page');
    const ui = await CheckoutSuccessPage({
      params: { orderId: 'o1' },
      searchParams: { session_id: 'cs_999' } as any,
    } as any);
    render(ui);

    expect(screen.getByRole('heading', { name: /Pagamento confirmado/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Seu pedido foi confirmado\. Você pode ver todos os seus pedidos na página Meus pedidos\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /meus pedidos/i })).toHaveAttribute('href', '/orders');
    expect(screen.queryByRole('button', { name: /atualizar status/i })).toBeNull();
    expect(stripeMock.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_999');
    expect(prismaMock.order.updateMany).toHaveBeenCalled();
  });
});
