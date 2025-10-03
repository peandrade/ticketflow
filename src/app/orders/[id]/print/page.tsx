import React from 'react';
import { formatBRL } from '@/core/utils';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/core/auth';
import { PrintAuto } from '@/features/components';
import { getOrderForUser } from '@/features/data';
import { hasStripe, stripe } from '@/core/clients/stripe/server';

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

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) return notFound();

  const order = await getOrderForUser(id, user.email);
  if (!order) return notFound();

  const perf = order.orderItems[0]?.ticketType?.performance ?? null;
  const ev: any = perf ? (perf as any).event : null;
  const title: string | undefined = ev?.title ?? ev?.name ?? undefined;
  const city: string | undefined = perf?.venue?.city;

  let cardInfo: { brand?: string; last4?: string } | null = null;
  if (hasStripe() && order.stripeSessionId) {
    try {
      const session = await stripe!.checkout.sessions.retrieve(order.stripeSessionId, {
        expand: ['payment_intent.payment_method'],
      });
      const pm: any = (session.payment_intent as any)?.payment_method;
      cardInfo = { brand: pm?.card?.brand, last4: pm?.card?.last4 };
    } catch {}
  }

  const ticketsSubtotal = order.orderItems.reduce((acc, it: any) => {
    const fee = it.fee_cents ?? 0;
    const unitNoFee = it.unit_price_cents ?? Math.max(0, it.unitPriceCents - fee);
    return acc + unitNoFee * it.quantity;
  }, 0);

  const explicitServiceFee = order.orderItems.reduce(
    (sum, it: any) => sum + (it.fee_cents ?? 0) * it.quantity,
    0,
  );
  const serviceFee =
    explicitServiceFee > 0 ? explicitServiceFee : Math.max(0, order.totalCents - ticketsSubtotal);

  return (
    <html lang="pt-BR">
      <head>
        <title>Recibo do pedido #{order.id.slice(0, 8)} • TicketFlow</title>
        <style>{`
          @page { size: A4; margin: 14mm; }
          body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: #111; }
          .muted { color: #6b7280; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; }
          .divider { border-top: 1px solid #e5e7eb; margin: 8px 0; }
          .title { font-weight: 700; font-size: 18px; margin-bottom: 2px; }
          .h2 { font-weight: 600; margin: 12px 0 6px; }
          .small { font-size: 12px; }
          .tot { font-weight: 700; }
          .badge { display:inline-block; border-radius:9999px; padding:2px 8px; font-size:12px; background:#e5fbe6; color:#0a7b12; }
          .container { max-width: 720px; margin: 0 auto; }
          a { color: inherit; text-decoration: none; }
        `}</style>
      </head>
      <body>
        <PrintAuto />

        <main className="container">
          <header style={{ marginBottom: 12 }}>
            <div className="small muted">{fmtDate(new Date())}</div>
            <div className="title">Detalhes do pedido #{order.id.slice(0, 8)}</div>
            {title && (
              <div className="muted">
                {title}
                {city ? ` - ${city}` : ''}
              </div>
            )}
            {perf?.startsAt && <div className="small muted">{fmtDate(perf.startsAt)}</div>}
          </header>

          <section>
            <div className="h2">Itens do pedido</div>
            <div className="divider" />
            {order.orderItems.map((oi: any) => {
              const fee = oi.fee_cents ?? 0;
              const unitNoFee = oi.unit_price_cents ?? Math.max(0, oi.unitPriceCents - fee);
              const sector = oi.sector ?? oi.ticketType?.name ?? 'Ingresso';
              const kind = oi.kindLabel ?? oi.kind;
              const seatType = oi.seat_type as string | undefined;
              const name = [sector, kind, seatType].filter(Boolean).join(' - ');
              return (
                <div key={oi.id} className="row">
                  <div>
                    <div>{name}</div>
                    <div className="small muted">{oi.quantity} × {formatBRL(unitNoFee)}</div>
                  </div>
                  <div className="tot">{formatBRL(unitNoFee * oi.quantity)}</div>
                </div>
              );
            })}
            <div className="divider" />
            <div className="row">
              <div className="muted">Ingressos</div>
              <div>{formatBRL(ticketsSubtotal)}</div>
            </div>
            <div className="row">
              <div className="muted">Taxa de serviço</div>
              <div>{formatBRL(serviceFee)}</div>
            </div>
            <div className="divider" />
            <div className="row">
              <div className="muted">Total</div>
              <div className="tot">{formatBRL(order.totalCents)}</div>
            </div>
          </section>

          <section style={{ marginTop: 16 }}>
            <div className="h2">Detalhes do pagamento</div>
            <div className="divider" />
            <div className="row">
              <div className="muted">Meio de pagamento</div>
              <div style={{ textTransform: 'uppercase' }}>{cardInfo?.brand ?? '—'}</div>
            </div>
            <div className="row">
              <div className="muted">Cartão</div>
              <div>{cardInfo?.last4 ? `**** **** **** ${cardInfo.last4}` : '—'}</div>
            </div>
            <div className="row">
              <div className="muted">Status</div>
              <div>
                <span className="badge">{paymentStatusLabel(order.status)}</span>
              </div>
            </div>
            <div className="row">
              <div className="muted">Data</div>
              <div>{fmtDate(order.createdAt)}</div>
            </div>
          </section>

          <footer className="small muted" style={{ marginTop: 24 }}>
            TicketFlow • Este recibo foi gerado para fins de conferência do pedido.
          </footer>
        </main>
      </body>
    </html>
  );
}
