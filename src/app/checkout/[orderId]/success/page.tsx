import React from 'react';

import { redirect } from 'next/navigation';
import { OrderStatus } from '@/generated/prisma';
import { prisma, stripe } from '@/core/clients';

type Props = {
  params: { orderId: string };
  searchParams: { session_id?: string };
};

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { orderId } = params;
  const sessionId = searchParams.session_id;

  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
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
        <a className="rounded-md border px-4 py-2 hover:bg-gray-50" href="/orders">
          Meus pedidos
        </a>
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
