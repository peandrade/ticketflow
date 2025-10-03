'use client';

import React from 'react';
import { formatBRL } from '@/core/utils';
import Summary from '../summary/summary';
import { useMemo, useState } from 'react';
import Quantity from '../quantity/quantity';
import { useFormState, useFormStatus } from 'react-dom';
import { ActionState, saveOrderAction } from '@/app/event';

type TicketTypeDTO = {
  id: string;
  name: string;
  priceCents: number;
  available?: number | null;
};

export default function TicketSelector({
  performanceId,
  tickets,
}: {
  performanceId: string;
  tickets: TicketTypeDTO[];
}) {
  const [sel, setSel] = useState<Record<string, number>>({});

  const items = useMemo(
    () =>
      tickets
        .map(t => ({
          id: t.id,
          name: t.name,
          unit: t.priceCents,
          qty: sel[t.id] ?? 0,
          max: t.available ?? undefined,
        }))
        .filter(i => i.qty > 0 || true),
    [tickets, sel]
  );

  const setQty = (id: string, n: number) =>
    setSel(prev => {
      const next = { ...prev };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const [state, formAction] = useFormState<ActionState, FormData>(saveOrderAction, {});
  const { pending } = useFormStatus();

  const payload = tickets
    .map(t => ({ ticketTypeId: t.id, quantity: sel[t.id] ?? 0 }))
    .filter(i => i.quantity > 0);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="mb-1 text-lg font-medium">Selecionar setor</div>

        <div className="space-y-3">
          {tickets.map(t => {
            const qty = sel[t.id] ?? 0;
            return (
              <div key={t.id} className="items-center justify-between rounded-xl border bg-white p-4 md:flex">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatBRL(t.priceCents)}
                  </div>
                </div>
                <div className="mt-3 md:mt-0">
                  <Quantity
                    value={qty}
                    onChange={(n) => setQty(t.id, n)}
                    max={t.available ?? 0}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="performanceId" value={performanceId} />
        <input type="hidden" name="items" value={JSON.stringify(payload)} />
        <Summary
          items={items.filter(i => i.qty > 0)}
          error={state?.error ?? ''}
          onSubmit={() => (document.activeElement as HTMLElement)?.closest('form')?.requestSubmit()}
          disabled={pending}
        />
      </form>
    </div>
  );
}
