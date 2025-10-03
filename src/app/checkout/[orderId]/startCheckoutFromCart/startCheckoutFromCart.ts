'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/core/auth';
import { prisma } from '@/core/clients';
import { OrderStatus } from '@/generated/prisma';
import type { Prisma } from '@/generated/prisma';
import { headers as nextHeaders } from 'next/headers';
import { stripe } from '@/core/clients/stripe/server';

export type CheckoutState =
  | { ok: true }
  | { ok: false; reason: 'NEEDS_AUTH' | 'INVALID_CART' | 'GENERIC_ERROR'; message?: string };

export type CheckoutAction = (
  prevState: CheckoutState,
  formData: FormData,
) => Promise<CheckoutState>;

const CartItem = z.object({
  ticketTypeId: z.string(),
  variantId: z.string(),
  name: z.string(),
  qty: z.number().int().min(1),
  unit: z.number().int().min(0),
  fee: z.number().int().min(0).optional(),
});
const CartSchema = z.array(CartItem).min(1);

function coalesce<T>(...vals: Array<T | null | undefined>): T | undefined {
  for (const v of vals) if (v != null) return v as T;
  return undefined;
}

async function getBaseUrl() {
  const h = await nextHeaders();
  return h.get('origin') ?? process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
}

export const startCheckoutFromCart: CheckoutAction = async (_prev, formData) => {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: 'NEEDS_AUTH', message: 'É necessário entrar para continuar.' };
  }

  const raw = formData.get('items');
  if (!raw) return { ok: false, reason: 'INVALID_CART', message: 'Itens ausentes' };

  let items: z.infer<typeof CartSchema>;
  try {
    items = CartSchema.parse(JSON.parse(String(raw)));
  } catch {
    return { ok: false, reason: 'INVALID_CART', message: 'Carrinho inválido' };
  }

  type VariantWithType = Prisma.TicketVariantGetPayload<{
    include: { ticketType: { select: { name: true } } };
  }>;

  const variantIds = items.map((i) => i.variantId);
  const variants: VariantWithType[] = await prisma.ticketVariant.findMany({
    where: { id: { in: variantIds } },
    include: { ticketType: { select: { name: true } } },
  });

  const byId = new Map<string, VariantWithType>(variants.map((v) => [v.id, v]));
  if (byId.size !== variantIds.length) throw new Error('Variantes inválidas');

  const normalized = items.map((i) => {
    const v = byId.get(i.variantId)!;
    if (v.ticketTypeId !== i.ticketTypeId) {
      throw new Error('Variant não pertence ao TicketType informado');
    }
    const unitNoFee = coalesce<number>(v.priceCents, i.unit) ?? 0;
    const feeUnit = coalesce<number>(v.feeCents, i.fee) ?? 0;
    return {
      qty: i.qty,
      variantId: i.variantId,
      ticketTypeId: i.ticketTypeId,
      sector: v.ticketType.name,
      kind: v.kind,
      unitNoFee,
      feeUnit,
      unitWithFee: unitNoFee + feeUnit,
    };
  });

  const totalCents = normalized.reduce((sum, it) => sum + it.unitWithFee * it.qty, 0);

  const order = await prisma.order.create({
    data: {
      userEmail: user.email,
      status: OrderStatus.CREATED,
      totalCents,
      orderItems: {
        create: normalized.map((it) => ({
          variantId: it.variantId,
          ticketTypeId: it.ticketTypeId,
          quantity: it.qty,
          unitPriceCents: it.unitWithFee,
          sector: it.sector,
          kind: it.kind,
          unit_price_cents: it.unitNoFee,
          fee_cents: it.feeUnit,
        })),
      },
    },
  });

  const origin = await getBaseUrl();
  const line_items = normalized.map((it) => ({
    quantity: it.qty,
    price_data: {
      currency: 'brl',
      unit_amount: it.unitWithFee,
      product_data: { name: `${it.sector} - ${it.kind}` },
    },
  }));

  const session = await stripe!.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: user.email,
      line_items,
      success_url: `${origin}/checkout/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${order.id}?canceled=1`,
      metadata: { orderId: order.id, variantIds: normalized.map((i) => i.variantId).join(',') },
    },
    { idempotencyKey: `order_${order.id}` },
  );

  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  if (!session.url) throw new Error('Sessão de checkout sem URL');
  redirect(session.url);

  return { ok: true };
};
