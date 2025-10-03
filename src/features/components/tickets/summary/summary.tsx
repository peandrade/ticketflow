'use client';

import React from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { formatBRL } from '@/core/utils';
import { useFormState, useFormStatus } from 'react-dom';
import { CheckoutAction, CheckoutState } from '@/app/checkout';

type Item = {
  name: string;
  qty: number;
  unit: number;
  fee?: number;
  variantId?: string;
  ticketTypeId?: string;
  id?: string;
};

function SubmitButton({ disabled, hasItems }: { disabled?: boolean; hasItems: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      aria-label="Ir para pagamento seguro no Stripe"
      disabled={disabled || pending || !hasItems}
    >
      {pending ? 'Redirecionando…' : 'Continuar'}
    </button>
  );
}

export default function Summary({
  items,
  action,
  disabled,
  error,
  onSubmit,
}: {
  items: Item[];
  action?: CheckoutAction;
  disabled?: boolean;
  error?: string;
  onSubmit?: (payload: Item[]) => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.unit * i.qty, 0);
  const fees = items.reduce((s, i) => s + (i.fee ?? 0) * i.qty, 0);
  const total = subtotal + fees;
  const qty = items.reduce((s, it) => s + it.qty, 0);

  const setAuthOpen = useAuth((s) => s.setOpen);

  const initialState: CheckoutState = { ok: false, reason: 'GENERIC_ERROR' };
  const noopAction: CheckoutAction = async () => ({ ok: false, reason: 'GENERIC_ERROR' });

  const [state, formAction] = useFormState<CheckoutState, FormData>(action ?? noopAction, initialState);

  useEffect(() => {
    if (state && !state.ok && state.reason === 'NEEDS_AUTH') {
      setAuthOpen(true);
    }
  }, [state, setAuthOpen]);

  return (
    <aside className="sticky top-20 space-y-3 mt-3">
      <div className="rounded-xl border bg-white">
        <div className="border-b p-4 font-medium">Resumo da seleção</div>
        <div className="divide-y">
          {items.map((it, idx) => (
            <div
              key={it.variantId ?? it.ticketTypeId ?? it.id ?? `${it.name}-${idx}`}
              className="p-4"
            >
              <div className="text-sm font-medium">{it.name}</div>
              <div className="text-muted-foreground text-xs">
                {it.qty} × {formatBRL(it.unit)}
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="text-muted-foreground p-4 text-sm">Nenhum ingresso selecionado.</div>
          )}
        </div>
        <div className="space-y-1 border-t p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          {fees > 0 && (
            <div className="flex justify-between">
              <span>Taxas</span>
              <span>{formatBRL(fees)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" aria-live="polite">
          {error}
        </p>
      )}

      {action ? (
        <form action={formAction}>
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <SubmitButton disabled={disabled} hasItems={qty > 0} />
        </form>
      ) : (
        <button
          type="submit"
          onClick={() => onSubmit?.(items)}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
          disabled={disabled || qty === 0}
        >
          Continuar
        </button>
      )}
    </aside>
  );
}
