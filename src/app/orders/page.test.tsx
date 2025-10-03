import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const auth = vi.hoisted(() => ({ getSessionUser: vi.fn() }));
vi.mock('@/core/auth', () => ({ getSessionUser: auth.getSessionUser }));

const nav = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: nav.redirect }));

const db = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('@/core/clients', () => ({ prisma: { order: { findMany: db.findMany } } }));

const grid = vi.hoisted(() => ({ lastItems: null as any[] | null }));
vi.mock('@/features/components', () => ({
  OrdersGrid: (props: any) => {
    grid.lastItems = props.items;
    return <div data-testid="orders-grid" />;
  },
}));

// ===== Helpers =====
function makeOrder(over: Partial<any> = {}) {
  return {
    id: 'o1',
    status: 'PAID',
    totalCents: 7000,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    orderItems: [
      {
        ticketType: {
          performance: {
            event: { title: 'Show X', heroPublicId: 'hero_1' },
            venue: { name: 'Arena Y' },
          },
        },
      },
    ],
    ...over,
  };
}

// Import DEPOIS dos mocks
let Page: any;
beforeEach(async () => {
  vi.clearAllMocks();
  grid.lastItems = null;

  // redirect deve "lançar" para simular Next
  nav.redirect.mockImplementation(() => {
    throw new Error('REDIRECT');
  });

  // por padrão, usuário logado (cada teste ajusta se precisar)
  auth.getSessionUser.mockResolvedValue({ id: 'u1', email: 'u@e.com' });

  // reimporta a página para pegar os mocks
  ({ default: Page } = await import('./page'));
});

describe('app/orders/page (RSC)', () => {
  it('redirect para /account quando não autenticado', async () => {
    auth.getSessionUser.mockResolvedValueOnce(null);

    await expect(Page()).rejects.toThrow('REDIRECT');
    expect(nav.redirect).toHaveBeenCalledWith('/account');
    expect(db.findMany).not.toHaveBeenCalled();
  });

  it('renderiza heading quando autenticado', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@e.com' });
    db.findMany.mockResolvedValueOnce([makeOrder()]);

    const ui = await Page();
    render(ui);

    expect(screen.getByRole('heading', { level: 1, name: /meus pedidos/i })).toBeInTheDocument();
    expect(screen.getByTestId('orders-grid')).toBeInTheDocument();
  });

  it('mapeia pedidos para OrderCardItem com fallbacks', async () => {
    auth.getSessionUser.mockResolvedValueOnce({ id: 'u1', email: 'u@e.com' });
    db.findMany.mockResolvedValueOnce([
      makeOrder({
        id: 'o1',
        status: 'PAID',
        totalCents: 7000,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      }),
      makeOrder({
        id: 'o2',
        status: 'REFUNDED',
        totalCents: 5000,
        createdAt: new Date('2025-01-02T00:00:00Z'),
        orderItems: [
          {
            ticketType: {
              performance: {
                event: {}, // sem title/heroPublicId
                venue: {}, // sem name
              },
            },
          },
        ],
      }),
    ]);

    const ui = await Page();
    render(ui);

    // Normaliza createdAt para ISO para comparação estável
    const normalized = (grid.lastItems ?? []).map((i) => ({
      ...i,
      createdAt: new Date(i.createdAt).toISOString(),
    }));

    expect(normalized).toEqual([
      {
        id: 'o1',
        status: 'PAID',
        totalCents: 7000,
        createdAt: '2025-01-01T00:00:00.000Z',
        eventTitle: 'Show X',
        venueName: 'Arena Y',
        coverPublicId: 'hero_1',
      },
      {
        id: 'o2',
        status: 'REFUNDED',
        totalCents: 5000,
        createdAt: '2025-01-02T00:00:00.000Z',
        eventTitle: 'Pedido',
        venueName: '',
        coverPublicId: null,
      },
    ]);
  });
});
