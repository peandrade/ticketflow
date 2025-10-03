import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

type ActionFn = (prevState: unknown, formData: FormData) => Promise<any>;
const mockSignUp = vi.fn<ActionFn>();
const mockSignIn = vi.fn<ActionFn>();

vi.mock("../actions", () => {
  const actions = {
    signUpAction: (s: unknown, f: FormData) => mockSignUp(s, f),
    signInAction: (s: unknown, f: FormData) => mockSignIn(s, f),
  } satisfies Record<string, ActionFn>;
  return actions;
});

import AccountPage from "./page";

const getSignup = () => {
  const section = screen.getByRole("heading", { name: /criar conta/i }).closest("section");
  if (!section) throw new Error("Seção 'Criar conta' não encontrada");
  return within(section);
};

const getSignin = () => {
  const section = screen.getByRole("heading", { name: /entrar/i }).closest("section");
  if (!section) throw new Error("Seção 'Entrar' não encontrada");
  return within(section);
};

function deferred<T>() {
  let resolve!: (v: T | PromiseLike<T>) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("AccountPage (client)", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("renderiza as seções e campos essenciais", () => {
    mockSignUp.mockResolvedValue({});
    mockSignIn.mockResolvedValue({});

    render(<AccountPage />);

    expect(screen.getByRole("heading", { name: /criar conta/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /entrar/i })).toBeInTheDocument();

    const su = getSignup();
    expect(su.getByPlaceholderText(/seu nome/i)).toBeInTheDocument();
    expect(su.getByPlaceholderText(/email@exemplo\.com/i)).toBeInTheDocument();
    expect(su.getByPlaceholderText(/senha/i)).toBeInTheDocument();

    const si = getSignin();
    expect(si.getByPlaceholderText(/email@exemplo\.com/i)).toBeInTheDocument();
    expect(si.getByPlaceholderText(/senha/i)).toBeInTheDocument();

    expect(su.getByRole("button", { name: /cadastrar/i })).toBeEnabled();
    expect(si.getByRole("button", { name: /^entrar$/i })).toBeEnabled();
  });

  it("exibe erro retornado pela signUpAction", async () => {
    mockSignUp.mockResolvedValueOnce({ error: "Preencha todos os campos." });
    mockSignIn.mockResolvedValue({});

    render(<AccountPage />);

    const su = getSignup();
    await userEvent.type(su.getByPlaceholderText(/seu nome/i), "Alice");
    await userEvent.type(su.getByPlaceholderText(/email@exemplo\.com/i), "alice@example.com");

    await userEvent.click(su.getByRole("button", { name: /cadastrar/i }));

    expect(await su.findByText(/preencha todos os campos\./i)).toBeInTheDocument();
    expect(mockSignUp).toHaveBeenCalledTimes(1);
  });

  it("exibe erro retornado pela signInAction", async () => {
    mockSignUp.mockResolvedValue({});
    mockSignIn.mockResolvedValueOnce({ error: "E-mail ou senha inválidos." });

    render(<AccountPage />);

    const si = getSignin();
    await userEvent.type(si.getByPlaceholderText(/email@exemplo\.com/i), "user@example.com");
    await userEvent.type(si.getByPlaceholderText(/senha/i), "pw");

    await userEvent.click(si.getByRole("button", { name: /^entrar$/i }));

    expect(await si.findByText(/e-mail ou senha inválidos\./i)).toBeInTheDocument();
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('mostra "Enviando..." e desabilita o botão durante submit do signup', async () => {
    const d = deferred<any>();
    mockSignUp.mockImplementationOnce(async () => d.promise);
    mockSignIn.mockResolvedValue({});

    render(<AccountPage />);

    const su = getSignup();
    await userEvent.type(su.getByPlaceholderText(/seu nome/i), "Alice");
    await userEvent.type(su.getByPlaceholderText(/email@exemplo\.com/i), "alice@example.com");
    await userEvent.type(su.getByPlaceholderText(/senha/i), "123");

    await userEvent.click(su.getByRole("button", { name: /cadastrar/i }));

    const pendingBtn = await su.findByRole("button", { name: /enviando/i });
    expect(pendingBtn).toBeDisabled();

    d.resolve({});
    const readyBtn = await su.findByRole("button", { name: /cadastrar/i });
    expect(readyBtn).toBeEnabled();
  });
});
