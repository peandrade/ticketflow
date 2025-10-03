'use client';

import React from 'react';
import { useRef, useState } from 'react';
import ConfirmDialog from './confirmDialog';

type Props = {
  children: React.ReactNode;
  action?: ((formData: FormData) => Promise<void>) | string;
  orderId: string;
  disabled?: boolean;
};

export function RefundConfirmButton({ children, action, orderId, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => formRef.current?.requestSubmit()}
        title="Confirmar solicitação de reembolso"
        description="Isso cancelará seus ingressos e poderá ser irreversível. Deseja continuar?"
        confirmText="Sim, solicitar reembolso"
        cancelText="Não"
      />
      <form ref={formRef} action={action as any}>
        <input type="hidden" name="orderId" value={orderId} />
        <button
          type="submit"
          disabled={disabled}
          onClick={(e) => {
            if (disabled) return;
            e.preventDefault();
            setOpen(true);
          }}
          className={`inline-flex items-center rounded-lg border px-4 py-2 font-medium focus:outline-none focus-visible:ring
            ${disabled ? 'cursor-not-allowed opacity-60' : 'border-red-200 text-red-700 hover:bg-red-50 dark:hover:bg-neutral-800'}`}
          aria-disabled={disabled || undefined}
          aria-label="Solicitar reembolso"
        >
          {children}
        </button>
      </form>
    </>
  );
}