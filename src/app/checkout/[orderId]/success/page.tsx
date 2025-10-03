import React from 'react';

import { redirect } from 'next/navigation';
import { OrderStatus } from '@/generated/prisma';
import Link from 'next/link';
import { stripe } from '@/core/clients/stripe/server';
import { prisma } from '@/core/clients/prisma/prisma';

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const sp = await searchParams;
  const sessionId = Array.isArray(sp.session_id) ? sp.session_id[0] : sp.session_id ?? null;

  if (sessionId) {
    const session = await stripe!.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      await prisma.order.updateMany({
        where: { id: orderId, status: { not: OrderStatus.PAID } },
        data: { status: OrderStatus.PAID },
      });
    }
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect('/');

  const paid = order.status === OrderStatus.PAID;

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold">
        {paid ? 'Pagamento confirmado 🎉' : 'Pagamento em processamento'}
      </h1>
      <p className="mb-6 text-muted-foreground">
        {paid
          ? 'Seu pedido foi confirmado. Você pode ver todos os seus pedidos na página Meus pedidos.'
          : 'Estamos aguardando a confirmação do pagamento. Isso ocorre em segundos via webhook.'}
      </p>

      <div className="flex gap-3">
        <Link className="rounded-md border px-4 py-2 hover:bg-gray-50" href="/orders">
          Meus pedidos
        </Link>
        {!paid && (
          <form action={`/checkout/${orderId}/success`} method="GET">
            <button className="rounded-md border px-4 py-2 hover:bg-gray-50" type="submit">
              Atualizar status
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
