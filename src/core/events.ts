import { PrismaClient, Prisma } from '@/generated/prisma';
const prisma = new PrismaClient();

export type ListEventsParams = {
  page?: number;
  take?: number;
  q?: string | null;
};

export async function listEvents({ page = 0, take = 12, q }: ListEventsParams) {
  const where: Prisma.EventWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }, // Prisma não aceita _min aqui — usamos ordenação estável
        { title: 'asc' },
      ],
      skip: page * take,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        heroPublicId: true,
        description: true,
        _count: { select: { performances: true } },
        performances: {
          orderBy: { startsAt: 'asc' }, // pega a PRÓXIMA data para exibir
          take: 1,
          select: { startsAt: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { items, total, page, take, hasMore: (page + 1) * take < total };
}
