import { describe, it, expect, vi } from 'vitest';

const h = vi.hoisted(() => ({ findMany: vi.fn(), findUnique: vi.fn() }));

vi.mock('@/core/clients', () => ({
  prisma: { event: { findMany: h.findMany, findUnique: h.findUnique } },
}));

import { getEventsForHome, getEventBySlug } from './event';

describe('data/event#getEventsForHome', () => {
  it('consulta eventos com select/order/take/where esperados', async () => {
    h.findMany.mockResolvedValueOnce([]);
    await getEventsForHome();

    expect(h.findMany).toHaveBeenCalledTimes(1);
    expect(h.findMany.mock.calls.length).toBeGreaterThan(0);
    const args = h.findMany.mock.calls[0]![0]!;

    expect(args).toEqual(
      expect.objectContaining({
        take: expect.any(Number),
        orderBy: expect.objectContaining({ title: 'asc' }),
        where: expect.objectContaining({
          slug: expect.objectContaining({
            notIn: expect.any(Array),
          }),
        }),
        select: expect.objectContaining({
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          heroPublicId: true,
          performances: expect.objectContaining({
            take: expect.any(Number),
            orderBy: { startsAt: 'asc' },
            where: expect.objectContaining({
              startsAt: expect.objectContaining({ gte: expect.any(Date) }),
            }),
            select: expect.objectContaining({
              startsAt: true,
              venue: expect.objectContaining({
                select: expect.objectContaining({ city: true, state: true }),
              }),
            }),
          }),
        }),
      }),
    );
  });
});

describe('data/event#getEventBySlug', () => {
  it('consulta por slug com include/ordenações esperados', async () => {
    h.findUnique.mockResolvedValueOnce(null);
    await getEventBySlug('rock-in-rio');

    expect(h.findUnique).toHaveBeenCalledTimes(1);
    expect(h.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'rock-in-rio' },
        select: expect.objectContaining({
          id: true,
          title: true,
          heroPublicId: true,
          shortDescription: true,
          performances: expect.objectContaining({
            orderBy: { startsAt: 'asc' },
            select: expect.objectContaining({
              id: true,
              startsAt: true,
              venue: expect.objectContaining({
                select: expect.objectContaining({
                  name: true,
                  city: true,
                  state: true,
                }),
              }),
              ticketTypes: expect.objectContaining({
                orderBy: { priceCents: 'asc' },
                select: expect.objectContaining({
                  id: true,
                  name: true,
                  priceCents: true,
                  initialQuantity: true,
                  inventory: expect.objectContaining({ select: { available: true } }),
                }),
              }),
            }),
          }),
        }),
      }),
    );
  });
});
