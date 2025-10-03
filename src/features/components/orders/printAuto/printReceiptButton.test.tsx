import React from 'react';
import { render, screen, fireEvent, within, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrintReceiptButton } from './printReceiptButton';

type PRBProps = Parameters<typeof PrintReceiptButton>[0];

vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
}));

vi.mock('../../ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

describe('PrintReceiptButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const baseProps: PRBProps = {
    orderId: 'o12345678',
    items: [
      { name: 'Pista', quantity: 1, unitPriceCents: 1000 },
      { name: 'VIP', quantity: 2, unitPriceCents: 2500 },
    ],
    serviceFeeCents: 200,
    totalCents: 6200,
    status: 'PAID',
    createdAt: new Date('2025-01-02T03:04:05Z'),
    eventTitle: 'Banda X',
    eventCity: 'Sampa',
    eventStartsAt: new Date('2025-01-10T20:00:00Z'),
    paymentBrand: 'visa',
    paymentLast4: '4242',
  };

  function clickPrint(props: PRBProps = baseProps) {
    const { container } = render(<PrintReceiptButton {...props} />);
    const btn = within(container).getByRole('button', { name: /Imprimir resumo da compra/i });
    fireEvent.click(btn);
    const iframes = document.querySelectorAll('iframe[aria-hidden="true"]');
    return iframes[iframes.length - 1] as HTMLIFrameElement;
  }

  it('gera o HTML do recibo e imprime via fallback de polling', () => {
    const iframe = clickPrint();

    const html = iframe.contentDocument!.documentElement!.innerHTML;

    expect(html).toContain('Itens do pedido');
    expect(html).toContain('Pista');
    expect(html).toContain('VIP');
    expect(html).toContain('R$ 10.00');
    expect(html).toContain('R$ 50.00');
    expect(html).toContain('R$ 62.00');
    expect(html).toContain('Banda X - Sampa');
    expect(html).toContain('**** **** **** 4242');
    expect(html).toContain('Aprovado');

    const printSpy = vi.spyOn(iframe.contentWindow as any, 'print').mockImplementation(() => {});

    vi.advanceTimersByTime(61);
    expect(printSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(document.querySelector('iframe[aria-hidden="true"]')).toBeNull();
  });

  it('imprime uma única vez quando onload dispara e depois o polling roda', () => {
    const iframe = clickPrint();
    const printSpy = vi.spyOn(iframe.contentWindow as any, 'print').mockImplementation(() => {});

    (iframe as any).onload && (iframe as any).onload();

    vi.advanceTimersByTime(1000);
    expect(printSpy).toHaveBeenCalledTimes(1);

    expect(document.querySelector('iframe[aria-hidden="true"]')).toBeNull();
  });

  it('retorna cedo quando o documento do iframe não está disponível', () => {
    const origCreate = document.createElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
      const el = origCreate.call(document, tagName) as HTMLIFrameElement;
      if (tagName.toLowerCase() === 'iframe') {
        Object.defineProperty(el, 'contentDocument', { configurable: true, get: () => null });
        Object.defineProperty(el, 'contentWindow', { configurable: true, get: () => undefined });
      }
      return el as any;
    });

    render(<PrintReceiptButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Imprimir resumo da compra/i }));

    const iframe = document.querySelector('iframe[aria-hidden="true"]') as HTMLIFrameElement | null;
    expect(iframe).not.toBeNull();
    vi.runOnlyPendingTimers();
    expect(document.querySelector('iframe[aria-hidden="true"]')).not.toBeNull();

    (document.createElement as any).mockRestore();
  });

  it('mapeia labels de status no HTML (REFUNDED, FAILED, CREATED)', () => {
    let iframe = clickPrint({ ...baseProps, status: 'REFUNDED' });
    expect(iframe.contentDocument!.documentElement!.innerHTML).toContain('Reembolsado');

    iframe = clickPrint({ ...baseProps, status: 'FAILED' });
    expect(iframe.contentDocument!.documentElement!.innerHTML).toContain('Falhou');

    iframe = clickPrint({ ...baseProps, status: 'CREATED' });
    expect(iframe.contentDocument!.documentElement!.innerHTML).toContain('Em processamento');
  });

  it('não renderiza bloco do evento sem title; e mostra só o title quando city ausente (fmtDate vazio p/ startsAt)', () => {
    cleanup();
    let iframe = clickPrint({ ...baseProps, eventTitle: '', eventCity: 'São Paulo', eventStartsAt: new Date(0) });
    let html = iframe.contentDocument!.documentElement!.innerHTML;
    expect(html).not.toContain(' - Sampa');
    expect(html).not.toMatch(/class="small muted">.*<\/div>\s*<\/header>/);
  
    cleanup();
    iframe = clickPrint({ ...baseProps, eventTitle: 'Meu Show', eventCity: '' });
    html = iframe.contentDocument!.documentElement!.innerHTML;
    expect(html).toContain('Meu Show');
    expect(html).not.toContain('Meu Show -');
  });
  
  it('fallbacks: paymentBrand → "—" e cartão → "—" quando não informados', () => {
    cleanup();
    const iframe = clickPrint({ ...baseProps, paymentBrand: '', paymentLast4: '' });
    const html = iframe.contentDocument!.documentElement!.innerHTML;
    expect(html).toContain('Meio de pagamento</div><div style="text-transform:uppercase">—</div>');
    expect(html).toContain('<div class="muted">Cartão</div><div>—</div>');
  });
  
  it('usa contentWindow.document quando contentDocument é null (2º termo do coalesce)', () => {
    vi.useFakeTimers();
    cleanup();
  
    const cwPrint = vi.fn();
    const docStub: any = {
      readyState: 'loading',
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn(function () {
        docStub.readyState = 'complete';
      }),
    };
  
    const originalCD = Object.getOwnPropertyDescriptor(
      HTMLIFrameElement.prototype,
      'contentDocument',
    );
    const originalCW = Object.getOwnPropertyDescriptor(
      HTMLIFrameElement.prototype,
      'contentWindow',
    );
  
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
      configurable: true,
      get() {
        return null;
      },
    });
    const cwObj = { document: docStub, focus: vi.fn(), print: cwPrint };
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      configurable: true,
      get() {
        return cwObj as any;
      },
    });
  
    const iframe = clickPrint({ ...baseProps, paymentBrand: '', paymentLast4: '' });
  
    expect(docStub.open).toHaveBeenCalled();
    expect(docStub.write).toHaveBeenCalled();
    expect(docStub.close).toHaveBeenCalled();

    act(() => {
      (iframe as any).onload && (iframe as any).onload();
    });
    expect(cwPrint).toHaveBeenCalledTimes(1);
  
    if (originalCD) Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', originalCD);
    if (originalCW) Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', originalCW);
    vi.useRealTimers();
  });
  
  it('pollReady: primeiro loading (ramo else) depois complete → chama doPrint; captura erro de print (catch) e não imprime 2x (printed guard)', () => {
    vi.useFakeTimers();
    cleanup();
  
    const iframe = clickPrint(baseProps);
  
    const fakeDoc: any = { readyState: 'loading' };
    Object.defineProperty(iframe, 'contentDocument', { configurable: true, value: fakeDoc });
  
    const cw = iframe.contentWindow!;
    const printSpy = vi.fn(() => {
      throw new Error('boom');
    });
    cw.print = printSpy;
  
    act(() => vi.advanceTimersByTime(65));
    fakeDoc.readyState = 'complete';
    act(() => vi.advanceTimersByTime(55));
    expect(printSpy).toHaveBeenCalledTimes(1);
  
    act(() => {
      (iframe as any).onload && (iframe as any).onload();
    });
    expect(printSpy).toHaveBeenCalledTimes(1);
  
    act(() => vi.advanceTimersByTime(600));
    expect(document.querySelector('iframe[aria-hidden="true"]')).toBeNull();
  
    vi.useRealTimers();
  });
});
