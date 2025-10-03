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
  options: PerformanceOption[];
  performancesFull: EventDetail['performances'];
  policy: Parameters<typeof SalesPolicy>[0]['policy'];
};

export default function EventClient({
  title,
  options,
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
        value={selectedId}
        onChange={setSelectedId}
      />

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
