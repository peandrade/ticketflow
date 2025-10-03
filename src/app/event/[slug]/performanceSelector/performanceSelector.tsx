'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PerformanceOption } from '@/types/event';
import { PerformanceSelect } from '../performanceSelect/performanceSelect';

type Props = {
  eventTitle: string;
  eventSlug: string;
  options: PerformanceOption[];
  value?: string;
  onChange: (id: string) => void;
};

export function PerformanceSelector({ eventTitle, eventSlug, options, value, onChange }: Props) {
  const router = useRouter();
  const hasChosen = Boolean(value);

  const goToTickets = () => {
    if (!hasChosen) return;
    router.push(`/event/${eventSlug}/tickets/page?performanceId=${value}`);
  };

  return (
    <div className="relative w-full overflow-visible border-b">
      <div className="flex w-full flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <PerformanceSelect
            eventTitle={eventTitle}
            options={options}
            value={value ?? ''}
            onChange={onChange}
          />
        </div>

        <button
          type="button"
          onClick={goToTickets}
          disabled={!hasChosen}
          className="w-full rounded-md bg-gray-400 px-4 py-3 text-black transition
                     hover:bg-gray-300 disabled:pointer-events-none disabled:opacity-50
                     sm:w-auto sm:ml-auto"
          title={hasChosen ? 'Selecionar ingressos' : 'Escolha uma data/local'}
        >
          Ingressos
        </button>
      </div>
    </div>
  );
}
