import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const nav = vi.hoisted(() => ({ notFound: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: nav.notFound }));

const data = vi.hoisted(() => ({ getEventBySlug: vi.fn() }));
vi.mock('@/features/data', () => ({
  getEventBySlug: data.getEventBySlug,
}));

const cdn = vi.hoisted(() => ({ urlCdn: vi.fn(() => 'https://cdn.test/hero.jpg') }));
vi.mock('@/core/utils', async () => {
  const actual = await vi.importActual<any>('@/core/utils');
  return { ...actual, urlCdn: cdn.urlCdn };
});

const ec = vi.hoisted(() => ({ lastProps: null as any }));
vi.mock('./eventClient/eventClient', () => ({
  __esModule: true,
  default: (props: any) => {
    ec.lastProps = props;
    return <div data-testid="event-client" />;
  },
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img data-testid="hero" {...props} />,
}));

describe('app/event/[slug]/page (RSC) – EventPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ec.lastProps = null;
  });

  it('retorna notFound quando evento não existe', async () => {
    data.getEventBySlug.mockResolvedValueOnce(null);

    const { default: Page } = await import('./page');
    await Page({ params: Promise.resolve({ slug: 'show-x' }) } as any);

    expect(data.getEventBySlug).toHaveBeenCalledWith('show-x');
    expect(nav.notFound).toHaveBeenCalled();
    expect(ec.lastProps).toBeNull();
  });

  it('renderiza banner e passa props corretas ao EventClient (mapping de options)', async () => {
    data.getEventBySlug.mockResolvedValueOnce({
      title: 'Rock Night',
      heroPublicId: 'hero_123',
      performances: [
        {
          id: 'p1',
          startsAt: '2025-05-10T20:00:00-03:00',
          venue: { id: 'v1', name: 'Arena' },
          ticketTypes: [
            { priceCents: 5000, inventory: { available: 10 } },
            { priceCents: 9000, inventory: { available: 0 } },
          ],
        },
      ],
    });

    const { default: Page } = await import('./page');
    const ui = await Page({ params: Promise.resolve({ slug: 'rock-night' }) } as any);
    render(ui as any);

    expect(cdn.urlCdn).toHaveBeenCalledWith('hero_123', { w: 1920 });
    expect(screen.getByTestId('hero')).toHaveAttribute('src', 'https://cdn.test/hero.jpg');
    expect(screen.getByTestId('hero')).toHaveAttribute('alt', 'Rock Night');

    expect(ec.lastProps).toBeTruthy();
    expect(ec.lastProps.eventSlug).toBe('rock-night');
    expect(ec.lastProps.title).toBe('Rock Night');
    expect(ec.lastProps.options).toEqual([
      {
        id: 'p1',
        startsAt: '2025-05-10T20:00:00-03:00',
        venue: { id: 'v1', name: 'Arena' },
        minPriceCents: 5000,
        maxPriceCents: 9000,
        availableTotal: 10,
      },
    ]);
  });

  it('calcula availableTotal somando 0 quando inventory/available está ausente', async () => {
    data.getEventBySlug.mockResolvedValueOnce({
      title: 'Teste',
      heroPublicId: 'hero_x',
      performances: [
        {
          id: 'p1',
          startsAt: '2025-01-01T20:00:00-03:00',
          venue: { id: 'v1', name: 'Arena' },
          ticketTypes: [
            { priceCents: 5000 },                              
            { priceCents: 8000, inventory: {} },                 
            { priceCents: 12000, inventory: { available: 0 } },
          ],
        },
      ],
    });

    const { default: Page } = await import('./page');
    const ui = await Page({ params: Promise.resolve({ slug: 't' }) } as any);
    render(ui as any);

    expect(ec.lastProps).toBeTruthy();
    expect(ec.lastProps.options[0]).toMatchObject({
      id: 'p1',
      minPriceCents: 5000,
      maxPriceCents: 12000,
      availableTotal: 0,
    });
  });
});
