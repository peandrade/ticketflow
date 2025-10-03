import React from 'react';
import { VenueCard } from "@/features/components";
import { getAllVenues } from "@/features/data";

export default async function VenuesPage() {
  const venues = await getAllVenues();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-3xl font-semibold">Todas as casas</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map(v => <VenueCard key={v.id} v={v} />)}
      </div>
    </main>
  );
}
