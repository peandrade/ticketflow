
import { prisma } from '@/core/clients';
import { Event, EventDetail } from '@/types/event';
import { FAMILY_EXPERIENCE_SLUGS } from '../../experiences';

export async function getEventsForHome(take = 10): Promise<Event[]> {
  return prisma.event.findMany({
    where: { slug: { notIn: [...FAMILY_EXPERIENCE_SLUGS] } },
    orderBy: { title: 'asc' },
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      heroPublicId: true,
      shortDescription: true,
      performances: {
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        take: 1,
        select: {
          startsAt: true,
          venue: { select: { city: true, state: true } },
        },
      },
    },
  });
}

export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  return prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      heroPublicId: true,
      performances: {
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          startsAt: true,
          venue: { select: { name: true, city: true, state: true } },
          ticketTypes: {
            orderBy: { priceCents: "asc" },
            select: {
              id: true,
              name: true,
              priceCents: true,
              initialQuantity: true,
              inventory: { select: { available: true } },
            },
          },
        },
      },
    },
  });
}

