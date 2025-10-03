'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type Props = {
  href?: string;         
  label?: string;           
  ariaLabel?: string;       
  className?: string;
};

export function BackLink({
  href = '/orders',
  label = 'Voltar',
  ariaLabel = 'Voltar para Meus pedidos',
  className = '',
}: Props) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
