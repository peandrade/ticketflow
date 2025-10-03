import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VenuesHomeSection } from './venuesHomeSection';

const h = vi.hoisted(() => ({
  getFeaturedVenues: vi.fn(),
}));

vi.mock('@/features/data', () => ({ getFeaturedVenues: h.getFeaturedVenues }));

vi.mock('../venueCard', () => ({
  __esModule: true,
  VenueCard: ({ v }: any) => <div data-testid="venue-card">{v.name}</div>,
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname ?? '#'} {...rest}>
      {children}
    </a>
  ),
}));

describe('VenuesHomeSection (RSC)', () => {
  it('renderiza heading, link e cards', async () => {
    h.getFeaturedVenues.mockResolvedValueOnce([
      { id: '1', name: 'Casa 1' },
      { id: '2', name: 'Casa 2' },
    ]);

    const Comp = await VenuesHomeSection();
    render(Comp as any);

    expect(screen.getByRole('heading', { name: /Casas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver mais/i })).toHaveAttribute('href', '/casas');
    expect(screen.getAllByTestId('venue-card')).toHaveLength(2);
  });
});
