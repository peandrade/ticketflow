import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { stripe } from '@/core/clients/stripe/stripe';
import { prisma } from '@/core/clients/prisma/prisma';
import { OrderStatus } from '@/generated/prisma';
import { env } from '@/core/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature');
  const secret = env.STRIPE_WEBHOOK_SECRET ?? '';
  if (!sig || !secret) {
    return new NextResponse('Missing stripe signature or webhook secret', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = (session.metadata?.['orderId'] as string) || null;

        if (orderId) {
          await prisma.order.updateMany({
            where: { id: orderId, status: { in: [OrderStatus.CREATED, OrderStatus.FAILED] } },
            data: { status: OrderStatus.PAID },
          });
        } else if (session.id) {
          await prisma.order.updateMany({
            where: { stripeSessionId: session.id, status: { in: [OrderStatus.CREATED, OrderStatus.FAILED] } },
            data: { status: OrderStatus.PAID },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = (pi.metadata?.['orderId'] as string) || null;
        if (orderId) {
          await prisma.order.updateMany({
            where: { id: orderId, status: { not: OrderStatus.PAID } },
            data: { status: OrderStatus.FAILED },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const orderId = (charge.metadata?.['orderId'] as string) || null;
        if (orderId) {
          await prisma.order.updateMany({
            where: { id: orderId },
            data: { status: OrderStatus.REFUNDED },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error('Stripe webhook handler error:', e);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
