import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname ?? '#'} {...rest}>
      {children}
    </a>
  ),
}));

import { BackLink } from './backLink';

describe('BackLink', () => {
  it('renderiza defaults acessíveis', () => {
    render(<BackLink />);
    const link = screen.getByRole('link', { name: /voltar para meus pedidos/i });
    expect(link).toHaveAttribute('href', '/orders');
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });

  it('aceita rótulos e destino customizados', () => {
    render(<BackLink href="/foo" label="Retornar" ariaLabel="Voltar à lista" />);
    const link = screen.getByRole('link', { name: /voltar à lista/i });
    expect(link).toHaveAttribute('href', '/foo');
    expect(screen.getByText('Retornar')).toBeInTheDocument();
  });
});
