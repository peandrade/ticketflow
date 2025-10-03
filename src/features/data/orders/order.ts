import { prisma } from '@/core/clients';

export function getOrdersForUser(userEmail: string) {
  return prisma.order.findMany({
    where: { userEmail: userEmail.toLowerCase() },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
    },
  });
}

export function getOrderForUser(orderId: string, userEmail: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userEmail: userEmail.toLowerCase() },
    include: {
      orderItems: {
        include: {
          ticketType: {
            include: {
              performance: {
                include: { venue: true, event: true },
              },
            },
          },
        },
      },
    },
  });
}
