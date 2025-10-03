import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getFamilyExperiences: vi.fn(),
}));

// O componente importa de "@/features/data"
vi.mock('@/features/data', () => ({
  getFamilyExperiences: h.getFamilyExperiences,
}));

// O componente importa EventCard de "../event"
vi.mock('../event', () => ({
  __esModule: true,
  EventCard: ({ event }: any) => <div data-testid="event-card">{event.title}</div>,
}));

import { FamilyHomeSection } from './familyHomeSection';

describe('FamilyHomeSection (RSC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna null quando não há itens', async () => {
    h.getFamilyExperiences.mockResolvedValueOnce([]);
    const Comp = await FamilyHomeSection();
    expect(Comp).toBeNull();
  });

  it('renderiza seção e cards quando há itens', async () => {
    h.getFamilyExperiences.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Passeio no Zoo',
        slug: 'zoo',
        heroPublicId: null,
        shortDescription: '',
        performances: [],
      },
      {
        id: '2',
        title: 'Roda-Gigante',
        slug: 'roda',
        heroPublicId: null,
        shortDescription: '',
        performances: [],
      },
    ]);

    const Comp = await FamilyHomeSection();
    render(Comp as any);

    expect(
      screen.getByRole('heading', { name: /para toda a família/i }),
    ).toBeInTheDocument();
    const cards = screen.getAllByTestId('event-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Passeio no Zoo');
    expect(cards[1]).toHaveTextContent('Roda-Gigante');
  });
});
