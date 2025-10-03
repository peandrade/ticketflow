import React from 'react';
import { prisma } from '@/core/clients';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/core/auth';
import { OrderCardItem, OrdersGrid } from '@/features/components';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect('/account');

  const orders = await prisma.order.findMany({
    where: { userEmail: user.email },
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        include: {
          ticketType: {
            include: {
              performance: { include: { event: true, venue: true } },
            },
          },
        },
      },
    },
  });
  
  const items: OrderCardItem[] = orders.map((o) => {
    const it = o.orderItems[0];
    const perf = it?.ticketType?.performance;
    const ev = perf?.event as { title?: string; heroPublicId?: string | null } | undefined;
    const venue = perf?.venue as { name?: string } | undefined;
    return {
      id: o.id,
      status: o.status as OrderCardItem['status'],
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      eventTitle: ev?.title ?? 'Pedido',
      venueName: venue?.name ?? '',
      coverPublicId: ev?.heroPublicId ?? null,
    };
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Meus pedidos</h1>
      <OrdersGrid items={items} />
    </main>
  );
}
