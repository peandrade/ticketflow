import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname ?? '#'} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/cdn', () => ({ urlCdn: (id: string) => `https://cdn.test/${id}` }));

vi.mock('../ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

import { EventCard } from './eventCard';

describe('EventCard', () => {
  const event = {
    id: 'e1',
    title: 'Show X',
    slug: 'show-x',
    heroPublicId: 'img1',
    shortDescription: 'Desc',
    performances: [
      { startsAt: new Date('2025-01-02T10:00:00Z'), venue: { city: 'São Paulo', state: 'SP' } },
    ],
  };

  it('renderiza link, título e botão de ação', () => {
    render(<EventCard event={event as any} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/event/show-x');
    expect(screen.getByText('Show X')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confira/i })).toBeInTheDocument();
  });
});
