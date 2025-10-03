import React from 'react';
import { EventCard } from '../event';
import { getFamilyExperiences } from '@/features/data';

export async function FamilyHomeSection() {
  const items = await getFamilyExperiences();
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-6xl p-6">
      <h2 className="mb-4 text-xl font-semibold">Para toda a Família</h2>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}
