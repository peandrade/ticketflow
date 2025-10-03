"use client"

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signInAction, signUpAction } from '../actions';

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
      disabled={pending}
    >
      {pending ? 'Enviando…' : children}
    </button>
  );
}

export default function AccountPage() {
  const [signupState, signupAction] = useFormState(signUpAction, {});
  const [signinState, signinAction] = useFormState(signInAction, {});

  return (
    <main className="mx-auto grid max-w-4xl grid-cols-1 gap-12 px-4 py-10 md:grid-cols-2">
      <section>
        <h2 className="mb-4 text-xl font-semibold">Criar conta</h2>
        <form action={signupAction} className="space-y-3">
          <input name="name" placeholder="Seu nome" className="w-full rounded border px-3 py-2" />
          <input name="email" placeholder="email@exemplo.com" className="w-full rounded border px-3 py-2" />
          <input name="password" type="password" placeholder="Senha" className="w-full rounded border px-3 py-2" />
          {signupState?.error && <p className="text-sm text-red-600">{signupState.error}</p>}
          <Submit>Cadastrar</Submit>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Entrar</h2>
        <form action={signinAction} className="space-y-3">
          <input name="email" placeholder="email@exemplo.com" className="w-full rounded border px-3 py-2" />
          <input name="password" type="password" placeholder="Senha" className="w-full rounded border px-3 py-2" />
          {signinState?.error && <p className="text-sm text-red-600">{signinState.error}</p>}
          <Submit>Entrar</Submit>
        </form>
      </section>
    </main>
  );
}
