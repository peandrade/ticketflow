'use client';

import React from 'react';
import { Button } from '@/features/components/ui/button';

export default function Quantity({
  value,
  onChange,
  max,
  incDisabled,
  decDisabled,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  incDisabled?: boolean;
  decDisabled?: boolean;
}) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () =>
    onChange(Math.min(max ?? Number.MAX_SAFE_INTEGER, value + 1));

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={dec}
        aria-label="Diminuir"
        disabled={decDisabled || value === 0}
      >
        −
      </Button>
      <p className="w-6 text-center tabular-nums">{value}</p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={inc}
        aria-label="Aumentar"
        disabled={incDisabled}
      >
        +
      </Button>
    </div>
  );
}
