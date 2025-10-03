import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { OrderSummary } from './orderSummary';

vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
  cn: (...cls: any[]) => cls.filter(Boolean).join(' '),
}));

vi.mock('@/features/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

vi.mock('@/app/orders', () => ({
  requestRefundAction: vi.fn(),
}));

const RD_H = vi.hoisted(() => ({
  useFormState: vi.fn((_: any, __: any) => [{}, vi.fn()]),
  useFormStatus: vi.fn(() => ({ pending: false })),
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<any>('react-dom');
  return { ...actual, useFormState: RD_H.useFormState, useFormStatus: RD_H.useFormStatus };
});

describe('OrderSummary', () => {
  const items = [
    { id: 't1', name: 'Pista', quantity: 2, unitPriceCents: 78000, feeCents: 1500 },
    { id: 't2', name: 'Camarote', quantity: 1, unitPriceCents: 120000, feeCents: 2500 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    RD_H.useFormState.mockImplementation((_: any, __: any) => [{}, vi.fn()]);
    RD_H.useFormStatus.mockImplementation(() => ({ pending: false }));
    document.body.style.overflow = '';
  });

  it('mostra totais e habilita reembolso quando permitido', () => {
    render(
      <OrderSummary
        orderId="o1"
        status="PAID"
        items={items as any}
        canRefund={true}
        serviceFeeCents={500}
      />,
    );

    expect(screen.getByText(/Pista/i)).toBeInTheDocument();
    expect(screen.getByText(/Camarote/i)).toBeInTheDocument();

    expect(screen.getByText('R$ 2760.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 5.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 2765.00')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Solicitar reembolso/i });
    expect(btn).toBeEnabled();
    expect(btn).toHaveAttribute('aria-disabled', 'false');
  });

  it('desabilita reembolso e mostra aviso quando não permitido', () => {
    render(
      <OrderSummary
        orderId="o2"
        status="PAID"
        items={items as any}
        canRefund={false}
        serviceFeeCents={0}
      />,
    );

    const btn = screen.getByRole('button', { name: /Solicitar reembolso/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Reembolso indisponível/i)).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando state.error existe', () => {
    RD_H.useFormState.mockImplementationOnce(() => [
      { error: 'Falha ao solicitar reembolso' },
      vi.fn(),
    ]);

    render(
      <OrderSummary
        orderId="o3"
        status="PAID"
        items={items as any}
        canRefund={true}
        serviceFeeCents={0}
      />,
    );

    expect(screen.getByText('Falha ao solicitar reembolso')).toBeInTheDocument();
  });

  it('quando status="REFUNDED" mostra aviso "Pedido reembolsado."', () => {
    render(
      <OrderSummary
        orderId="o4"
        status="REFUNDED"
        items={items as any}
        canRefund={false}
        serviceFeeCents={0}
      />,
    );

    const msgs = screen.getAllByText(/pedido reembolsado\./i);
    expect(msgs.some((el) => !(el as HTMLElement).classList.contains('sr-only'))).toBe(true);

    expect(screen.getByRole('button', { name: /Solicitar reembolso/i })).toBeDisabled();
  });

  it('abre o diálogo ao clicar no botão e fecha com Escape; foca "Não" e restaura overflow', async () => {
    vi.useFakeTimers();
    render(
      <OrderSummary
        orderId="o5"
        status="PAID"
        items={items as any}
        canRefund={true}
        serviceFeeCents={0}
      />,
    );

    const trigger = screen.getByRole('button', { name: /Solicitar reembolso/i });
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: /Confirmar solicitação de reembolso/i });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText(/isso cancelará seus ingressos e poderá ser irreversível/i),
    ).toBeInTheDocument();

    vi.runAllTimers();
    const cancelBtn = screen.getByRole('button', { name: 'Não' });
    expect(document.activeElement).toBe(cancelBtn);

    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    expect(document.body.style.overflow).not.toBe('hidden');
    vi.useRealTimers();
  });

  it('clicar em "Sim, solicitar reembolso" chama requestSubmit e fecha o diálogo', () => {
    const reqSpy = vi
      .spyOn(HTMLFormElement.prototype as any, 'requestSubmit')
      .mockImplementation(() => {});

    render(
      <OrderSummary
        orderId="o6"
        status="PAID"
        items={items as any}
        canRefund={true}
        serviceFeeCents={0}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Solicitar reembolso/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sim, solicitar reembolso/i }));

    expect(reqSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    reqSpy.mockRestore();
  });

  it('clicar em "Não" fecha o diálogo', () => {
    render(
      <OrderSummary
        orderId="o7"
        status="PAID"
        items={items as any}
        canRefund={true}
        serviceFeeCents={0}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Solicitar reembolso/i }));
    const cancelBtn = screen.getByRole('button', { name: 'Não' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('quando pending=true (useFormStatus) desabilita o botão e define aria-busy', () => {
    RD_H.useFormStatus.mockReturnValueOnce({ pending: true });

    render(
      <OrderSummary
        orderId="o8"
        status="PAID"
        items={items as any}
        canRefund={true}
        serviceFeeCents={0}
      />,
    );

    const btn = screen.getByRole('button', { name: /Solicitar reembolso/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('não abre o diálogo quando reembolso indisponível', () => {
    render(
      <OrderSummary
        orderId="o9"
        status="PAID"
        items={items as any}
        canRefund={false}
        serviceFeeCents={0}
      />,
    );

    const btn = screen.getByRole('button', { name: /Solicitar reembolso/i });
    fireEvent.click(btn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
