import React from 'react';
import { AuthModal } from './authModal';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ACTIONS = vi.hoisted(() => ({
  signInAction: function signInAction() {},
  signUpAction: function signUpAction() {},
}));

vi.mock('@/app/(auth)/account/actions', () => ({
  signInAction: ACTIONS.signInAction,
  signUpAction: ACTIONS.signUpAction,
}));

vi.mock('@/stores/auth', () => {
  const state = { token: null as string | null, open: true, setOpen: vi.fn(), setToken: vi.fn() };
  const useAuth = (selector?: (s: typeof state) => any) => (selector ? selector(state) : state);
  (useAuth as any).getState = () => state;
  return { useAuth };
});

const RD_H = vi.hoisted(() => ({
  useFormState: vi.fn((_: any, __: any) => [{}, vi.fn()]),
  useFormStatus: vi.fn(() => ({ pending: false })),
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<any>('react-dom');
  return {
    ...actual,
    useFormState: RD_H.useFormState,
    useFormStatus: RD_H.useFormStatus,
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/event/rock',
  useSearchParams: () => new URLSearchParams('ref=home&step=2'),
}));

vi.mock('@/components/ui/input', () => ({ Input: (p: any) => <input {...p} /> }));
vi.mock('@/components/ui/label', () => ({ Label: (p: any) => <label {...p} /> }));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ children }: any) => <>{children}</>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogClose: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/tabs', () => {
  const React = require('react') as typeof import('react');

  const Ctx = React.createContext<{ value: string; onValueChange?: (v: string) => void } | null>(
    null,
  );

  const Tabs = ({ value, onValueChange, children }: any) => (
    <Ctx.Provider value={{ value, onValueChange }}>{children}</Ctx.Provider>
  );

  const TabsList = ({ children }: any) => <div role="tablist">{children}</div>;

  const TabsTrigger = ({ value, children }: any) => {
    const ctx = React.useContext(Ctx);
    const selected = ctx?.value === value;
    return (
      <button
        role="tab"
        aria-selected={selected ? 'true' : 'false'}
        onClick={() => ctx?.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  };

  const TabsContent = ({ value, children }: any) => {
    const ctx = React.useContext(Ctx);
    if (ctx?.value !== value) return null;
    return <div>{children}</div>;
  };

  return { Tabs, TabsList, TabsTrigger, TabsContent };
});


describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (RD_H.useFormState as any)._i = 0;
    RD_H.useFormStatus.mockReturnValue({ pending: false });
    RD_H.useFormState.mockImplementation((_, __) => [{}, vi.fn()]);
  });

  it('abre com aba Entrar, alterna para Cadastrar e exibe campos acessíveis', async () => {
    render(
      <AuthModal>
        <button>trigger</button>
      </AuthModal>,
    );

    expect(screen.getByRole('tab', { name: /entrar/i })).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByLabelText(/e-?mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toHaveAttribute('type', 'submit');

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /cadastrar/i }));
    expect(screen.getByRole('tab', { name: /cadastrar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/e-?mail/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/senha/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar/i })).toHaveAttribute('type', 'submit');
  });

  it('SubmitButton: mostra "Enviando..." e fica desabilitado quando pending=true', () => {
    RD_H.useFormStatus.mockReturnValue({ pending: true });

    render(
      <AuthModal>
        <button>trigger</button>
      </AuthModal>,
    );

    const sending = screen.getByRole('button', { name: /enviando/i });
    expect(sending).toBeDisabled();
  });

  it('prefil e erro no LOGIN: mantém aba Entrar, mostra erro e popula e-mail', () => {
    RD_H.useFormState.mockImplementation((action: any) => {
      if (action === ACTIONS.signInAction) {
        return [{ error: 'Credenciais inválidas', fields: { email: 'a@b.com' } }, vi.fn()];
      }
      return [{}, vi.fn()];
    });

    render(
      <AuthModal>
        <button>trigger</button>
      </AuthModal>,
    );

    expect(screen.getByRole('tab', { name: /entrar/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/e-?mail/i) as HTMLInputElement).value).toBe('a@b.com');
  });

  it('prefil e erro no SIGNUP: muda aba para Cadastrar, mostra erro e popula nome/e-mail', async () => {
    RD_H.useFormState.mockImplementation((action: any) => {
      if (action === ACTIONS.signUpAction) {
        return [
          { error: 'Cadastro falhou', fields: { name: 'Ana', email: 'ana@ex.com' } },
          vi.fn(),
        ];
      }
      return [{}, vi.fn()];
    });

    render(
      <AuthModal>
        <button>trigger</button>
      </AuthModal>,
    );

    expect(screen.getByRole('tab', { name: /cadastrar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    expect(await screen.findByText(/cadastro falhou/i)).toBeInTheDocument();

    const name = screen.getByLabelText(/nome/i) as HTMLInputElement;
    const email = screen.getByLabelText(/e-?mail/i) as HTMLInputElement;
    expect(name.value).toBe('Ana');
    expect(email.value).toBe('ana@ex.com');
  });

  it('hidden "callbackUrl" usa pathname + querystring', () => {
    render(
      <AuthModal>
        <button>trigger</button>
      </AuthModal>,
    );

    const hiddenInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="callbackUrl"]'),
    );
    expect(hiddenInputs.length).toBeGreaterThan(0);
    hiddenInputs.forEach((inp) => {
      expect(inp.value).toBe('/event/rock?ref=home&step=2');
    });
  });

  it('callbackUrl sem querystring não inclui "?"', async () => {
    vi.resetModules();
    vi.doMock('next/navigation', () => ({
      usePathname: () => '/event/rock',
      useSearchParams: () => new URLSearchParams(''),
    }));

    const { AuthModal: FreshAuthModal } = await import('./authModal');

    render(
      <FreshAuthModal>
        <button>trigger</button>
      </FreshAuthModal>,
    );

    const hiddenInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[name="callbackUrl"]'),
    );

    expect(hiddenInputs.length).toBeGreaterThan(0);
    hiddenInputs.forEach((inp) => {
      expect(inp.value).toBe('/event/rock');
    });
  });
});
