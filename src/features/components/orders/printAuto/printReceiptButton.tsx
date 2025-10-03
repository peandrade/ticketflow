'use client';

import React from 'react';
import { formatBRL } from '@/core/utils';
import { Button } from '../../ui/button';

type Item = { name: string; quantity: number; unitPriceCents: number };

type Props = {
  orderId: string;
  items: Item[];
  serviceFeeCents: number;
  totalCents: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string | Date;
  eventTitle?: string;
  eventCity?: string;
  eventStartsAt?: string | Date;
  paymentBrand?: string;
  paymentLast4?: string;
  className?: string;
};

function fmtDate(d: string | Date | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleString('pt-BR');
}

function statusLabel(s: Props['status']) {
  switch (s) {
    case 'PAID': return 'Aprovado';
    case 'REFUNDED': return 'Reembolsado';
    case 'FAILED': return 'Falhou';
    default: return 'Em processamento';
  }
}

function buildReceiptHTML(p: Props) {
  const ticketsSubtotal = p.items.reduce((acc, it) => acc + it.quantity * it.unitPriceCents, 0);
  const itemsRows = p.items.map(it => `
    <div class="row">
      <div>
        <div>${it.name}</div>
        <div class="small muted">${it.quantity} × ${formatBRL(it.unitPriceCents)}</div>
      </div>
      <div class="tot">${formatBRL(it.quantity * it.unitPriceCents)}</div>
    </div>
  `).join('');

  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Recibo do pedido #${p.orderId.slice(0,8)} • TicketFlow</title>
    <style>
      @page { size: A4; margin: 14mm; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; color: #111; }
      .container { max-width: 720px; margin: 0 auto; }
      .muted { color: #6b7280; }
      .small { font-size: 15px; }
      .title { font-weight: 700; font-size: 18px; margin: 2px 0px; }
      .h2 { font-weight: 600; margin: 12px 0 6px; }
      .divider { border-top: 1px solid #e5e7eb; margin: 8px 0; }
      .row { display:flex; justify-content:space-between; padding:8px 0; }
      .tot { font-weight: 700; }
      .badge { display:inline-block; border-radius:9999px; padding:2px 8px; font-size:16px; background:#e5fbe6; color:#0a7b12; }
    </style>
  </head>
  <body>
    <main class="container">
      <header style="margin-bottom: 12px">
        <div class="small muted">${fmtDate(new Date())}</div>
        <div class="title">Detalhes do pedido #${p.orderId.slice(0,8)}</div>
        ${p.eventTitle ? `<div class="muted">${p.eventTitle}${p.eventCity ? ` - ${p.eventCity}` : ''}</div>` : ''}
        ${p.eventStartsAt ? `<div class="small muted">${fmtDate(p.eventStartsAt)}</div>` : ''}
      </header>

      <section>
        <div class="h2">Itens do pedido</div>
        <div class="divider"></div>
        ${itemsRows}
        <div class="divider"></div>
        <div class="row"><div class="muted">Ingressos</div><div>${formatBRL(ticketsSubtotal)}</div></div>
        <div class="row"><div class="muted">Taxa de serviço</div><div>${formatBRL(p.serviceFeeCents)}</div></div>
        <div class="divider"></div>
        <div class="row"><div class="muted">Total</div><div class="tot">${formatBRL(p.totalCents)}</div></div>
      </section>

      <section style="margin-top: 16px">
        <div class="h2">Detalhes do pagamento</div>
        <div class="divider"></div>
        <div class="row"><div class="muted">Meio de pagamento</div><div style="text-transform:uppercase">${p.paymentBrand ?? '—'}</div></div><hr>
        <div class="row"><div class="muted">Cartão</div><div>${p.paymentLast4 ? `**** **** **** ${p.paymentLast4}` : '—'}</div></div><hr>
        <div class="row"><div class="muted">Status</div><div><span class="badge medium">${statusLabel(p.status)}</span></div></div><hr>
        <div class="row"><div class="muted">Data</div><div>${fmtDate(p.createdAt)}</div></div><hr>
      </section>

      <footer class="small muted" style="margin-top:24px">
        TicketFlow • Este recibo foi gerado para fins de conferência do pedido.
      </footer>
    </main>
  </body>
  </html>`;
}

export function PrintReceiptButton(props: Props) {
  function handlePrint() {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const html = buildReceiptHTML(props);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {}
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 500);
    };

    iframe.onload = doPrint;

    doc.open();
    doc.write(html);
    doc.close();

    const pollReady = () => {
      if (printed) return;
      const ready = (iframe.contentDocument && iframe.contentDocument.readyState === 'complete');
      if (ready) doPrint();
      else setTimeout(pollReady, 50);
    };
    setTimeout(pollReady, 60);
  }

  return (
    <Button
      type="button"
      variant="link"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 text-blue-600 hover:underline print:hidden"
      aria-label="Imprimir resumo da compra"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9V3h12v6M6 14h12v7H6v-7Z" stroke="currentColor" strokeWidth="2" />
        <path
          d="M4 10h16a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      Imprimir resumo da compra
    </Button>
  );
}
