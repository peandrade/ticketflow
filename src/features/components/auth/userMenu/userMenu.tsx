'use client';

import React from 'react';
import { signOutAction } from '@/app/(auth)';
import { Button } from '@/features/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/features/components/ui/dropdown-menu';
import Link from 'next/link';

type User = { id: string; name?: string | null; email: string };

export function UserMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Olá {user.name ?? user.email}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{user.name ?? 'Sua conta'}</span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/orders">Meus pedidos</Link>
        </DropdownMenuItem>
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-left">Sair</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
