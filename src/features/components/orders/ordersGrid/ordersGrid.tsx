'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlCdn } from '@/core/utils';

export type OrderCardItem = {
  id: string;
  createdAt: string | Date;
  eventTitle: string;
  venueName?: string;
  coverPublicId?: string | null;
  totalCents: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
};

function formatDate(input: string | Date) {
  const d = new Date(input);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: OrderCardItem['status'] }) {
  const meta: Record<OrderCardItem['status'], { label: string; cls: string }> = {
    CREATED: {
      label: 'Em processamento',
      cls: 'bg-amber-50 text-amber-300 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
    },
    PAID: {
      label: 'Pago',
      cls: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-800',
    },
    FAILED: {
      label: 'Falhou',
      cls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800',
    },
    REFUNDED: {
      label: 'Reembolsado',
      cls: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800',
    },
  };

  const { label, cls } = meta[status];

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium shadow ring-1 backdrop-blur-sm ring-inset',
        cls,
      ].join(' ')}
      aria-label={`Status do pedido: ${label}`}
      title={label}
    >
      {label}
    </span>
  );
}

export function OrdersGrid({ items }: { items: OrderCardItem[] }) {
  if (!items?.length) {
    return (
      <div role="status" aria-live="polite" className="rounded-xl border p-6 text-center">
        <p className="text-lg font-medium">Você ainda não tem pedidos.</p>
        <p className="text-muted-foreground">Explore os eventos na página inicial.</p>
      </div>
    );
  }

  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <li key={it.id}>
          <Link
            href={`/orders/${it.id}`}
            aria-label={`Abrir pedido ${it.id}`}
            className="bg-card focus:ring-ring block overflow-hidden rounded-xl border shadow focus:ring-2 focus:outline-none"
          >
            <div className="relative aspect-square">
              {it.coverPublicId ? (
                <Image
                  src={urlCdn(it.coverPublicId, {
                    w: 600,
                    ar: '1:1',
                    c: 'fill',
                  })}
                  alt={it.eventTitle}
                  fill
                  sizes="(max-width:1024px) 100vw, 400px"
                  className="object-cover object-center"
                  priority={false}
                />
              ) : (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <span className="text-muted-foreground text-sm">Sem imagem</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="truncate text-xl font-semibold">{it.eventTitle}</h3>
                <StatusBadge status={it.status} />
              </div>
              {it.venueName ? (
                <p className="text-muted-foreground mt-1 truncate text-base">{it.venueName}</p>
              ) : null}
              <div className="mt-4 flex items-center justify-between">
                <span className="bg-muted rounded-md px-2 py-1 font-mono text-sm">
                  #{it.id.slice(0, 8)}
                </span>
                <span className="text-muted-foreground text-sm">{formatDate(it.createdAt)}</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
