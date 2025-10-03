import React from 'react';
import { UserMenu } from './userMenu';             
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/(auth)/account/actions', () => ({
  signOutAction: vi.fn(),
}));

describe('UserMenu', () => {
  it('mostra informações do usuário, link de pedidos e botão Sair', async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ id: 'u1', email: 'ana@ex.com', name: 'Ana' }} />);

    await user.click(screen.getByRole('button', { name: /^olá\s+ana$/i }));

    expect(screen.getByText(/^Ana$/)).toBeInTheDocument();
    expect(screen.getByText(/ana@ex\.com/i)).toBeInTheDocument();

    const pedidos = screen.getByRole('menuitem', { name: /Meus pedidos/i });
    expect(pedidos).toHaveAttribute('href', '/orders');

    const sair = screen.getByRole('menuitem', { name: /sair/i });
    expect(sair.closest('form')).toBeTruthy();
  });

  it('botão do trigger usa name quando presente', () => {
    render(<UserMenu user={{ id: 'u1', email: 'ana@ex.com', name: 'Ana' }} />);
    expect(screen.getByRole('button', { name: /^olá\s+ana$/i })).toBeInTheDocument();
  });

  it('fallback no trigger: usa email quando name está ausente', () => {
    render(<UserMenu user={{ id: 'u1', email: 'sem-nome@ex.com', name: null as any }} />);
    expect(screen.getByRole('button', { name: /^olá\s+sem-nome@ex\.com$/i })).toBeInTheDocument();
  });
});
