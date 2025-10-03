'use client';

import React from 'react';
import { formatBRL } from '@/core/utils';
import Quantity from '../quantity/quantity';

const HALF_KINDS = new Set(['HALF', 'ELDERLY', 'PCD']);

type Variant = {
  id: string;
  kind: 'FULL' | 'HALF' | 'ELDERLY' | 'PCD';
  priceCents: number;
  feeCents: number;
  active: boolean;
};
type Type = { id: string; name: string; variants: Variant[] };

export default function ValueSelector({
  performanceId,
  type,
  value,
  onChange,
  globalTotalQty,
  globalHalfQty,
}: {
  performanceId: string;
  type: Type;
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  globalTotalQty: number;
  globalHalfQty: number;
}) {
  return (
    <div className="divide-y rounded-lg border">
      {type.variants.map((v) => {
        const qty = value[v.id] || 0;

        const label =
          v.kind === 'FULL'
            ? 'Inteira'
            : v.kind === 'HALF'
              ? 'Meia-Entrada'
              : v.kind === 'ELDERLY'
                ? 'Desc. 50% - Estatuto Idoso'
                : 'PCD (50%)';

        const hitTotalLimit = globalTotalQty >= 6;
        const isHalfLike = HALF_KINDS.has(v.kind);
        const hitHalfLimit = isHalfLike && globalHalfQty >= 2;

        const incDisabled = !v.active || hitTotalLimit || hitHalfLimit;
        const decDisabled = qty === 0;

        return (
          <div key={v.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-sm text-muted-foreground">
                {formatBRL(v.priceCents)} + {formatBRL(v.feeCents)}
              </div>
            </div>

            {!v.active ? (
              <span className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold">ESGOTADO</span>
            ) : (
              <Quantity
                value={qty}
                onChange={(n) => {
                  if (n > qty && incDisabled) return;
                  const next = { ...value, [v.id]: n };
                  onChange(next);
                }}
                max={6}
                incDisabled={incDisabled}
                decDisabled={decDisabled}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
