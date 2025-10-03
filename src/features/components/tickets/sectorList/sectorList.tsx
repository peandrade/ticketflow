'use client';

import clsx from 'clsx';
import React from 'react';
import { formatBRL } from '@/core/utils';

type Variant = { id: string; priceCents: number; feeCents: number; active: boolean };
type Type = { id: string; name: string; variants: Variant[]; inventory?: { available: number } | null };

export default function SectorList({
  types,
  selectedId,
  onSelect,
}: {
  types: Type[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y rounded-lg border">
      {types.map((t) => {
        const vs = t.variants.filter(v => v.active).sort((a,b)=>a.priceCents-b.priceCents);
        const min = vs[0];
        if (!min) return null;
        const price = formatBRL(min.priceCents);
        const fee = formatBRL(min.feeCents);
        const active = selectedId === t.id;

        return (
          <button
            key={t.id}
            className={clsx(
              'flex w-full items-center justify-between p-4 text-left focus:outline-none'
            )}
            onClick={() => onSelect(t.id)}
            aria-pressed={active}
          >
            <div>
              <div className="font-semibold" aria-label={t.name}>{t.name}</div>
              <div className="text-sm text-muted-foreground">
                A partir de {price} + {fee}
              </div>
            </div>
            <span aria-hidden>›</span>
          </button>
        );
      })}
    </div>
  );
}
