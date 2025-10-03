import { prisma } from '@/core/clients/prisma/prisma';
import { slugifyCity } from '@/core/utils/slug/slug';

export type CityKey = { city: string; state: string };

export type CityEventCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  heroPublicId: string | null;

  next: {
    id: string;
    startsAt: Date;
    venueName: string;
    venueCity: string;
    venueState: string;
    minPriceCents?: number;
    maxPriceCents?: number;
  };
};

export async function resolveCityBySlug(citySlug: string, state: string) {
  const venues = await prisma.venue.findMany({
    where: { state },
    select: { city: true },
    distinct: ['city'],
  });
  const match = venues.find(v => slugifyCity(v.city) === citySlug);
  return match?.city ?? null;
}

export async function getCityEvents({ city, state, take = 24 }: CityKey & { take?: number }) {
  const perfs = await prisma.performance.findMany({
    where: {
      startsAt: { gte: new Date() },
      venue: { city, state },
    },
    include: {
      event: { select: { id: true, slug: true, title: true, shortDescription: true, heroPublicId: true } },
      venue: { select: { name: true, city: true, state: true } },
      ticketTypes: { select: { priceCents: true }, orderBy: { priceCents: 'asc' } },
    },
    orderBy: [{ startsAt: 'asc' }],
    take: 500,
  });

  const byEvent = new Map<string, any>();
  for (const p of perfs) {
    if (byEvent.has(p.event.id)) continue;
    byEvent.set(p.event.id, {
      id: p.event.id,
      slug: p.event.slug,
      title: p.event.title,
      shortDescription: p.event.shortDescription,
      heroPublicId: p.event.heroPublicId ?? null,
      next: {
        id: p.id,
        startsAt: p.startsAt,
        venueName: p.venue.name,
        venueCity: p.venue.city,
        venueState: p.venue.state,
        minPriceCents: p.ticketTypes[0]?.priceCents,
        maxPriceCents: p.ticketTypes[p.ticketTypes.length - 1]?.priceCents,
      },
    });
  }

  return Array.from(byEvent.values()).slice(0, take);
}