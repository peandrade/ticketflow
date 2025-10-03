import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeroCarousel } from './heroCarousel';

const H = vi.hoisted(() => ({
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  scrollTo: vi.fn(),
  on: vi.fn(),
  selectedScrollSnap: vi.fn(() => 0),
  returnUndefinedApi: false,
  makeHook: () =>
    [vi.fn(), {
      scrollPrev: H.scrollPrev,
      scrollNext: H.scrollNext,
      scrollTo: H.scrollTo,
      on: H.on,
      selectedScrollSnap: H.selectedScrollSnap,
    }] as const,
}));

vi.mock('embla-carousel-react', () => {
  const hook = () =>
    H.returnUndefinedApi ? ([vi.fn(), undefined] as const) : H.makeHook();
  return { __esModule: true, default: hook, useEmblaCarousel: hook };
});
vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: () => ({ stop: vi.fn(), play: vi.fn() }),
}));

const events = [
  { id: 'e1', slug: 'show-1', title: 'Show 1', shortDescription: 'Desc 1', heroPublicId: 'img1' },
  { id: 'e2', slug: 'show-2', title: 'Show 2', shortDescription: 'Desc 2', heroPublicId: 'img2' },
];

beforeEach(() => {
  vi.clearAllMocks();
  H.selectedScrollSnap.mockReturnValue(0);
  H.returnUndefinedApi = false;
});
afterEach(() => {
  H.returnUndefinedApi = false;
});

describe('HeroCarousel', () => {
  it('renderiza slides e navega (próximo/anterior/dot)', async () => {
    render(<HeroCarousel event={events as any} />);

    const links = await screen.findAllByRole('link', { name: /comprar/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/event/show-1');

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /próximo/i }));
    expect(H.scrollNext).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(H.scrollPrev).toHaveBeenCalled();

    const dot2 = screen.getByRole('button', { name: /ir para slide 2/i });
    await user.click(dot2);
    expect(H.scrollTo).toHaveBeenCalledWith(1);
  });

  it('com emblaApi: registra handler e usa selectedScrollSnap para dot ativo', () => {
    H.selectedScrollSnap.mockReturnValueOnce(1);
    render(<HeroCarousel event={events as any} />);

    expect(H.on).toHaveBeenCalledWith('select', expect.any(Function));
    const dot2 = screen.getByRole('button', { name: /ir para slide 2/i });
    expect(dot2.className).toMatch(/\bbg-white\b/);
  });

  it('quando emblaApi é indefinido: early-return (não chama APIs)', async () => {
    // Reinicia o registry e redefine o mock antes de reimportar o componente
    vi.resetModules();
    vi.doMock('embla-carousel-react', () => ({
      __esModule: true,
      default: () => [vi.fn(), undefined] as const,
      useEmblaCarousel: () => [vi.fn(), undefined] as const,
    }));

    const { HeroCarousel: FreshHeroCarousel } = await import('./heroCarousel');

    render(<FreshHeroCarousel event={events as any} />);

    expect(H.on).not.toHaveBeenCalled();
    expect(H.selectedScrollSnap).not.toHaveBeenCalled();

    const dot2 = screen.getByRole('button', { name: /ir para slide 2/i });
    const user = userEvent.setup();
    await user.click(dot2);
    expect(H.scrollTo).not.toHaveBeenCalled();
  });

  it('onSelect early-return quando emblaApi é undefined (não chama APIs nem muda dot)', async () => {
    H.returnUndefinedApi = true;

    render(<HeroCarousel event={events as any} />);

    expect(H.on).not.toHaveBeenCalled();
    expect(H.selectedScrollSnap).not.toHaveBeenCalled();

    const dot2 = screen.getByRole('button', { name: /ir para slide 2/i });
    expect(dot2.className).toMatch(/bg-white\/50/);

    const user = userEvent.setup();
    await user.click(dot2);
    expect(H.scrollTo).not.toHaveBeenCalled();
  });
});
