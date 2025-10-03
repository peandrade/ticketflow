import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEventWithPerformances, pickPerformance } from './performance';
import { getFamilyExperiences } from '../../experiences';

// Hoisted spies compartilhados pelos dois caminhos do prisma
const h = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));

// getEventWithPerformances importa de '@/core/clients/prisma/prisma'
vi.mock('@/core/clients/prisma/prisma', () => ({
  prisma: { event: { findUnique: h.findUnique } },
}));

// getFamilyExperiences importa de '@/core/clients'
vi.mock('@/core/clients', () => ({
  prisma: { event: { findMany: h.findMany } },
}));

describe('pickPerformance', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('retorna a primeira quando o perfId ausente', () => {
    expect(pickPerformance(list, undefined)).toEqual(list[0]);
  });

  it('retorna a correspondente quando o perfId existe', () => {
    expect(pickPerformance(list, 'b')).toEqual(list[1]);
  });

  it('fallback para a primeira quando o perfId não existe', () => {
    expect(pickPerformance(list, 'z')).toEqual(list[0]);
  });

  it('retorna null para a lista vazia', () => {
    expect(pickPerformance([], 'a')).toBeNull();
  });
});

describe('getEventWithPerformances', () => {
  beforeEach(() => {
    h.findUnique.mockReset();
    h.findMany.mockReset();
  });

  it('retorna objeto quando passa parametro com valor', async () => {
    h.findUnique.mockResolvedValueOnce({ id: '1' });

    const result = await getEventWithPerformances('bruno-mars');

    expect(h.findUnique).toHaveBeenCalledTimes(1);
    expect(h.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'bruno-mars' },
        include: expect.objectContaining({
          performances: expect.objectContaining({
            orderBy: { startsAt: 'asc' },
            include: expect.objectContaining({
              venue: true,
              ticketTypes: expect.objectContaining({
                orderBy: { priceCents: 'asc' },
                include: { inventory: true },
              }),
            }),
          }),
        }),
      }),
    );
    expect(result).toEqual({ id: '1' });
  });

  it('retorna objeto null quando encaminha query vazia', async () => {
    h.findUnique.mockResolvedValueOnce(null);
    const result = await getEventWithPerformances('');
    expect(h.findUnique).toHaveBeenCalledTimes(1);
    expect(h.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: '' } }));
    expect(result).toBeNull();
  });

  it('retorna objeto null quando encaminha null', async () => {
    h.findUnique.mockResolvedValueOnce(null);
    const result = await getEventWithPerformances(null as unknown as string);
    expect(h.findUnique).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('Erro do banco de dados', async () => {
    h.findUnique.mockRejectedValueOnce(new Error('Db down'));
    await expect(getEventWithPerformances('x')).rejects.toThrow('Db down');
  });
});

describe('data/experiences#getFamilyExperiences', () => {
  beforeEach(() => {
    h.findMany.mockReset();
  });

  it('filtra pelos slugs e retorna apenas próximo horário', async () => {
    h.findMany.mockResolvedValueOnce([]);

    await getFamilyExperiences();

    expect(h.findMany).toHaveBeenCalledTimes(1);
    expect(h.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: expect.objectContaining({ in: expect.any(Array) }),
        }),
        orderBy: { title: 'asc' },
        select: expect.objectContaining({
          id: true,
          title: true,
          slug: true,
          heroPublicId: true,
          shortDescription: true,
          performances: expect.objectContaining({
            where: expect.objectContaining({
              startsAt: expect.objectContaining({ gte: expect.any(Date) }),
            }),
            orderBy: { startsAt: 'asc' },
            take: 1,
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
