import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const nav = vi.hoisted(() => ({ notFound: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: nav.notFound }));

const data = vi.hoisted(() => ({ getVenueBySlug: vi.fn() }));
vi.mock('@/features/data', () => ({ getVenueBySlug: data.getVenueBySlug }));

const cdn = vi.hoisted(() => ({ urlCdn: vi.fn(() => 'https://cdn.test/img.jpg') }));
vi.mock('@/core/utils', () => ({ urlCdn: cdn.urlCdn }));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img data-testid="img" {...props} />,
}));

import Page from './page';

function makeVenue(over: Partial<any> = {}) {
  return {
    name: 'Casa Rock',
    city: 'Campinas',
    state: 'SP',
    address: 'Av. das Bandas, 123',
    capacity: 12000,
    coverPublicId: 'venue/hero_1',
    upcoming: [] as any[],
    ...over,
  };
}

describe('app/venues/[slug]/page (RSC) – VenueDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notFound quando venue não existe', async () => {
    data.getVenueBySlug.mockResolvedValueOnce(null);

    await Page({ params: Promise.resolve({ slug: 'casa-rock' }) } as any);

    expect(nav.notFound).toHaveBeenCalled();
    expect(cdn.urlCdn).not.toHaveBeenCalled();
  });

  it('renderiza banner, header e mensagem de vazio quando não há próximos eventos', async () => {
    const venue = makeVenue({ upcoming: [] });
    data.getVenueBySlug.mockResolvedValueOnce(venue);

    const ui = await Page({ params: Promise.resolve({ slug: 'casa-rock' }) } as any);
    render(ui as any);

    expect(cdn.urlCdn).toHaveBeenCalledWith('venue/hero_1', { w: 1600 });
    const hero = screen.getAllByTestId('img')[0];
    expect(hero).toHaveAttribute('src', 'https://cdn.test/img.jpg');
    expect(hero).toHaveAttribute('alt', 'Casa Rock');

    expect(screen.getByRole('heading', { level: 1, name: 'Casa Rock' })).toBeInTheDocument();
    expect(screen.getByText(/Campinas .* SP/)).toBeInTheDocument();
    expect(screen.getByText('Av. das Bandas, 123')).toBeInTheDocument();
    expect(screen.getByText(/Capacidade:/)).toBeInTheDocument();

    expect(
      screen.getByText('Nenhum evento futuro nesta casa.'),
    ).toBeInTheDocument();
  });

  it('lista próximos eventos com link e imagem por card (usa placeholder quando hero ausente)', async () => {
    const venue = makeVenue({
      upcoming: [
        {
          perfId: 'p1',
          startsAt: '2099-01-01T20:00:00Z',
          event: { slug: 'rock-night', title: 'Rock Night', heroPublicId: 'event/h1' },
        },
        {
          perfId: 'p2',
          startsAt: '2099-02-01T20:00:00Z',
          event: { slug: 'jazz-day', title: 'Jazz Day', heroPublicId: null },
        },
      ],
    });
    data.getVenueBySlug.mockResolvedValueOnce(venue);

    const ui = await Page({ params: Promise.resolve({ slug: 'casa-rock' }) } as any);
    render(ui as any);

    expect(screen.getByRole('heading', { level: 2, name: /Próximos eventos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Rock Night' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Jazz Day' })).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: 'Ver ingressos' });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/event/rock-night');
    expect(links[1]).toHaveAttribute('href', '/event/jazz-day');

    expect(cdn.urlCdn).toHaveBeenCalledWith('event/h1', { w: 800 });
    expect(cdn.urlCdn).toHaveBeenCalledWith('event/placeholder', { w: 800 });
  });

  it('usa placeholder no banner quando coverPublicId ausente', async () => {
    const venue = makeVenue({ coverPublicId: null, upcoming: [] });
    data.getVenueBySlug.mockResolvedValueOnce(venue);
  
    const ui = await Page({ params: Promise.resolve({ slug: 'casa-rock' }) } as any);
    render(ui as any);
  
    expect(cdn.urlCdn).toHaveBeenCalledTimes(1);
    expect(cdn.urlCdn).toHaveBeenCalledWith('venue/placeholder', { w: 1600 });
  
    const hero = screen.getByTestId('img');
    expect(hero).toHaveAttribute('alt', 'Casa Rock');
    expect(hero).toHaveAttribute('src', 'https://cdn.test/img.jpg');
  });
});
