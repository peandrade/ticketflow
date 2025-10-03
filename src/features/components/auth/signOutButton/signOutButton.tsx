'use client';

import React from 'react';
import { Button } from '../../ui/button';
import { useFormStatus } from 'react-dom';
import { signOutAction } from '@/app/(auth)';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Saindo...' : 'Sair'}
    </Button>
  );
}

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Submit />
    </form>
  );
}
