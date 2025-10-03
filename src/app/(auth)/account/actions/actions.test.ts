import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/core/auth", () => ({
  registerUser: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn(),
}));

import { redirect } from "next/navigation";
import {
  registerUser,
  loginWithPassword,
  logout,
} from "@/core/auth";

import {
  signUpAction,
  signInAction,
  signOutAction,
} from "./index";

const r = vi.mocked(redirect);
const reg = vi.mocked(registerUser);
const login = vi.mocked(loginWithPassword);
const lgout = vi.mocked(logout);

describe("auth server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signUpAction", () => {
    it("retorna erro quando faltar campos obrigatórios", async () => {
      const fd = new FormData();
      fd.set("name", "Alice");
      fd.set("password", "pw");

      const res = await signUpAction({}, fd);

      expect(res).toEqual({
        error: "Preencha todos os campos.",
        fields: { name: "Alice", email: "" },
      });
      expect(reg).not.toHaveBeenCalled();
      expect(r).not.toHaveBeenCalled();
    });

    it("retorna erro quando registerUser falhar", async () => {
      reg.mockResolvedValueOnce(null as any);

      const fd = new FormData();
      fd.set("name", "Alice");
      fd.set("email", "alice@example.com");
      fd.set("password", "pw");

      const res = await signUpAction({}, fd);

      expect(res).toEqual({
        error: "Não foi possível criar sua conta.",
        fields: { name: "Alice", email: "alice@example.com" },
      });
      expect(reg).toHaveBeenCalledTimes(1);
      expect(r).not.toHaveBeenCalled();
    });

    it("sucesso: trima name/email, NÃO trima password, e redireciona para callbackUrl", async () => {
      reg.mockResolvedValueOnce({ id: "u1" } as any);

      const fd = new FormData();
      fd.set("name", " Alice ");
      fd.set("email", "  alice@example.com ");
      fd.set("password", " 123 ");
      fd.set("callbackUrl", "/conta");

      const res = await signUpAction({}, fd);

      expect(reg).toHaveBeenCalledWith("Alice", "alice@example.com", " 123 ");
      expect(r).toHaveBeenCalledWith("/conta");
      expect(res).toBeUndefined();
    });

    it('sucesso: usa "/" quando callbackUrl não for fornecido', async () => {
      reg.mockResolvedValueOnce({ id: "u1" } as any);

      const fd = new FormData();
      fd.set("name", "A");
      fd.set("email", "a@b.com");
      fd.set("password", "pw");

      await signUpAction({}, fd);

      expect(r).toHaveBeenCalledWith("/");
    });
  });

  describe("signInAction", () => {
    it("retorna erro quando faltar email ou senha", async () => {
      const fd = new FormData();
      fd.set("email", "user@example.com");

      const res = await signInAction({}, fd);

      expect(res).toEqual({
        error: "Preencha e-mail e senha.",
        fields: { email: "user@example.com" },
      });
      expect(login).not.toHaveBeenCalled();
      expect(r).not.toHaveBeenCalled();
    });

    it("retorna erro quando loginWithPassword falhar", async () => {
      login.mockResolvedValueOnce(null as any);

      const fd = new FormData();
      fd.set("email", "user@example.com");
      fd.set("password", "pw");

      const res = await signInAction({}, fd);

      expect(res).toEqual({
        error: "E-mail ou senha inválidos.",
        fields: { email: "user@example.com" },
      });
      expect(login).toHaveBeenCalledTimes(1);
      expect(r).not.toHaveBeenCalled();
    });

    it("sucesso: trima email, NÃO trima password e redireciona para callbackUrl", async () => {
      login.mockResolvedValueOnce({ id: "u1" } as any);

      const fd = new FormData();
      fd.set("email", "  user@example.com ");
      fd.set("password", " 123 ");
      fd.set("callbackUrl", "/dashboard");

      const res = await signInAction({}, fd);

      expect(login).toHaveBeenCalledWith("user@example.com", " 123 ");
      expect(r).toHaveBeenCalledWith("/dashboard");
      expect(res).toBeUndefined();
    });

    it('sucesso: usa "/" quando callbackUrl não for fornecido', async () => {
      login.mockResolvedValueOnce({ id: "u1" } as any);

      const fd = new FormData();
      fd.set("email", "user@example.com");
      fd.set("password", "pw");

      await signInAction({}, fd);

      expect(r).toHaveBeenCalledWith("/");
    });
  });

  describe("signOutAction", () => {
    it('chama logout e redireciona para "/"', async () => {
      lgout.mockResolvedValueOnce();

      await signOutAction();

      expect(lgout).toHaveBeenCalledTimes(1);
      expect(r).toHaveBeenCalledWith("/");
    });
  });
});
