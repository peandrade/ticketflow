'use client';

import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { formatBRL } from '@/core/utils';
import { Button } from '../../ui/button';
import { requestRefundAction } from '@/app/orders';

function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Sim, solicitar reembolso',
  cancelText = 'Não',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const id = setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      clearTimeout(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-confirm-title"
        className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white p-5 shadow-xl outline-none dark:bg-neutral-900"
      >
        <h2 id="refund-confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus-visible:ring dark:hover:bg-neutral-800"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

type Item = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  feeCents?: number;
};

type Props = {
  orderId: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  items: Item[];
  canRefund: boolean;
  serviceFeeCents: number;
};

function PendingSubmitButton({
  children,
  disabled,
  ...rest
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <Button
      {...rest}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={pending || undefined}
    >
      {children}
    </Button>
  );
}

export function OrderSummary({ orderId, status, items, canRefund, serviceFeeCents }: Props) {
  const [state, action] = useFormState(requestRefundAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ticketsSubtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity * it.unitPriceCents, 0),
    [items],
  );
  const grandTotal = ticketsSubtotal + serviceFeeCents;

  const isRefundedClient = status === 'REFUNDED' || state?.ok === true;
  const refundDisabled = !canRefund || isRefundedClient;

  return (
    <div className="rounded border">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Itens do pedido</h2>
      </div>

      <div className="divide-y">
        {items.map(it => (
          <div key={it.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-muted-foreground">
                {it.quantity} × {formatBRL(it.unitPriceCents)}
              </div>
            </div>
            <div className="text-lg font-semibold">{formatBRL(it.quantity * it.unitPriceCents)}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 border-t">
        <span className="text-l text-muted-foreground">Ingressos</span>
        <span className="text-lg font-semibold">{formatBRL(ticketsSubtotal)}</span>
      </div>
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-l text-muted-foreground">Taxa de serviço</span>
        <span className="text-lg font-semibold">{formatBRL(serviceFeeCents)}</span>
      </div>
      <div className="flex items-center justify-between px-4 pb-4 border-t mt-2 pt-2">
        <span className="text-l text-muted-foreground">Total</span>
        <span className="text-lg font-bold">{formatBRL(grandTotal)}</span>
      </div>

      {!isRefundedClient && state?.error && (
        <div className="px-4 pb-2 text-sm text-red-600">{state.error}</div>
      )}
      {isRefundedClient && (
        <div className="px-4 pb-2 text-sm text-red-700">Pedido reembolsado.</div>
      )}

      <div className="p-4 border-t">
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => formRef.current?.requestSubmit()}
          title="Confirmar solicitação de reembolso"
          description="Isso cancelará seus ingressos e poderá ser irreversível. Deseja continuar?"
        />

        <form ref={formRef} action={action} className="flex gap-2">
          <input type="hidden" name="orderId" value={orderId} />

          <PendingSubmitButton
            type="button"
            variant="destructive"
            disabled={refundDisabled}
            aria-label="Solicitar reembolso"
            onClick={() => {
              if (!refundDisabled) setConfirmOpen(true);
            }}
          >
            Solicitar reembolso
          </PendingSubmitButton>

          {!canRefund && !isRefundedClient && (
            <span className="text-sm text-muted-foreground self-center">
              Reembolso indisponível
            </span>
          )}

          <div aria-live="polite" className="sr-only">
            {isRefundedClient
              ? 'Pedido reembolsado.'
              : state?.error
              ? `Erro: ${state.error}`
              : null}
          </div>
        </form>
      </div>
    </div>
  );
}
