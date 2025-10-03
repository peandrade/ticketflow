"use client";

import React from 'react';
import { useMemo } from "react";

type TicketTypeRow = {
  id: string;
  name: string;
  initialQuantity: number;
};

type Props = {
  ticketTypes: TicketTypeRow[];
  halfQuotaRatio?: number;
};

const nf = new Intl.NumberFormat("pt-BR");

export function CapacityTable({ ticketTypes, halfQuotaRatio = 0.4 }: Props) {
  const rows = useMemo(() => {
    return ticketTypes.map((t) => {
      const capacity = t.initialQuantity ?? 0;
      const half = Math.floor(capacity * halfQuotaRatio);
      return { id: t.id, name: t.name, capacity, half };
    });
  }, [ticketTypes, halfQuotaRatio]);

  const totals = useMemo(() => {
    const capacity = rows.reduce((s, r) => s + r.capacity, 0);
    const half = rows.reduce((s, r) => s + r.half, 0);
    return { capacity, half };
  }, [rows]);

  if (!rows.length) return null;

  return (
    <section aria-labelledby="cap-title" className="rounded-xl bg-white p-4 md:p-6">
      <h3 id="cap-title" className="mb-3 text-base font-semibold">Capacidade total</h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="border px-3 py-2 font-semibold">Setor</th>
              <th className="border px-3 py-2 font-semibold">Capacidade</th>
              <th className="border px-3 py-2 font-semibold">Meia-entrada*</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="border px-3 py-2">{r.name}</td>
                <td className="border px-3 py-2 tabular-nums">{nf.format(r.capacity)}</td>
                <td className="border px-3 py-2 tabular-nums">{nf.format(r.half)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="border px-3 py-2">Total</td>
              <td className="border px-3 py-2 tabular-nums">{nf.format(totals.capacity)}</td>
              <td className="border px-3 py-2 tabular-nums">{nf.format(totals.half)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-gray-600">
        *Cota de ingressos do tipo meia-entrada, limitada a 40% da capacidade, conforme a Lei 12.933/2013.
        Idosos não fazem parte desta cota e não estão submetidos à limitação, por estarem enquadrados na Lei 10.741/2003.
      </p>
    </section>
  );
}
