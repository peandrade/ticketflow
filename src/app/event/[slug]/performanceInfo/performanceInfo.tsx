import React from 'react';
import type { PerformanceOption } from '@/types/event';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="font-semibold text-gray-900 after:ml-0.5 after:content-[':']">{label}</dt>
      <dd className="text-gray-700">{children}</dd>
    </div>
  );
}

export function PerformanceInfo({ option }: { option?: PerformanceOption }) {
  if (!option) return null;

  const starts = new Date(option.startsAt);
  const gates = new Date(starts.getTime() - 60 * 60 * 1000);

  const fDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const fWeek = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
  const fTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <section className="rounded-xl bg-white p-4 md:p-6 mt-2">
      <h3 className="mb-3 text-base font-semibold">{option.venue.city}</h3>

      <dl className="space-y-1.5 leading-6">
        <Row label="Apresentação">
          {fDate.format(starts)} ({fWeek.format(starts)})
        </Row>
        <Row label="Abertura dos portões">
          <time dateTime={gates.toISOString()}>{fTime.format(gates)}h</time>
        </Row>
        <Row label="Horário do show">
          <time dateTime={starts.toISOString()}>{fTime.format(starts)}h</time>
        </Row>
        <Row label="Local">{option.venue.name}</Row>
        <Row label="Classificação">
          16 anos. Menores de 05 a 15 anos, apenas acompanhados dos pais ou responsáveis legais.
          *Sujeito a alteração por decisão judicial.
        </Row>
      </dl>
    </section>
  );
}
