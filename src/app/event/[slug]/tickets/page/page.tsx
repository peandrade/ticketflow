import React from 'react';
import { prisma } from '@/core/clients';
import { notFound } from 'next/navigation';
import { TicketFlow } from '@/features/components';
import { startCheckoutFromCart } from '@/app/checkout';
import { getEventWithPerformances, pickPerformance } from '@/features/data';

type Props = {
  params: { slug: string };
  searchParams: Promise<{ perf?: string }>;
};

export default async function TicketsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const event = await getEventWithPerformances(slug);
  if (!event) return notFound();

  const { perf: perfId } = await searchParams;    
  const perf = pickPerformance(event.performances, perfId);
  if (!perf) return notFound();

  const ticketTypes = await prisma.ticketType.findMany({
    where: { performanceId: perf.id },
    include: { variants: { where: { active: true }, orderBy: { priceCents: 'asc' } }, inventory: true },
    orderBy: { priceCents: 'asc' },
  });

  return (
    <TicketFlow performanceId={perf.id} ticketTypes={ticketTypes} startCheckoutAction={startCheckoutFromCart}  />
  );
}
