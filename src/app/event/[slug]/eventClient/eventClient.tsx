'use client';

import React from 'react';
import { SalesPolicy } from '../salesPolicy';
import { CapacityTable } from '../capacityTable';
import { useEffect, useMemo, useState } from 'react';
import { PerformanceInfo } from '../performanceInfo';
import { PerformanceSelector } from '../performanceSelector';
import type { EventDetail, PerformanceOption } from '@/types/event';

type Props = {
  title: string;
  eventSlug: string;
  description: string;
  options: PerformanceOption[];
  performancesFull: EventDetail['performances'];
  policy: Parameters<typeof SalesPolicy>[0]['policy'];
};

export default function EventClient({
  title,
  options,
  description,
  eventSlug,
  performancesFull,
  policy,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedId),
    [options, selectedId],
  );

  const selectedFull = useMemo(
    () => performancesFull.find((p) => p.id === selectedId),
    [performancesFull, selectedId],
  );

  useEffect(() => {
    if (selectedId && !options.some((o) => o.id === selectedId)) {
      setSelectedId(undefined);
    }
  }, [options, selectedId]);

  return (
    <div className="">
      <PerformanceSelector
        eventTitle={title}
        eventSlug={eventSlug}
        options={options}
        value={selectedId ?? ''}
        onChange={setSelectedId}
      />

      <section
        role="region"
        aria-labelledby="event-about-heading"
        className="prose prose-neutral dark:prose-invert mt-6 max-w-none p-4 md:p-6"
      >
        <h2 id="event-about-heading" className="text-xl font-semibold">
          Sobre o evento
        </h2>

        {description ? (
          <p>{description}</p>
        ) : (
          <p className="text-muted-foreground">Descrição em breve.</p>
        )}
      </section>

      {selectedOption && selectedFull && (
        <>
          <PerformanceInfo option={selectedOption} />
          <CapacityTable ticketTypes={selectedFull.ticketTypes} />
        </>
      )}

      <SalesPolicy policy={policy} />
    </div>
  );
}
