'use server';

import type Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/core/auth';
import { refundOrderRules } from '@/usecases';
import { prisma } from '@/core/clients';
import { hasStripe, stripe } from '@/core/clients/stripe/server';

type State = { ok?: true; error?: string };

export async function requestRefundAction(_prev: State, formData: FormData): Promise<State> {
  const user = await getSessionUser();
  if (!user) return { error: 'Faça login para continuar.' };

  const orderId = String(formData.get('orderId') || '');
  if (!orderId) return { error: 'Pedido inválido.' };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userEmail: user.email.toLowerCase() },
    include: {
      orderItems: { include: { ticketType: { include: { performance: true } } } },
    },
  });
  if (!order) return { error: 'Pedido não encontrado.' };

  const perf = order.orderItems[0]?.ticketType?.performance ?? null;
  const decision = refundOrderRules({
    status: order.status,
    items: order.orderItems.map((oi) => ({ ticketTypeId: oi.ticketTypeId, quantity: oi.quantity })),
    performance: perf ? { startsAt: perf.startsAt } : null,
  });
  if (!decision.ok) return { error: decision.reason };

  let alreadyRefunded = false;

  try {
    if (hasStripe() && order.stripeSessionId) {
      const session = await stripe!.checkout.sessions.retrieve(order.stripeSessionId, {
        expand: ['payment_intent.latest_charge'],
      });

      const pi = session.payment_intent as Stripe.PaymentIntent | null;
      if (!pi) {
        console.warn('[refund] Session sem payment_intent', order.stripeSessionId);
      } else {
        const latestCharge = (pi.latest_charge ?? null) as Stripe.Charge | string | null;
        const lc = typeof latestCharge === 'object' ? latestCharge : null;

        if (lc?.disputed || lc?.disputed) {
          return {
            error: 'O pagamento está em disputa no cartão; reembolso automático é bloqueado.',
          };
        }
        if (lc?.refunded) {
          alreadyRefunded = true;
        } else {
          const amountReceived = typeof pi.amount_received === 'number' ? pi.amount_received : null;
          const fallbackAmount = session.amount_total ?? order.totalCents;
          const amountToRefund = Math.min(order.totalCents, amountReceived ?? fallbackAmount);

          await stripe!.refunds.create({
            payment_intent: pi.id,
            amount: amountToRefund,
            reason: 'requested_by_customer',
          });
        }
      }
    } else {
      console.warn('[refund] Stripe ausente; seguindo com reembolso apenas no banco.');
    }
  } catch (err: any) {
    const code = err?.code ?? err?.raw?.code;
    if (code === 'charge_disputed') {
      return { error: 'O pagamento está em disputa; não é possível reembolsar automaticamente.' };
    }
    if (code === 'charge_already_refunded' || code === 'refund_already_exists') {
      alreadyRefunded = true;
    } else {
      console.error('[refund] erro Stripe', err);
      return { error: 'Falha ao processar reembolso. Tente novamente.' };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED' },
      });

      for (const item of order.orderItems) {
        await tx.inventory.upsert({
          where: { ticketTypeId: item.ticketTypeId },
          update: { available: { increment: item.quantity } },
          create: { ticketTypeId: item.ticketTypeId, available: item.quantity },
        });
      }
    });
    revalidatePath(`/orders/${order.id}`);
    revalidatePath('/orders');

    return { ok: true };
  } catch (err) {
    console.error('[refund] erro DB', err);
    if (alreadyRefunded) {
      return {
        error:
          'O valor foi estornado no cartão, mas ocorreu uma falha ao registrar no sistema. Contate o suporte com o número do pedido.',
      };
    }
    return { error: 'Falha ao finalizar reembolso.' };
  }
}
