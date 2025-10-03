import { describe, it, expect, vi } from 'vitest';

const m = vi.hoisted(() => ({
  groupBy: vi.fn(),
  findMany: vi.fn(),
  perfFindMany: vi.fn(),
}));

vi.mock('@/core/clients', () => ({
  prisma: {
    performance: { groupBy: m.groupBy, findMany: m.perfFindMany },
    venue: { findMany: m.findMany },
  },
}));

import { getFeaturedVenues, getAllVenues, getVenueBySlug } from './venues';

describe('data/venues#getFeaturedVenues', () => {
  it('consulta venues mais ativas e retorna lista', async () => {
    m.groupBy.mockResolvedValueOnce([
      { venueId: 'v1', _count: { venueId: 3 } },
      { venueId: 'v2', _count: { venueId: 1 } },
    ]);

    m.findMany.mockResolvedValueOnce([
      { id: 'v1', name: 'Allianz Parque', city: 'São Paulo', state: 'SP', coverPublicId: null },
      { id: 'v2', name: 'Morumbi', city: 'São Paulo', state: 'SP', coverPublicId: null },
    ]);

    const list = await getFeaturedVenues();

    expect(m.groupBy).toHaveBeenCalledTimes(1);
    expect(m.findMany).toHaveBeenCalledTimes(1);

    const args = m.findMany.mock.calls[0][0];
    expect(args).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({
          id: expect.objectContaining({ in: expect.arrayContaining(['v1', 'v2']) }),
        }),
      }),
    );

    expect(list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'v1',
          name: 'Allianz Parque',
          city: 'São Paulo',
          state: 'SP',
          slug: 'allianz-parque--sao-paulo-sp',
          upcomingCount: 3,
        }),
        expect.objectContaining({
          id: 'v2',
          name: 'Morumbi',
          slug: expect.stringMatching(/morumbi--sao-paulo-sp/),
          upcomingCount: 1,
        }),
      ]),
    );
  });
});

describe('data/venues#getAllVenues', () => {
  it('lista todos os venues exceto experiences, ordenados e com upcomingCount', async () => {
    m.findMany.mockResolvedValueOnce([
      {
        id: 'v1',
        name: 'Allianz Parque',
        city: 'São Paulo',
        state: 'SP',
        coverPublicId: 'allianz',
      },
      { id: 'v2', name: 'Morumbi', city: 'São Paulo', state: 'SP', coverPublicId: null },
    ]);
    m.groupBy.mockResolvedValueOnce([
      { venueId: 'v1', _count: { venueId: 3 } },
      { venueId: 'v2', _count: { venueId: 1 } },
    ]);

    const out = await getAllVenues();
    expect(m.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: expect.objectContaining({
            coverPublicId: expect.objectContaining({ in: expect.any(Array) }),
          }),
        }),
        orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
      }),
    );
    expect(out).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'v1',
          name: 'Allianz Parque',
          city: 'São Paulo',
          state: 'SP',
          coverPublicId: 'allianz',
          slug: 'allianz-parque--sao-paulo-sp',
          upcomingCount: 3,
        }),
        expect.objectContaining({
          id: 'v2',
          name: 'Morumbi',
          slug: expect.stringMatching(/morumbi--sao-paulo-sp/),
          upcomingCount: 1,
        }),
      ]),
    );
  });

  it('quando groupBy não trouxer contagem para um venue, upcomingCount deve ser 0', async () => {
    m.findMany.mockResolvedValueOnce([
      { id: 'v1', name: 'A', city: 'São Paulo', state: 'SP', coverPublicId: null },
      { id: 'v3', name: 'Sem Perf', city: 'São Paulo', state: 'SP', coverPublicId: null },
    ]);
    m.groupBy.mockResolvedValueOnce([{ venueId: 'v1', _count: { venueId: 2 } }]);
  
    const out = await getAllVenues();
  
    const v3 = out.find((v) => v.id === 'v3');
    expect(v3).toBeDefined();
    expect(v3?.upcomingCount).toBe(0);
  });
});

describe('data/venues#getVenueBySlug', () => {
  it('retorna null quando o slug é inválido', async () => {
    const res = await getVenueBySlug('invalido');
    expect(res).toBeNull();
  });

  it('busca o venue pelo estado e monta upcoming a partir de performances', async () => {
    m.findMany.mockResolvedValueOnce([
      {
        id: 'v1',
        name: 'Allianz Parque',
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua Palestra',
        capacity: 1000,
        coverPublicId: 'allianz',
      },
      { id: 'v2', name: 'Morumbi', city: 'São Paulo', state: 'SP' },
    ]);
    m.perfFindMany.mockResolvedValueOnce([
      {
        id: 'p1',
        startsAt: new Date('2030-01-01T00:00:00Z'),
        event: { slug: 'show-x', title: 'Show X', heroPublicId: 'cover-x' },
        ticketTypes: [{ priceCents: 1500 }],
      },
      {
        id: 'p2',
        startsAt: new Date('2030-02-01T00:00:00Z'),
        event: { slug: 'show-y', title: 'Show Y', heroPublicId: 'cover-y' },
        ticketTypes: [{ priceCents: 2000 }],
      },
    ]);

    const res = await getVenueBySlug('allianz-parque--sao-paulo-sp');

    expect(m.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ state: 'SP' }) }),
    );
    expect(m.perfFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          venueId: 'v1',
          startsAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
        include: expect.objectContaining({
          event: expect.objectContaining({
            select: expect.objectContaining({ slug: true, title: true, heroPublicId: true }),
          }),
          ticketTypes: expect.objectContaining({
            orderBy: { priceCents: 'asc' },
            select: expect.objectContaining({ priceCents: true }),
          }),
        }),
        orderBy: expect.arrayContaining([{ startsAt: 'asc' }]),
      }),
    );

    expect(res).toEqual(
      expect.objectContaining({
        id: 'v1',
        name: 'Allianz Parque',
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua Palestra',
        capacity: 1000,
        coverPublicId: 'allianz',
        slug: 'allianz-parque--sao-paulo-sp',
        upcoming: [
          expect.objectContaining({
            perfId: 'p1',
            startsAt: expect.any(Date),
            minPriceCents: 1500,
            event: expect.objectContaining({
              slug: 'show-x',
              title: 'Show X',
              heroPublicId: 'cover-x',
            }),
          }),
          expect.objectContaining({
            perfId: 'p2',
            startsAt: expect.any(Date),
            minPriceCents: 2000,
            event: expect.objectContaining({
              slug: 'show-y',
              title: 'Show Y',
              heroPublicId: 'cover-y',
            }),
          }),
        ],
      }),
    );
  });

  it('retorna null quando o slug é válido mas nenhum venue corresponde', async () => {
    m.findMany.mockResolvedValueOnce([
      { id: 'v1', name: 'Allianz Parque', city: 'São Paulo', state: 'SP' },
    ]);
  
    const res = await getVenueBySlug('inexistente--sao-paulo-sp');
    expect(res).toBeNull();
  });
  
  it('quando address/capacity/coverPublicId ausentes, retorna nulls no objeto', async () => {
    m.findMany.mockResolvedValueOnce([
      { id: 'v2', name: 'Morumbi', city: 'São Paulo', state: 'SP' },
    ]);
    m.perfFindMany.mockResolvedValueOnce([]);
  
    const res = await getVenueBySlug('morumbi--sao-paulo-sp');
  
    expect(res).toEqual(
      expect.objectContaining({
        id: 'v2',
        address: null,
        capacity: null,
        coverPublicId: null,
        upcoming: [],
      }),
    );
  });
});
