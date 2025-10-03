'use server';

import { loginWithPassword, logout, registerUser } from '@/core/auth';
import { redirect } from 'next/navigation';

export type AuthState = {
  error?: string;
  message?: string;
  fields?: Partial<{ name: string; email: string }>;
};

export async function signUpAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const cb = String(formData.get('callbackUrl') ?? '') || '/';

  if (!name || !email || !password) return { error: 'Preencha todos os campos.', fields: { name, email } };

  const user = await registerUser(name, email, password);
  if (!user) return { error: 'Não foi possível criar sua conta.', fields: { name, email } };

  redirect(cb);
}

export async function signInAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const cb = String(formData.get('callbackUrl') ?? '') || '/';

  if (!email || !password) return { error: 'Preencha e-mail e senha.', fields: { email } };

  const user = await loginWithPassword(email, password);
  if (!user) return { error: 'E-mail ou senha inválidos.', fields: { email } };

  redirect(cb);
}


export async function signOutAction() {
  await logout();
  redirect('/');
}
