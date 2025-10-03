'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/core/auth';
import { stripe } from '@/core/clients/stripe/stripe';
import { prisma } from '@/core/clients/prisma/prisma';

async function getBaseUrl() {
  const h = headers();
  return (
    (await h).get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  );
}

export async function continueCheckoutAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const orderId = String(formData.get('orderId') ?? '');
  if (!orderId) throw new Error('Pedido inválido');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { ticketType: true } } },
  });
  if (!order || order.userEmail !== user.email) throw new Error('Pedido inválido');

  if (order.status === 'PAID') {
    redirect(`/checkout/${orderId}/success`);
  }

  if (order.stripeSessionId) {
    const s = await stripe.checkout.sessions.retrieve(order.stripeSessionId).catch(() => null);

    if (s?.payment_status === 'paid') {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
      redirect(`/checkout/${orderId}/success?session_id=${s.id}`);
    }

    if (s?.status === 'open' && s?.url) {
      redirect(s.url);
    }
  }

  const origin = await getBaseUrl();
  const line_items = order.orderItems.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency: 'brl',
      unit_amount: it.unitPriceCents,
      product_data: { name: it.ticketType?.name ?? 'Ingresso' },
    },
  }));

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: user.email,
      line_items,
      success_url: `${origin}/checkout/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${orderId}?canceled=1`,
      metadata: { orderId },
    },
    { idempotencyKey: `order_${orderId}_resume` },
  );

  await prisma.order.update({
    where: { id: orderId },
    data: { stripeSessionId: session.id },
  });

  if (!session.url) throw new Error('Sessão sem URL de checkout');
  redirect(session.url);
}

export async function startCheckoutAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error('Não autenticado');

  const orderId = String(formData.get('orderId') || '');
  if (!orderId) throw new Error('Parâmetro inválido');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          ticketType: { select: { name: true } },
        },
      },
    },
  });

  if (!order || order.userEmail !== user.email) {
    throw new Error('Pedido não encontrado');
  }

  if (order.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    if (session?.url) redirect(session.url);
  }

  const origin = getBaseUrl();
  const line_items = order.orderItems.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency: 'brl',
      unit_amount: it.unitPriceCents,
      product_data: {
        name: it.ticketType.name,
      },
    },
  }));

  if (line_items.length === 0) throw new Error('Pedido vazio');

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: user.email,
      line_items,
      success_url: `${origin}/checkout/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${orderId}?canceled=1`,
      metadata: { orderId },
    },
    { idempotencyKey: `order_${orderId}` },
  );

  await prisma.order.update({
    where: { id: orderId },
    data: { stripeSessionId: session.id },
  });

  if (!session.url) throw new Error('Sessão sem URL de checkout');
  redirect(session.url);
}
