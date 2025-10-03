import React from "react";
import { prisma } from "@/core/clients/prisma/prisma";

export async function getEventWithPerformances(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      performances: {
        orderBy: { startsAt: 'asc' },
        include: {
          venue: true,
          ticketTypes: {
            orderBy: { priceCents: 'asc' },
            include: { inventory: true },
          },
        },
      },
    },
  });
}

export function pickPerformance<T extends { id: string }>(
  list: T[],
  perfId?: string | null
) {
  if (!list?.length) return null;
  return perfId ? list.find(p => p.id === perfId) ?? list[0] : list[0];
}