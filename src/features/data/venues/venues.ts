import { prisma } from '@/core/clients';
import { EXPERIENCE_VENUE_COVER_IDS } from '../experiences';
import { slugify, venueToSlug, parseVenueSlug } from '@/core/utils';

export type VenueCardType = {
  id: string;
  name: string;
  city: string;
  state: string;
  coverPublicId: string | null;
  slug: string;
  upcomingCount: number;
};

export async function getFeaturedVenues(take = 4): Promise<VenueCardType[]> {
  const perfs = await prisma.performance.groupBy({
    by: ['venueId'],
    where: { startsAt: { gte: new Date() } },
    _count: { venueId: true },
  });

  const venueIds = perfs.map((p) => p.venueId);

  const venues = await prisma.venue.findMany({
    where: {
      id: { in: venueIds },
      NOT: { coverPublicId: { in: [...EXPERIENCE_VENUE_COVER_IDS] } },
    },
    take,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, city: true, state: true, coverPublicId: true },
  });

  return venues.map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    state: v.state,
    coverPublicId: v.coverPublicId ?? null,
    slug: venueToSlug(v.name, v.city, v.state),
    upcomingCount: perfs.find((p) => p.venueId === v.id)!._count.venueId,
  }));
}

export async function getAllVenues(): Promise<VenueCardType[]> {
  const venues = await prisma.venue.findMany({
    where: { NOT: { coverPublicId: { in: [...EXPERIENCE_VENUE_COVER_IDS] } } },
    orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
  });

  const perfs = await prisma.performance.groupBy({
    by: ['venueId'],
    where: { startsAt: { gte: new Date() } },
    _count: { venueId: true },
  });

  return venues.map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    state: v.state,
    coverPublicId: v.coverPublicId ?? null,
    slug: venueToSlug(v.name, v.city, v.state),
    upcomingCount: perfs.find((p) => p.venueId === v.id)?._count.venueId ?? 0,
  }));
}

export async function getVenueBySlug(slug: string) {
  const parsed = parseVenueSlug(slug);
  if (!parsed) return null;

  const venues = await prisma.venue.findMany({
    where: { state: parsed.state },
  });

  const venue = venues.find(
    (v) => slugify(v.name) === parsed.venueSlug && slugify(v.city) === parsed.citySlug,
  );
  if (!venue) return null;

  const events = await prisma.performance.findMany({
    where: { venueId: venue.id, startsAt: { gte: new Date() } },
    include: {
      event: { select: { slug: true, title: true, heroPublicId: true } },
      ticketTypes: { select: { priceCents: true }, orderBy: { priceCents: 'asc' } },
    },
    orderBy: [{ startsAt: 'asc' }],
  });

  const upcoming = events.map((p) => ({
    perfId: p.id,
    startsAt: p.startsAt,
    minPriceCents: p.ticketTypes[0]?.priceCents,
    event: {
      slug: p.event.slug,
      title: p.event.title,
      heroPublicId: p.event.heroPublicId,
    },
  }));

  return {
    id: venue.id,
    name: venue.name,
    city: venue.city,
    state: venue.state,
    address: venue.address ?? null,
    capacity: venue.capacity ?? null,
    coverPublicId: venue.coverPublicId ?? null,
    slug: venueToSlug(venue.name, venue.city, venue.state),
    upcoming,
  };
}
