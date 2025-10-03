'use client';

import React from 'react';
import Summary from '../summary/summary';
import { useMemo, useState } from 'react';
import { CheckoutState } from '@/app/checkout';
import SectorList from '../sectorList/sectorList';
import ValueSelector from '../valueSelector/valueSelector';

const HALF_KINDS = new Set(['HALF', 'ELDERLY', 'PCD']);

type Variant = {
  id: string;
  kind: 'FULL' | 'HALF' | 'ELDERLY' | 'PCD';
  priceCents: number;
  feeCents: number;
  active: boolean;
};
type TicketType = {
  id: string;
  name: string;
  variants: Variant[];
  inventory?: { available: number } | null;
};

type CartItem = {
  ticketTypeId: string;
  variantId: string;
  name: string;
  qty: number;
  unit: number;
  fee?: number;
};

type CheckoutAction = (
  prevState: CheckoutState,
  formData: FormData,
) => Promise<CheckoutState>;

export function TicketFlow({
  performanceId,
  ticketTypes,
  startCheckoutAction,
}: {
  performanceId: string;
  ticketTypes: TicketType[];
  startCheckoutAction?: CheckoutAction;
}) {
  const [step, setStep] = useState<'sector' | 'values'>('sector');
  const [typeId, setTypeId] = useState<string | null>(ticketTypes[0]?.id ?? null);
  const [items, setItems] = useState<Record<string, number>>({});

  const selectedType = useMemo(
    () => ticketTypes.find((t) => t.id === typeId) ?? null,
    [ticketTypes, typeId],
  );

  const { totalQty, halfQty } = useMemo(() => {
    let total = 0;
    let half = 0;
    for (const t of ticketTypes) {
      for (const v of t.variants) {
        const q = items[v.id] || 0;
        total += q;
        if (HALF_KINDS.has(v.kind)) half += q;
      }
    }
    return { totalQty: total, halfQty: half };
  }, [items, ticketTypes]);

  const cartItems: CartItem[] = useMemo(() => {
    const arr: CartItem[] = [];
    for (const t of ticketTypes) {
      for (const v of t.variants) {
        const qty = items[v.id] || 0;
        if (!qty) continue;
        const label =
          v.kind === 'FULL'
            ? 'Inteira'
            : v.kind === 'HALF'
            ? 'Meia-Entrada'
            : v.kind === 'ELDERLY'
            ? 'Desc. 50% - Estatuto Idoso'
            : 'PCD (50%)';
        arr.push({
          ticketTypeId: t.id,
          variantId: v.id,
          name: `${t.name} | ${label}`,
          qty,
          unit: v.priceCents,
          fee: v.feeCents,
        });
      }
    }
    return arr;
  }, [items, ticketTypes]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {step === 'sector' && (
            <>
              <h2 className="text-lg font-semibold mt-2">Selecionar setor</h2>
              <SectorList
                types={ticketTypes}
                selectedId={typeId ?? ''}
                onSelect={(id) => {
                  setTypeId(id);
                  setStep('values');
                }}
              />
            </>
          )}

          {step === 'values' && selectedType && (
            <>
              <div className="flex items-center justify-between mt-2">
                <h2 className="text-lg font-semibold">{selectedType.name}</h2>
                <button
                  type="button"
                  className="text-sm cursor-pointer"
                  onClick={() => setStep('sector')}
                  aria-label="Trocar setor"
                >
                  Trocar setor
                </button>
              </div>
              <ValueSelector
                performanceId={performanceId}
                type={selectedType}
                value={items}
                onChange={setItems}
                globalTotalQty={totalQty}
                globalHalfQty={halfQty}
              />
            </>
          )}
        </div>

        <aside aria-label="Resumo da seleção">
          <Summary items={cartItems} {...(startCheckoutAction ? { action: startCheckoutAction } : {})} />
        </aside>
      </div>
    </div>
  );
}
