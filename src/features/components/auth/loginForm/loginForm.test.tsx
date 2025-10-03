import React from 'react';
import type { Mock } from 'vitest';
import LoginForm from './loginForm';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

type Res = { ok: boolean; json: () => Promise<any> };

function deferred<T = any>() {
  let resolve!: (v: T | PromiseLike<T>) => void;
  let reject!: (e?: unknown) => void;
  const p = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise: p, resolve, reject };
}

const origFetch = global.fetch;
const origLocation = window.location;

describe('LoginForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...origLocation, href: 'http://localhost/' },
    });
  });

  afterEach(() => {
    vi.stubGlobal('fetch', origFetch as any);
    Object.defineProperty(window, 'location', { writable: true, value: origLocation });
  });

  it('monta payload com email/senha, envia POST JSON e mostra loading durante a requisição', async () => {
    const user = userEvent.setup();

    const d = deferred<Res>();
    (fetch as unknown as Mock).mockReturnValueOnce(d.promise);

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'a@b.com');
    await user.type(screen.getByPlaceholderText(/senha/i), '123456');

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as unknown as Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/login');
    expect(init?.method).toBe('POST');
    expect((init?.headers as any)['Content-Type']).toBe('application/json');

    const parsed = JSON.parse(String(init?.body));
    expect(parsed).toEqual({ email: 'a@b.com', password: '123456' });

    d.resolve({ ok: false, json: async () => ({ error: 'Falha' }) });

    await waitFor(() => expect(screen.getByText(/falha/i)).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled();

    expect(screen.queryByRole('button', { name: /entrando/i })).not.toBeInTheDocument();
  });

  it('em sucesso, redireciona para "/"', async () => {
    const user = userEvent.setup();
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'a@b.com');
    await user.type(screen.getByPlaceholderText(/senha/i), '123456');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });

  it('quando res.ok=false e json() retorna error, exibe mensagem do backend', async () => {
    const user = userEvent.setup();
    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Credenciais inválidas' }),
    });

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'x@y.com');
    await user.type(screen.getByPlaceholderText(/senha/i), 'errada');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/credenciais inválidas/i)).toBeInTheDocument();

    expect(window.location.href).not.toBe('/');
  });

  it('quando res.ok=false e json() falha, exibe fallback "Não foi possivel entrar"', async () => {
    const user = userEvent.setup();
    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('parse error');
      },
    });

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'x@y.com');
    await user.type(screen.getByPlaceholderText(/senha/i), 'errada');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/não foi poss[ií]vel entrar/i)).toBeInTheDocument();
    expect(window.location.href).not.toBe('/');
  });

  it('inputs possuem required e placeholders esperados', () => {
    render(<LoginForm />);
    const email = screen.getByPlaceholderText(/email@exemplo\.com/i) as HTMLInputElement;
    const pass = screen.getByPlaceholderText(/senha/i) as HTMLInputElement;

    expect(email).toBeRequired();
    expect(pass).toBeRequired();
  });

  it('coalesce de campos ausentes para string vazia no payload', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Falha' }) });

    render(<LoginForm />);

    const form = document.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(fetch as any).toHaveBeenCalledTimes(1));

    const [, init] = (fetch as any).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({ email: '', password: '' });
  });
});
