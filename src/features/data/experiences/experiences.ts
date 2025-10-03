import { prisma } from '@/core/clients';
import type { Event } from '@/types/event';

export const FAMILY_EXPERIENCE_SLUGS = [
  'sampasky',
  'julio-verne',
  'roda-rico',
  'sp-gastronomia-2025',
  'zoo-sao-paulo',
  'napoleo-experience-sao-paulo',
  'teatro-magico-no-qualistage-rj',
  'festival-ver-o-peso-da-cozinha-paraense',
] as const;

export const EXPERIENCE_VENUE_COVER_IDS = [
  'sampasky',
  'roda-rico',
  'zoo-sao-paulo',
  'julio-verne',
  'sp-gastronomia-2025',
  'napoleo-experience-sao-paulo',
  'hangar-convencoes-belem',
] as const;

export async function getFamilyExperiences(): Promise<Event[]> {
  return prisma.event.findMany({
    where: { slug: { in: [...FAMILY_EXPERIENCE_SLUGS] } },
    orderBy: { title: 'asc' },
    select: {
      id: true, title: true, slug: true, heroPublicId: true, shortDescription: true,
      performances: {
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' }, take: 1,
        select: { startsAt: true, venue: { select: { city: true, state: true } } },
      },
    },
  });
}
