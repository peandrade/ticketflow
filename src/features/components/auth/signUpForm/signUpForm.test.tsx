import React from 'react';
import type { Mock } from 'vitest';
import SignUpForm from './signUpForm';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

type Res = { ok: boolean; json: () => Promise<any> };

function deferred<T = any>() {
  let resolve!: (v: T | PromiseLike<T>) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const origFetch = global.fetch;
const origLocation = window.location;

describe('SignUpForm', () => {
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

  it('monta payload com name/email/password, envia POST JSON e mostra "Cadastrando..." durante a requisição', async () => {
    const user = userEvent.setup();
    const d = deferred<Res>();
    (fetch as unknown as Mock).mockReturnValueOnce(d.promise as any);

    render(<SignUpForm />);

    await user.type(screen.getByPlaceholderText(/seu nome/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'ana@ex.com');
    await user.type(screen.getByPlaceholderText(/senha/i), 's3nh4');

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(screen.getByRole('button', { name: /cadastrando/i })).toBeDisabled();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as unknown as Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/register');
    expect(init?.method).toBe('POST');
    expect((init?.headers as any)['Content-Type']).toBe('application/json');

    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({ name: 'Ana', email: 'ana@ex.com', password: 's3nh4' });

    d.resolve({ ok: false, json: async () => ({ error: 'Falha' }) });

    await waitFor(() => expect(screen.getByText(/falha/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /cadastrando/i })).not.toBeInTheDocument();
  });

  it('em sucesso, redireciona para "/"', async () => {
    const user = userEvent.setup();
    (fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any);

    render(<SignUpForm />);

    await user.type(screen.getByPlaceholderText(/seu nome/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'ana@ex.com');
    await user.type(screen.getByPlaceholderText(/senha/i), '123456');

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });

  it('quando res.ok=false e json() retorna error, exibe mensagem do backend', async () => {
    const user = userEvent.setup();
    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'E-mail já usado' }),
    } as any);

    render(<SignUpForm />);

    await user.type(screen.getByPlaceholderText(/seu nome/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'ana@ex.com');
    await user.type(screen.getByPlaceholderText(/senha/i), '123456');

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(await screen.findByText(/e-mail já usado/i)).toBeInTheDocument();
    expect(window.location.href).not.toBe('/');
  });

  it('quando res.ok=false e json() falha, exibe fallback "Falha no cadastro"', async () => {
    const user = userEvent.setup();
    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('bad json');
      },
    } as any);

    render(<SignUpForm />);

    await user.type(screen.getByPlaceholderText(/seu nome/i), 'Ana');
    await user.type(screen.getByPlaceholderText(/email@exemplo\.com/i), 'ana@ex.com');
    await user.type(screen.getByPlaceholderText(/senha/i), '123456');

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(await screen.findByText(/falha no cadastro/i)).toBeInTheDocument();
    expect(window.location.href).not.toBe('/');
  });

  it('inputs possuem não required e placeholders esperados', () => {
    render(<SignUpForm />);
    expect(screen.getByPlaceholderText(/seu nome/i)).not.toBeRequired();
    expect(screen.getByPlaceholderText(/email@exemplo\.com/i)).not.toBeRequired();
    expect(screen.getByPlaceholderText(/senha/i)).not.toBeRequired();
  });

  it('coalesce de campos ausentes para string vazia no payload (FormData.get undefined)', async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Falha' }),
    } as any);

    render(<SignUpForm />);

    const form = document.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(fetch as any).toHaveBeenCalledTimes(1));

    const [, init] = (fetch as any).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({ name: '', email: '', password: '' });
  });
});
