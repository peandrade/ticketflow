import type Stripe from 'stripe';
import { formatBRL } from '@/core/utils';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/core/auth';
import { getOrderForUser } from '@/features/data';
import { hasStripe, stripe } from '@/core/clients';
import { BackLink, OrderSummary, PrintReceiptButton } from '@/features/components';
import { continueCheckoutAction } from '@/app/checkout/[orderId]/actions/actions';
import React from 'react';

function fmtDate(d: Date) {
  return new Date(d).toLocaleString('pt-BR');
}

function paymentStatusLabel(status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED') {
  switch (status) {
    case 'PAID':
      return 'Aprovado';
    case 'REFUNDED':
      return 'Reembolsado';
    case 'FAILED':
      return 'Falhou';
    default:
      return 'Em processamento';
  }
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: { canceled?: string };
}) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) return notFound();

  const order = await getOrderForUser(id, user.email);
  if (!order) return notFound();

  const receiptItems = order.orderItems.map((oi: any) => {
    const fee = oi.fee_cents ?? 0;
    const unitNoFee = oi.unit_price_cents ?? Math.max(0, oi.unitPriceCents - fee);
    const sector = oi.sector ?? oi.ticketType?.name ?? 'Ingresso';
    const kind = oi.kindLabel ?? oi.kind;
    const seatType = oi.seat_type as string | undefined;
    const name = [sector, kind, seatType].filter(Boolean).join(' - ');
    return { id: oi.id, name, quantity: oi.quantity, unitPriceCents: unitNoFee };
  });

  const canceled = searchParams?.canceled === '1' || searchParams?.canceled === 'true';

  const perf = order.orderItems[0]?.ticketType?.performance ?? null;

  const ev: any = perf ? (perf as any).event : null;
  const artistName: string | undefined = ev?.title ?? ev?.name ?? undefined;

  let cardInfo: { brand?: string; last4?: string } | null = null;
  let stripeBlockReason: string | null = null;

  const KIND_LABEL: Record<'FULL' | 'HALF' | 'ELDERLY' | 'PCD', string> = {
    FULL: 'Inteira',
    HALF: 'Meia-Entrada',
    ELDERLY: 'Idoso',
    PCD: 'PCD',
  };

  if (hasStripe() && order.stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
        expand: ['payment_intent.payment_method', 'payment_intent.latest_charge'],
      });
      const pm: any = (session.payment_intent as any)?.payment_method;
      const brand = pm?.card?.brand;
      const last4 = pm?.card?.last4;
      if (brand || last4) cardInfo = { brand, last4 };

      const pi = session.payment_intent as Stripe.PaymentIntent | null;
      const lc = (pi?.latest_charge ?? null) as Stripe.Charge | string | null;
      const charge = typeof lc === 'object' ? lc : null;
      if (charge?.disputed || (charge as any)?.dispute) stripeBlockReason = 'Pagamento em disputa';
      if (charge?.refunded) stripeBlockReason = 'Pagamento já estornado';
    } catch {}
  }

  const canRefund =
    order.status === 'PAID' &&
    (!perf || new Date(perf.startsAt) > new Date()) &&
    !stripeBlockReason;

  const ticketsSubtotalCents = order.orderItems.reduce((sum, oi) => {
    const fee = (oi as any).fee_cents ?? 0;
    const unitNoFee = (oi as any).unit_price_cents ?? Math.max(0, oi.unitPriceCents - fee);
    return sum + unitNoFee * oi.quantity;
  }, 0);

  const explicitServiceFee = order.orderItems.reduce((sum, oi) => {
    const fee = (oi as any).fee_cents ?? 0;
    return sum + fee * oi.quantity;
  }, 0);

  const serviceFeeCents =
    explicitServiceFee > 0
      ? explicitServiceFee
      : Math.max(0, order.totalCents - ticketsSubtotalCents);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="mb-4 flex items-center gap-4">
        <BackLink />
      </div>

      <header>
        <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
        {perf && (
          <div>
            <p className="text-muted-foreground text-l">{`${artistName} - ${perf.venue.city}`}</p>
            <p className="text-muted-foreground text-l">{fmtDate(perf.startsAt)}</p>
          </div>
        )}

        {stripeBlockReason && (
          <p className="mt-1 text-sm text-red-600">
            {stripeBlockReason}. Reembolso automático indisponível.
          </p>
        )}

        {canceled && order.status !== 'PAID' && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
          >
            Pagamento cancelado. Você pode retomar abaixo.
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <OrderSummary
            orderId={order.id}
            status={order.status}
            canRefund={!!canRefund}
            serviceFeeCents={serviceFeeCents}
            items={order.orderItems.map((oi) => {
              const fee = (oi as any).fee_cents ?? 0;
              const unitNoFee =
                (oi as any).unit_price_cents ?? Math.max(0, oi.unitPriceCents - fee);

              const sector = (oi as any).sector ?? oi.ticketType.name;
              const kind = (oi as any).kind as 'FULL' | 'HALF' | 'ELDERLY' | 'PCD' | undefined;
              const seatType = (oi as any).seat_type as string | undefined;

              const KIND_LABEL: Record<'FULL' | 'HALF' | 'ELDERLY' | 'PCD', string> = {
                FULL: 'Inteira',
                HALF: 'Meia-Entrada',
                ELDERLY: 'Idoso',
                PCD: 'PCD',
              };
              const name = [sector, kind ? KIND_LABEL[kind] : undefined, seatType]
                .filter(Boolean)
                .join(' - ');

              return {
                id: oi.id,
                name,
                quantity: oi.quantity,
                unitPriceCents: unitNoFee,
              };
            })}
          />

          <PrintReceiptButton
            orderId={order.id}
            items={receiptItems}
            serviceFeeCents={serviceFeeCents}
            totalCents={order.totalCents}
            status={order.status}
            createdAt={order.createdAt}
            eventTitle={artistName}
            eventCity={perf?.venue?.city}
            eventStartsAt={perf?.startsAt}
            paymentBrand={cardInfo?.brand}
            paymentLast4={cardInfo?.last4}
          />

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
        </section>

        <aside className="lg:col-span-4">
          <div className="rounded border">
            <div className="border-b p-4">
              <h2 className="font-semibold">Detalhes do pagamento</h2>
            </div>
            <div className="p-4 text-sm">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Meio de pagamento</span>
                <span className="uppercase">{cardInfo?.brand ?? '—'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between py-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatBRL(order.totalCents)}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Cartão</span>
                <span className="font-medium">
                  {cardInfo?.last4 ? `**** **** **** ${cardInfo.last4}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {paymentStatusLabel(order.status)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">{fmtDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
