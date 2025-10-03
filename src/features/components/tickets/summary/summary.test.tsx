import React from 'react';
import Summary from './summary';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/core/utils', () => ({ formatBRL: (c: number) => `R$ ${(c / 100).toFixed(2)}` }));

const RD_H = vi.hoisted(() => ({
  useFormState: vi.fn((action: any, initial: any) => [initial, vi.fn()]),
  useFormStatus: vi.fn(() => ({ pending: false })),
}));
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<any>('react-dom');
  return { ...actual, useFormState: RD_H.useFormState, useFormStatus: RD_H.useFormStatus };
});

const AUTH_H = vi.hoisted(() => {
  const setOpen = vi.fn();
  const hook = vi.fn((selector?: any) => (selector ? selector({ setOpen }) : { setOpen }));
  return { setOpen, hook };
});
vi.mock('@/stores/auth', () => ({ useAuth: AUTH_H.hook }));

describe('Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RD_H.useFormState.mockImplementation((_, initial) => [initial, vi.fn()]);
    RD_H.useFormStatus.mockReturnValue({ pending: false });
    AUTH_H.setOpen.mockReset();
    AUTH_H.hook.mockClear();
  });
  it('Renderizar sumario com ingressos ja renderizados', async () => {
    const onSubmit = vi.fn();
    const item = [{ id: 'pista', name: 'Pista', qty: 2, unit: 78000, fee: 1500 }];
    render(<Summary items={item} onSubmit={onSubmit} />);

    expect(screen.getByText(/Pista/i)).toBeInTheDocument();
    expect(screen.getByText(/2/i)).toBeInTheDocument();
    expect(screen.getByText(/2 × R\$ 780\.00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 1590\.00/)).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Continuar/i });
    expect(button).toBeEnabled();
  });

  it('Renderizar tela com nenhum ingresso selecionado', async () => {
    render(<Summary items={[]} />);

    const button = screen.getByRole('button', { name: /Continuar/i });
    expect(button).toBeDisabled();

    const total = await screen.getAllByText(/R\$ 0\.00/);
    expect(total[1]).toBeInTheDocument();
  });

  it('exibe mensagem de erro com aria-live quando "error" é passado', () => {
    render(<Summary items={[]} error="Falha ao processar" />);
    const err = screen.getByText(/Falha ao processar/i);
    expect(err).toBeInTheDocument();
    expect(err).toHaveAttribute('aria-live', 'polite');
  });

  it('sem action: chama onSubmit(items) ao clicar no botão Continuar', async () => {
    const onSubmit = vi.fn();
    const items = [{ id: 'vip', name: 'VIP', qty: 1, unit: 10000 }];
    render(<Summary items={items} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(onSubmit).toHaveBeenCalledWith(items);
  });

  it('com action: renderiza <form>, inclui input hidden com itens e usa SubmitButton', () => {
    const items = [{ id: 'vip', name: 'VIP', qty: 1, unit: 10000 }];
    const fakeAction = vi.fn();
    render(<Summary items={items} action={fakeAction as any} />);

    const hidden = screen.getByDisplayValue(JSON.stringify(items)) as HTMLInputElement;
    expect(hidden).toBeInTheDocument();
    expect(hidden).toHaveAttribute('type', 'hidden');
    expect(hidden).toHaveAttribute('name', 'items');

    const btn = screen.getByRole('button', { name: /Ir para pagamento seguro no Stripe/i });
    expect(btn).toBeEnabled();
  });

  it('usa useEffect para abrir auth quando state.reason === "NEEDS_AUTH"', () => {
    RD_H.useFormState.mockReturnValueOnce([{ ok: false, reason: 'NEEDS_AUTH' }, vi.fn()]);
    render(<Summary items={[{ name: 'X', qty: 1, unit: 100 }]} action={vi.fn() as any} />);
    expect(AUTH_H.setOpen).toHaveBeenCalledWith(true);
  });

  it('SubmitButton: exibe "Redirecionando…" e fica disabled quando pending=true', () => {
    RD_H.useFormStatus.mockReturnValueOnce({ pending: true });
    render(<Summary items={[{ name: 'X', qty: 1, unit: 100 }]} action={vi.fn() as any} />);
    const btn = screen.getByRole('button', { name: /Ir para pagamento seguro no Stripe/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Redirecionando…/)).toBeInTheDocument();
  });

  it('executa noopAction (GENERIC_ERROR) quando action não é fornecido', async () => {
    const results: any[] = [];
  
    RD_H.useFormState.mockImplementationOnce((act: any, initial: any) => {
      act(new FormData()).then((v: any) => results.push(v));
      return [initial, vi.fn()];
    });
  
    render(<Summary items={[{ name: 'X', qty: 1, unit: 100 }]} />);
  
    await Promise.resolve();
  
    expect(results[0]).toEqual({ ok: false, reason: 'GENERIC_ERROR' });
  });
});
