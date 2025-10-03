import { describe, it, expect, vi, afterEach } from 'vitest';
import { getEventWithPerformances, pickPerformance } from '../events';
import { getFamilyExperiences } from './experiences';

import * as PrismaModule from '@/core/clients/prisma/prisma';
import * as ClientsModule from '@/core/clients';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pickPerformance', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('retorna a primeira quando o perfId ausente', () => {
    expect(pickPerformance(list)).toEqual({ id: 'a' });
  });

  it('retorna a correspondente quando o perfId', () => {
    expect(pickPerformance(list, 'b')).toEqual({ id: 'b' });
  });

  it('fallback para a primeira quando o perfId não existe', () => {
    expect(pickPerformance(list, 'x')).toEqual({ id: 'a' });
  });

  it('retorna null para a lista vazia', () => {
    expect(pickPerformance([], 'a')).toBeNull();
  });
});

describe('getEventWithPerformances', () => {
  it('retorna objeto null quando encaminha query vazia', async () => {
    const spy = vi.spyOn(PrismaModule.prisma.event, 'findUnique').mockResolvedValueOnce(null as any);

    const result = await getEventWithPerformances('bruno-mars');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'bruno-mars' } }),
    );
    expect(result).toBeNull();
  });

  it('retorna objeto null quando encaminha null', async () => {
    const spy = vi.spyOn(PrismaModule.prisma.event, 'findUnique').mockResolvedValueOnce(null as any);

    const result = await getEventWithPerformances('' as any);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: '' },
        include: expect.objectContaining({
          performances: expect.objectContaining({
            orderBy: { startsAt: 'asc' },
            include: expect.objectContaining({
              venue: true,
              ticketTypes: expect.objectContaining({
                orderBy: { priceCents: 'asc' },
                include: expect.objectContaining({ inventory: true }),
              }),
            }),
          }),
        }),
      }),
    );
    expect(result).toBeNull();
  });

  it('retorna objeto quando passa parametro com valor', async () => {
    const mockObj = {
      id: '1',
      performances: [{ id: '1', venue: {}, ticketTypes: [{ priceCents: 1000, inventory: {} }] }],
    } as any;

    const spy = vi.spyOn(PrismaModule.prisma.event, 'findUnique').mockResolvedValueOnce(mockObj);

    const result = await getEventWithPerformances('1');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: '1',
      performances: [
        expect.objectContaining({
          ticketTypes: [expect.objectContaining({ priceCents: 1000 })],
        }),
      ],
    });
  });

  it('Erro do banco de dados', async () => {
    const spy = vi
      .spyOn(PrismaModule.prisma.event, 'findUnique')
      .mockRejectedValueOnce(new Error('Db down'));

    await expect(getEventWithPerformances('x')).rejects.toThrow('Db down');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('data/experiences#getFamilyExperiences', () => {
  it('filtra pelos slugs e retorna apenas próximo horário', async () => {
    const spy = vi.spyOn(ClientsModule.prisma.event, 'findMany').mockResolvedValueOnce([]);

    await getFamilyExperiences();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
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
