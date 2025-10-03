import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
const h = vi.hoisted(() => ({
  getEventsForHome: vi.fn(),
}));

vi.mock('@/features/data', () => ({ getEventsForHome: h.getEventsForHome }));
vi.mock('@/data/event', () => ({ getEventsForHome: h.getEventsForHome }));

vi.mock('@/features/components', () => ({
  __esModule: true,
  EventCard: ({ event }: any) => <article data-testid="event-card">{event.title}</article>,
}));

vi.mock('../eventCard', () => ({
  __esModule: true,
  EventCard: ({ event }: any) => <article data-testid="event-card">{event.title}</article>,
}));

import { EventList } from './eventList';

describe('EventList (RSC)', () => {
  it('renderiza heading e lista de eventos', async () => {
    h.getEventsForHome.mockResolvedValueOnce([
      { id: '1', title: 'A', slug: 'a', heroPublicId: null, shortDescription: '', performances: [] },
      { id: '2', title: 'B', slug: 'b', heroPublicId: null, shortDescription: '', performances: [] },
    ]);

    const Comp = await EventList();
    render(Comp as any);

    expect(
      screen.getByRole('heading', { name: /conheça outros shows/i })
    ).toBeInTheDocument();

    const cards = screen.getAllByTestId('event-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('A');
    expect(cards[1]).toHaveTextContent('B');
  });
});
