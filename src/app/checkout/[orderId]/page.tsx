import React from 'react';

import { prisma } from '@/core/clients';
import { formatBRL } from '@/core/utils';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/core/auth';
import { continueCheckoutAction } from './actions';

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams?: { canceled?: string };
};

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { orderId } = await params;

  const user = await getSessionUser();
  if (!user) return notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { ticketType: true } },
    },
  });

  if (!order || order.userEmail !== user.email) {
    return notFound();
  }

  const total = order.orderItems.reduce((acc, it) => acc + it.unitPriceCents * it.quantity, 0);

  const prettyStatus =
    order.status === 'PAID'
      ? 'Confirmado'
      : order.status === 'CREATED'
        ? 'Pendente'
        : order.status === 'REFUNDED'
          ? 'Reembolsado'
          : order.status === 'FAILED'
            ? 'Falhou'
            : order.status;

  const canceled = searchParams?.canceled === '1' || searchParams?.canceled === 'true';

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Pedido {order.id}</h1>
      <p className="text-muted-foreground text-sm">
        Status: <span className="font-medium">{prettyStatus}</span>
      </p>

      {canceled && order.status !== 'PAID' && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
        >
          Pagamento não concluído. Você pode retomar abaixo.
        </div>
      )}

      <section className="mt-6 rounded-xl border">
        <div className="border-b p-4 font-semibold">Itens</div>
        <ul className="divide-y">
          {order.orderItems.map((it) => (
            <li key={it.id} className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-medium">{it.ticketType?.name ?? 'Ingresso'}</div>
                <div className="text-muted-foreground text-xs">
                  {it.quantity} × {formatBRL(it.unitPriceCents)}
                </div>
              </div>
              <div className="text-sm font-medium">
                {formatBRL(it.unitPriceCents * it.quantity)}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t p-4 font-semibold">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <a
          href="/orders"
          className="inline-block rounded-lg border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/40"
        >
          Meus pedidos
        </a>

        {order.status !== 'PAID' && order.status !== 'REFUNDED' && (
          <form action={continueCheckoutAction} className="mt-4">
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border px-4 py-2 font-medium hover:bg-gray-50 focus:outline-none focus-visible:ring dark:hover:bg-gray-900/40"
              aria-label="Retomar pagamento no Stripe"
            >
              Retomar pagamento
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
