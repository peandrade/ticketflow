import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

const H = vi.hoisted(() => ({
  getSessionUser: vi.fn(),

  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,

  AuthModal: ({ children }: any) => <div data-testid="auth-modal">{children}</div>,
  UserMenu: ({ user }: any) => <div data-testid="user-menu">{user?.email}</div>,
}));

vi.mock('../ui/button', () => ({
  __esModule: true,
  default: H.Button,
  Button: H.Button,
}));

vi.mock('@/core/auth', () => ({
  getSessionUser: H.getSessionUser,
}));

vi.mock('../auth', () => ({
  __esModule: true,
  AuthModal: H.AuthModal,
  UserMenu: H.UserMenu,
}));

import { Header } from './header';
import { getSessionUser } from '@/core/auth';

describe('Header (Server Component)', () => {
  it('anônimo: exibe AuthModal e botão Entrar', async () => {
    (getSessionUser as any).mockResolvedValueOnce(null);

    const Comp = await Header();
    render(Comp as any);

    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('autenticado: exibe UserMenu com email', async () => {
    (getSessionUser as any).mockResolvedValueOnce({ id: 'u1', email: 'a@b.com' });

    const Comp = await Header();
    render(Comp as any);

    expect(screen.getByTestId('user-menu')).toHaveTextContent('a@b.com');
  });
});
