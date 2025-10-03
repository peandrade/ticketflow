import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const nav = vi.hoisted(() => ({ notFound: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: nav.notFound }));

const perf = vi.hoisted(() => ({
  getEventWithPerformances: vi.fn(),
  pickPerformance: vi.fn(),
}));
vi.mock('@/features/data', () => ({
  getEventWithPerformances: perf.getEventWithPerformances,
  pickPerformance: perf.pickPerformance,
}));

const db = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('@/core/clients', () => ({
  prisma: { ticketType: { findMany: db.findMany } },
}));

const checkout = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock('@/app/checkout', () => ({
  startCheckoutFromCart: checkout.start,
}));

const tf = vi.hoisted(() => ({ lastProps: null as any }));
vi.mock('@/features/components', () => ({
  TicketFlow: (props: any) => {
    tf.lastProps = props;
    return <div data-testid="ticket-flow" />;
  },
}));

function makeEvent() {
  return {
    slug: 'show-xyz',
    performances: [{ id: 'p1' }, { id: 'p2' }],
  };
}
function makeTickets() {
  return [
    {
      id: 'tt1',
      name: 'Pista',
      priceCents: 5000,
      variants: [{ id: 'v1', active: true, priceCents: 5000 }],
      inventory: { available: 10 },
    },
  ];
}

describe('app/events/[slug]/tickets (RSC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tf.lastProps = null;
  });

  it('retorna notFound quando evento não existe', async () => {
    perf.getEventWithPerformances.mockResolvedValueOnce(null);

    const { default: Page } = await import('./page');
    await Page({
      params: { slug: 'show-xyz' },
      searchParams: Promise.resolve({ perf: 'p1' }),
    } as any);

    expect(nav.notFound).toHaveBeenCalled();
    expect(perf.getEventWithPerformances).toHaveBeenCalledWith('show-xyz');
    expect(db.findMany).not.toHaveBeenCalled();
  });

  it('retorna notFound quando performance não existe (perf ausente ou inválida)', async () => {
    const ev = makeEvent();
    perf.getEventWithPerformances.mockResolvedValueOnce(ev);
    perf.pickPerformance.mockReturnValueOnce(null);

    const { default: Page } = await import('./page');
    await Page({
      params: { slug: ev.slug },
      searchParams: Promise.resolve({ perf: 'p3' }),
    } as any);

    expect(perf.pickPerformance).toHaveBeenCalledWith(ev.performances, 'p3');
    expect(nav.notFound).toHaveBeenCalled();
    expect(db.findMany).not.toHaveBeenCalled();
  });

  it('renderiza TicketFlow com tickets do Prisma e action startCheckoutFromCart', async () => {
    const ev = makeEvent();
    perf.getEventWithPerformances.mockResolvedValueOnce(ev);
    perf.pickPerformance.mockImplementationOnce((perfs: any[], id?: string) =>
      perfs.find((p) => p.id === id) ?? null,
    );
    db.findMany.mockResolvedValueOnce(makeTickets());

    const { default: Page } = await import('./page');
    const ui = await Page({
      params: { slug: ev.slug },
      searchParams: Promise.resolve({ perf: 'p2' }),
    } as any);

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { performanceId: 'p2' },
        include: expect.objectContaining({
          variants: expect.objectContaining({
            where: { active: true },
            orderBy: { priceCents: 'asc' },
          }),
          inventory: true,
        }),
        orderBy: { priceCents: 'asc' },
      }),
    );

    render(ui as any);
    expect(screen.getByTestId('ticket-flow')).toBeInTheDocument();
    expect(tf.lastProps.performanceId).toBe('p2');
    expect(tf.lastProps.ticketTypes).toEqual(makeTickets());
    expect(tf.lastProps.startCheckoutAction).toBe(checkout.start);
  });
});
