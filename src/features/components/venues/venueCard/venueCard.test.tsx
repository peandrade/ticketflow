import React from 'react';
import { VenueCard } from './venueCard';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => <a href={href as any} {...rest}>{children}</a>,
}));

vi.mock('@/lib/cdn', () => ({ urlCdn: (id: string) => `https://cdn.test/${id}` }));

describe('VenueCard', () => {
  const v = {
    id: 'v1',
    name: 'Allianz Parque',
    city: 'São Paulo',
    state: 'SP',
    coverPublicId: null,
    slug: 'allianz-parque--sao-paulo-sp',
    upcomingCount: 3,
  };

  it('renderiza título, link e contador', () => {
    render(<VenueCard v={v as any} />);
    expect(screen.getByRole('heading', { name: /Allianz Parque/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver detalhes/i }))
      .toHaveAttribute('href', `/casas/${v.slug}`);
    expect(screen.getByText(/3 próximo\(s\)/i)).toBeInTheDocument();
  });
});
