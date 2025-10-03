import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/core/clients/prisma/prisma', () => ({
  prisma: {
    venue: { findMany: vi.fn() },
    performance: { findMany: vi.fn() },
  },
}));

vi.mock('@/core/clients/prisma/prisma', () => ({
  prisma: { venue: { findMany: vi.fn() }, performance: { findMany: vi.fn() } },
}));

const prismaMock = vi.hoisted(() => ({
  venue: { findMany: vi.fn() }, performance: { findMany: vi.fn() }
}));

vi.mock('@/core/clients/prisma/prisma', () => ({ prisma: prismaMock }));

import { prisma } from '@/core/clients/prisma/prisma';
import { resolveCityBySlug, getCityEvents } from './city';

describe('data/city', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolveCityBySlug retorna o nome correto da cidade a partir do slug', async () => {
    prismaMock.venue.findMany.mockResolvedValue([
      { city: 'Campinas' },
      { city: 'São Paulo' },
      { city: 'Rio de Janeiro' },
    ]);

    await expect(resolveCityBySlug('campinas', 'SP')).resolves.toBe('Campinas');
    await expect(resolveCityBySlug('porto-alegre', 'RS')).resolves.toBeNull();
  });

  it('getCityEvents agrega por evento, pega a próxima performance e calcula min/max price', async () => {
    const now = new Date('2025-01-01T12:00:00Z');
    vi.setSystemTime(now);

    prismaMock.performance.findMany.mockResolvedValue([
      {
        id: 'perf1',
        startsAt: new Date('2025-02-10T20:00:00Z'),
        venue: { name: 'Arena 1', city: 'Campinas', state: 'SP' },
        ticketTypes: [{ priceCents: 5000 }, { priceCents: 10000 }],
        event: {
          id: 'e1',
          slug: 'show-x',
          title: 'Show X',
          shortDescription: 'Desc X',
          heroPublicId: null,
        },
      },
      {
        id: 'perf2',
        startsAt: new Date('2025-03-10T20:00:00Z'),
        venue: { name: 'Arena 2', city: 'Campinas', state: 'SP' },
        ticketTypes: [{ priceCents: 7000 }],
        event: {
          id: 'e1',
          slug: 'show-x',
          title: 'Show X',
          shortDescription: 'Desc X',
          heroPublicId: 'img123',
        },
      },
      {
        id: 'perf3',
        startsAt: new Date('2025-02-05T20:00:00Z'),
        venue: { name: 'Arena 3', city: 'Campinas', state: 'SP' },
        ticketTypes: [{ priceCents: 2000 }, { priceCents: 8000 }],
        event: {
          id: 'e2',
          slug: 'standup-y',
          title: 'Standup Y',
          shortDescription: 'Desc Y',
          heroPublicId: 'h2',
        },
      },
    ]);

    const out = await getCityEvents({ city: 'Campinas', state: 'SP', take: 10 });

    expect(out).toHaveLength(2);

    const e1 = out.find((x) => x.id === 'e1')!;
    expect(e1).toMatchObject({
      slug: 'show-x',
      title: 'Show X',
      shortDescription: 'Desc X',
      heroPublicId: null,
      next: {
        id: 'perf1',
        venueName: 'Arena 1',
        venueCity: 'Campinas',
        venueState: 'SP',
        minPriceCents: 5000,
        maxPriceCents: 10000,
      },
    });

    const e2 = out.find((x) => x.id === 'e2')!;
    expect(e2.next).toMatchObject({
      id: 'perf3',
      minPriceCents: 2000,
      maxPriceCents: 8000,
    });
  });

  it('getCityEvents respeita o parâmetro take (limita o slice)', async () => {
    prismaMock.performance.findMany.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        id: `p${i}`,
        startsAt: new Date(`2025-02-0${i + 1}T20:00:00Z`),
        venue: { name: `V${i}`, city: 'Campinas', state: 'SP' },
        ticketTypes: [{ priceCents: 1000 + i }],
        event: {
          id: `e${i}`,
          slug: `s${i}`,
          title: `T${i}`,
          shortDescription: `D${i}`,
          heroPublicId: null,
        },
      })),
    );

    const out = await getCityEvents({ city: 'Campinas', state: 'SP', take: 2 });
    expect(out).toHaveLength(2);
  });
});
