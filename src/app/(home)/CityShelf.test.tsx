import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: any) => (
    <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} {...rest} />
  ),
}));
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : (href?.pathname ?? '#')} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/core/cdn', () => ({
  urlCdn: (id: string, opts: any) => `https://res.cloudinary.com/${id}?w=${opts?.w ?? ''}`,
}));

import CityShelf from './CityShelf';

describe('CityShelf (Home)', () => {
  const makeItem = (id: string) => ({
    id,
    slug: `ev-${id}`,
    title: `Evento ${id}`,
    shortDescription: 'desc',
    heroPublicId: 'folder/pic',
    next: {
      id: `p-${id}`,
      startsAt: new Date().toISOString() as any,
      venueName: 'Arena',
      venueCity: 'SP',
      venueState: 'SP',
      minPriceCents: 10000,
      maxPriceCents: 15000,
    },
  });

  it('renderiza cards e links desejados', () => {
    const items = [makeItem('1'), makeItem('2')];
    const { container } = render(<CityShelf city="São Paulo" state="SP" items={items as any} />);

    const cityHref = '/cidades/sao-paulo-sp';
    const hasCityLink = Array.from(container.querySelectorAll('a')).some(
      (a) => a.getAttribute('href') === cityHref,
    );
    expect(hasCityLink).toBe(true);

    items.forEach((it) => {
      const link = screen.getByRole('link', { name: new RegExp(it.title, 'i') });
      expect(link).toHaveAttribute('href', `/event/${it.slug}`);
      const img = screen.getByAltText(it.title) as HTMLImageElement;
      expect(img.src).toBe(`https://res.cloudinary.com/undefined/image/upload/ar_3:1,c_fill,g_auto,f_auto,q_auto,w_800/folder/pic`);
    });
  });

  it('usa placeholder quando heroPublicId está ausente', () => {
    const items = [{ ...makeItem('1'), heroPublicId: null }];
    render(<CityShelf city="Campinas" state="SP" items={items as any} />);

    const img = screen.getByAltText(items[0].title) as HTMLImageElement;
    expect(img.src).toBe('https://res.cloudinary.com/undefined/image/upload/ar_3:1,c_fill,g_auto,f_auto,q_auto,w_800/placeholder');
  });
});
