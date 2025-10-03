import React from 'react';
import Image from 'next/image';
import { urlCdn } from '@/core/utils';
import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/features/data';
import EventClient from './eventClient/eventClient';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getEventBySlug(slug);
  if (!data) return notFound();

  const options = data.performances.map((p) => {
    const prices = p.ticketTypes.map((t) => t.priceCents);
    const available = p.ticketTypes.reduce((sum, t) => sum + (t.inventory?.available ?? 0), 0);
    return {
      id: p.id,
      startsAt: p.startsAt,
      venue: p.venue,
      minPriceCents: prices.length ? Math.min(...prices) : undefined,
      maxPriceCents: prices.length ? Math.max(...prices) : undefined,
      availableTotal: available,
    };
  });

  const policy = {
    serviceFeePercent: 20,
    limitPerCpf: 6,
    halfTicketsPerCpf: 2,
    onlineSaleOpensAt: new Date('2025-04-10T10:00:00-03:00'),
    boxOfficeOpensAt: new Date('2025-04-10T11:00:00-03:00'),
    buyUrl: 'https://www.ticketmaster.com.br',
    onlinePayments: 'Cartão até 3x s/ juros, 4 a 8x c/ juros, Pix',
    boxOfficePayments: 'Cartão 3x s/ juros, Débito, Dinheiro',
  };

  return (
    <>
      <div className="relative aspect-[8/3]">
        <Image
          src={urlCdn(data.heroPublicId!, { w: 1920 })}
          alt={data.title}
          fill
          priority
          sizes="100vw"
        />
      </div>

      <EventClient
        eventSlug={slug}
        title={data.title}
        options={options}
        performancesFull={data.performances}
        policy={policy}
      />
    </>
  );
}
