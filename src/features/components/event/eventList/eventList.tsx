import React from 'react';
import { EventCard } from "../eventCard";
import { getEventsForHome } from "@/features/data";

export const EventList = async () => {
  const events = await getEventsForHome();
  return (
    <section className="mx-auto max-w-6xl p-6">
      <h2 className="mb-4 text-xl font-semibold">Conheça outros Shows</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
};
