// src/app/casas/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const data = vi.hoisted(() => ({ getAllVenues: vi.fn() }));

// A página pode importar de qualquer um desses caminhos.
// Apontamos todos para o mesmo mock hoisted.
vi.mock('@/features/data', () => ({
  getAllVenues: data.getAllVenues,
}));
vi.mock('@/features/data/venues', () => ({
  getAllVenues: data.getAllVenues,
}));

// Mock do agregador de componentes — agora com VenueCard e VenuesGrid.
vi.mock('@/features/components', () => {
  const VenueCard = ({ v }: any) => (
    <article>
      <h3>{v?.name}</h3>
    </article>
  );
  const VenuesGrid = (props: any) => {
    const list: Array<any> = props.items ?? props.venues ?? props.list ?? [];
    return (
      <section aria-label="grid">
        {list.map((v) => (
          <article key={v.id}>
            <h3>{v.name}</h3>
          </article>
        ))}
      </section>
    );
  };
  return {
    VenueCard,
    VenuesGrid,
    // fallback caso algo importe default do agregador
    default: { VenueCard, VenuesGrid },
  };
});

// Mock também dos caminhos diretos, se a página optar por importar assim.
vi.mock('@/features/components/venueCard', () => ({
  __esModule: true,
  default: ({ v }: any) => (
    <article>
      <h3>{v?.name}</h3>
    </article>
  ),
}));
vi.mock('@/features/components/venuesGrid', () => ({
  __esModule: true,
  default: (props: any) => {
    const list: Array<any> = props.items ?? props.venues ?? props.list ?? [];
    return (
      <section aria-label="grid">
        {list.map((v) => (
          <article key={v.id}>
            <h3>{v.name}</h3>
          </article>
        ))}
      </section>
    );
  },
}));

// Infra de Next usada no layout da página
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt ?? ''} />,
}));

describe('app/venues/page (RSC) – VenuesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza heading e um card por casa', async () => {
    data.getAllVenues.mockResolvedValueOnce([
      {
        id: 'v1',
        name: 'Casa A',
        city: 'X',
        state: 'SP',
        slug: 'casa-a',
        coverPublicId: null,
        upcomingCount: 1,
      },
      {
        id: 'v2',
        name: 'Casa B',
        city: 'Y',
        state: 'RJ',
        slug: 'casa-b',
        coverPublicId: null,
        upcomingCount: 0,
      },
    ]);

    const { default: Page } = await import('./page');
    const ui = await Page();
    render(ui as any);

    expect(
      screen.getByRole('heading', { level: 1, name: /todas as casas/i }),
    ).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Casa A' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Casa B' }),
    ).toBeInTheDocument();
  });

  it('lista vazia: mostra heading e nenhum card', async () => {
    data.getAllVenues.mockResolvedValueOnce([]);

    const { default: Page } = await import('./page');
    const ui = await Page();
    render(ui as any);

    expect(
      screen.getByRole('heading', { level: 1, name: /todas as casas/i }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
});
