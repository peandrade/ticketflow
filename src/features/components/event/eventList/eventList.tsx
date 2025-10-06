import React from 'react';
import { EventCard } from '../eventCard';
import { getEventsForHome } from '@/features/data';
import Link from 'next/link';

export const EventList = async () => {
  const events = await getEventsForHome();
  return (
    <section className="mx-auto max-w-6xl p-6">
      <div className="mt-6 flex items-center justify-between">
        <h2 className="mb-4 text-xl font-semibold">Conheça outros Shows</h2>
        <Link
          href="/shows"
          className="rounded-full bg-blue-600 px-4 py-1 text-sm font-medium text-white hover:bg-blue-700"
          aria-label="Ver todos os shows cadastrados"
        >
          Ver mais
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
};
