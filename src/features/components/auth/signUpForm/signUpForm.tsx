'use client';

import React from 'react';
import { useState } from 'react';

export default function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? 'Falha no cadastro');
      return;
    }
    window.location.href = '/';
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="name" placeholder="Seu nome" className="w-full rounded border p-2" />
      <input
        name="email"
        type="email"
        placeholder="email@exemplo.com"
        className="w-full rounded border p-2"
      />
      <input
        name="password"
        type="password"
        placeholder="Senha"
        className="w-full rounded border p-2"
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </button>
    </form>
  );
}
