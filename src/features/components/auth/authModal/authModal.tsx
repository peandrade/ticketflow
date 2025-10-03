'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Input } from '@/features/components/ui/input';
import { Button } from '@/features/components/ui/button';
import { Label } from '@/features/components/ui/label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogHeader,
} from '@/features/components/ui/dialog';
import { useAuth } from '@/stores/auth';
import { usePathname, useSearchParams } from 'next/navigation';
import { AuthState, signInAction, signUpAction } from '@/app/(auth)';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

type Props = { children: React.ReactNode };
const initialState: AuthState = {};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="min-w-24" disabled={pending}>
      {pending ? 'Enviando...' : children}
    </Button>
  );
}

export function AuthModal({ children }: Props) {
  const open = useAuth((s) => s.open);
  const setOpen = useAuth((s) => s.setOpen);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const [loginState, loginAction] = useFormState(signInAction, {});
  const [signupState, signupAction] = useFormState(signUpAction, {});

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    const qs = searchParams?.toString();
    return `${pathname}${qs ? `?${qs}` : ''}`;
  }, [pathname, searchParams]);

  useEffect(() => { if (loginState?.error) setActiveTab('login'); }, [loginState?.error]);
  useEffect(() => { if (signupState?.error) setActiveTab('signup'); }, [signupState?.error]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:max-w-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>Acesse a sua conta</DialogTitle>
          <DialogDescription>Entre ou crie sua conta para continuar.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form action={loginAction} className="space-y-3 sm:space-y-4">
              {loginState?.error && <p className="text-sm text-red-600">{loginState.error}</p>}
              <input type="hidden" name="callbackUrl" value={callbackUrl} />

              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={loginState?.fields?.email ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" name="password" type="password" required />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="secondary" type="button">
                    Cancelar
                  </Button>
                </DialogClose>
                <SubmitButton>Entrar</SubmitButton>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form action={signupAction} className="space-y-4">
              {signupState?.error && <p className="text-sm text-red-600">{signupState.error}</p>}
              <input type="hidden" name="callbackUrl" value={callbackUrl} />

              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome</Label>
                <Input
                  id="signup-name"
                  name="name"
                  required
                  defaultValue={signupState?.fields?.name ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={signupState?.fields?.email ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="secondary" type="button">
                    Cancelar
                  </Button>
                </DialogClose>
                <SubmitButton>Cadastrar</SubmitButton>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
