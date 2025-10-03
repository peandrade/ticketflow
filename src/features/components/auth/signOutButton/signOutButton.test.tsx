import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

const RD_H = vi.hoisted(() => ({
  useFormStatus: vi.fn(() => ({ pending: false })),
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<any>('react-dom');
  return { ...actual, useFormStatus: RD_H.useFormStatus };
});

vi.mock('@/app/(auth)/account/actions', () => ({
  signOutAction: vi.fn(),
}));

import SignOutButton from './signOutButton';

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RD_H.useFormStatus.mockReturnValue({ pending: false });
  });

  it('renderiza um <form> com botão "Sair" habilitado (pending=false)', () => {
    render(<SignOutButton />);

    const form = document.querySelector('form');
    expect(form).toBeTruthy();

    const btn = screen.getByRole('button', { name: /^sair$/i });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toBeEnabled();
  });

  it('quando pending=true exibe "Saindo..." e desabilita o botão', () => {
    RD_H.useFormStatus.mockReturnValueOnce({ pending: true });

    render(<SignOutButton />);

    const btn = screen.getByRole('button', { name: /saindo\.\.\./i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('type', 'submit');
  });
});
