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

  try {
    const user = await registerUser(name, email, password);
    if (!user) {
      return { error: 'Não foi possível criar sua conta.', fields: { name, email } };
    }
  } catch (err: unknown) {
    const e = err as { code?: string; meta?: any; message?: string };

    const isUniqueViolation = e?.code === 'P2002';
    const target = (e as any)?.meta?.target;
    const targetHasEmail =
      (Array.isArray(target) && target.includes('email')) ||
      (typeof target === 'string' && target.toLowerCase().includes('email'));

    if (isUniqueViolation && targetHasEmail) {
      return { error: 'E-mail já cadastrado.', fields: { name, email } };
    }
    
    console.error('[signUpAction] erro ao registrar usuário', e?.code ?? e?.message ?? e);
    return { error: 'Não foi possível criar sua conta.', fields: { name, email } };
  }

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
