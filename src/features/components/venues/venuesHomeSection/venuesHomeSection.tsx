import React from 'react';
import Link from 'next/link';
import { VenueCard } from '../venueCard';
import { getFeaturedVenues } from '@/features/data';

export async function VenuesHomeSection() {
  const venues = await getFeaturedVenues(4);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Casas</h2>
        <Link
          href="/casas"
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver mais
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {venues.map((v) => <VenueCard key={v.id} v={v} />)}
      </div>
    </section>
  );
}
