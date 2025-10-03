import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefundConfirmButton } from './refundConfirmButton';

const h = vi.hoisted(() => ({ dialog: { lastProps: null as any } }));

vi.mock('./confirmDialog', () => ({
  __esModule: true,
  default: (props: any) => {
    h.dialog.lastProps = props;
    return <div data-testid="confirm-dialog" data-open={props.open ? '1' : '0'} />;
  },
}));

describe('RefundConfirmButton (client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.dialog.lastProps = null;
  });

  it('renderiza botão, input hidden com orderId e abre o diálogo ao clicar', () => {
    render(
      <RefundConfirmButton orderId="ord_123" action={vi.fn()}>
        Reembolso
      </RefundConfirmButton>,
    );

    const hidden = screen.getByDisplayValue('ord_123') as HTMLInputElement;
    expect(hidden).toHaveAttribute('name', 'orderId');
    expect(hidden.type).toBe('hidden');

    const btn = screen.getByRole('button', { name: /Solicitar reembolso/i });
    fireEvent.click(btn);

    expect(h.dialog.lastProps).toBeTruthy();
    expect(h.dialog.lastProps.open).toBe(true);
  });

  it('confirmar dispara requestSubmit do form', () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype as any, 'requestSubmit')
      .mockImplementation(() => {});

    render(
      <RefundConfirmButton orderId="ord_123" action={vi.fn()}>
        Reembolso
      </RefundConfirmButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Solicitar reembolso/i }));
    expect(h.dialog.lastProps.open).toBe(true);

    h.dialog.lastProps.onConfirm();
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it('fechar via onClose do diálogo volta open=false', async () => {
    render(
      <RefundConfirmButton orderId="ord_123" action={vi.fn()}>
        Reembolso
      </RefundConfirmButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Solicitar reembolso/i }));
    expect(h.dialog.lastProps.open).toBe(true);

    h.dialog.lastProps.onClose();
    await waitFor(() => expect(h.dialog.lastProps.open).toBe(false));
  });

  it('quando disabled=true não abre diálogo nem chama submit; tem atributos/classes corretos', () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype as any, 'requestSubmit')
      .mockImplementation(() => {});

    render(
      <RefundConfirmButton orderId="ord_123" action={vi.fn()} disabled>
        Reembolso
      </RefundConfirmButton>,
    );

    const btn = screen.getByRole('button', { name: /Solicitar reembolso/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn.className).toMatch(/cursor-not-allowed/);
    expect(btn.className).toMatch(/opacity-60/);

    fireEvent.click(btn);

    expect(h.dialog.lastProps.open).toBe(false);
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
