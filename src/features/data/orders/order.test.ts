import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrderForUser, getOrdersForUser } from './order';

const prisma = vi.hoisted(() => ({
  order: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  }
}));
vi.mock('@/core/clients', () => ({ prisma }));


describe('data/order', () => {
  beforeEach(() => {
    prisma.order.findMany.mockReset();
    prisma.order.findFirst.mockReset();
  });

  it('getOrdersForUser filtra por e-mail (lowercase), ordena por createdAt desc e seleciona campos', async () => {
    prisma.order.findMany.mockResolvedValueOnce([]);
    await getOrdersForUser('USER@EX.COM');

    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userEmail: 'user@ex.com' },
      orderBy: { createdAt: 'desc' },
      select: expect.objectContaining({
        id: true,
        status: true,
        totalCents: true,
        createdAt: true,
      }),
    }));
  });

  it('getOrderForUser inclui itens com performance/venue/event', async () => {
    prisma.order.findFirst.mockResolvedValueOnce(null);

    await getOrderForUser('o1', 'a@a.com');

    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'o1', userEmail: 'a@a.com' },
      include: expect.objectContaining({
        orderItems: expect.objectContaining({
          include: expect.objectContaining({
            ticketType: expect.objectContaining({
              include: expect.objectContaining({
                performance: expect.objectContaining({
                  include: expect.objectContaining({ venue: true, event: true }),
                }),
              }),
            }),
          }),
        }),
      }),
    }));
  });
});
