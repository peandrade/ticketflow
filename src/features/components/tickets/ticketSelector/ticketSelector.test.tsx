import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

const RD_H = vi.hoisted(() => ({
  useFormState: vi.fn((action: any, initial: any) => [undefined, vi.fn()]),
  useFormStatus: vi.fn(() => ({ pending: true })),
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<any>('react-dom');
  return { ...actual, useFormState: RD_H.useFormState, useFormStatus: RD_H.useFormStatus };
});

vi.mock('@/app/event/[slug]/tickets/actions', () => ({
  saveOrderAction: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
  cn: (...cls: any[]) => cls.filter(Boolean).join(' '),
}));

import TicketSelector from './ticketSelector';

describe('TicketSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RD_H.useFormState.mockImplementation((_, initial) => [undefined, vi.fn()]);
    RD_H.useFormStatus.mockReturnValue({ pending: true });
  });

  const tickets = [
    { id: 't1', name: 'Pista', priceCents: 78000 },
    { id: 't2', name: 'Camarote', priceCents: 120000 },
  ];

  it('renderiza form com inputs hidden e botão Continuar desabilitado quando pending', async () => {
    const user = userEvent.setup();

    render(<TicketSelector performanceId="p1" tickets={tickets as any} />);

    const perf = screen.getByDisplayValue('p1') as HTMLInputElement;
    expect(perf).toHaveAttribute('name', 'performanceId');

    const itemsInput = document.querySelector('input[name="items"]') as HTMLInputElement | null;
    expect(itemsInput).not.toBeNull();

    const continuar = screen.getByRole('button', { name: /continuar/i });
    expect(continuar).toBeDisabled();

    const inc = screen.getAllByRole('button', { name: /aumentar/i })[0];
    await user.click(inc);
  });

  it('remove item ao zerar quantidade (delete next[id]) e não inclui no payload/summary', async () => {
    const user = userEvent.setup();
    RD_H.useFormStatus.mockReturnValue({ pending: false });

    render(<TicketSelector performanceId="p1" tickets={tickets as any} />);

    const inc = screen.getAllByRole('button', { name: /aumentar/i })[0];
    await user.click(inc);

    await screen.findByText(/1\s*×\s*R\$ 780\.00/i);

    let itemsInput = document.querySelector('input[name="items"]') as HTMLInputElement;
    await waitFor(() =>
      expect(JSON.parse(itemsInput.value)).toEqual([{ ticketTypeId: 't1', quantity: 1 }]),
    );

    const dec = screen.getAllByRole('button', { name: /diminuir/i })[0];
    await user.click(dec);

    await waitFor(() =>
      expect(screen.queryByText(/1\s*×\s*R\$ 780\.00/i)).not.toBeInTheDocument(),
    );

    itemsInput = document.querySelector('input[name="items"]') as HTMLInputElement;
    await waitFor(() => expect(JSON.parse(itemsInput.value)).toEqual([]));
  });

  it('propaga state.error para Summary (state?.error)', () => {
    RD_H.useFormState.mockReturnValueOnce([{ error: 'Cartão inválido' } as any, vi.fn()] as any);
    render(<TicketSelector performanceId="p1" tickets={tickets as any} />);
    const msg = screen.getByText(/cartão inválido/i);
    expect(msg).toBeInTheDocument();
    expect(msg).toHaveAttribute('aria-live', 'polite');
  });

  it('onSubmit do Summary chama requestSubmit() do form ativo', async () => {
    const user = userEvent.setup();
    RD_H.useFormStatus.mockReturnValue({ pending: false });

    render(<TicketSelector performanceId="p1" tickets={tickets as any} />);

    const inc = screen.getAllByRole('button', { name: /aumentar/i })[0];
    await user.click(inc);

    const form = document.querySelector('form') as HTMLFormElement;
    (form as any).requestSubmit = vi.fn();

    const btn = screen.getByRole('button', { name: /continuar/i }) as HTMLButtonElement;
    btn.focus();
    expect(document.activeElement).toBe(btn);
    await user.click(btn);
    expect((form as any).requestSubmit).toHaveBeenCalledTimes(1);
  });
});
