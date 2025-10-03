import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// notFound do App Router
const nav = vi.hoisted(() => ({ notFound: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: nav.notFound }));

// parseCitySlug precisa ser mockado, mas PRESERVANDO urlCdn e demais utils
const slug = vi.hoisted(() => ({ parseCitySlug: vi.fn() }));
vi.mock('@/core/utils', async () => {
  const actual = await vi.importActual<any>('@/core/utils');
  return { ...actual, parseCitySlug: slug.parseCitySlug };
});

// data layer: os dois usados pela página
const data = vi.hoisted(() => ({
  resolveCityBySlug: vi.fn(),
  getCityEvents: vi.fn(),
}));
vi.mock('@/features/data', () => ({
  resolveCityBySlug: data.resolveCityBySlug,
  getCityEvents: data.getCityEvents,
}));

// Next Image simplificada p/ DOM estável
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img data-testid="img" {...props} />,
}));

describe('app/cidades/[slug]/page (RSC) – CityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mostra heading da cidade e links de eventos', async () => {
    slug.parseCitySlug.mockReturnValue({ citySlug: 'campinas', state: 'SP' });
    data.resolveCityBySlug.mockResolvedValueOnce('Campinas');
    data.getCityEvents.mockResolvedValueOnce([
      { id: 'e1', slug: 'show-a', title: 'Show A', heroPublicId: 'h1' },
      { id: 'e2', slug: 'show-b', title: 'Show B', heroPublicId: null },
    ]);

    const { default: Page } = await import('./page');
    const ui = await Page({ params: Promise.resolve({ slug: 'campinas-sp' }) } as any);
    render(ui as any);

    expect(screen.getByRole('heading', { level: 1, name: /Eventos em Campinas \(SP\)/i })).toBeInTheDocument();
    // Links para os eventos
    const links = screen.getAllByRole('link', { name: /ver mais/i });
    // Botão "Ver mais" está dentro do Link no markup → procurar pelo href:
    const eventLinks = screen.getAllByRole('link');
    expect(eventLinks.some(a => (a as HTMLAnchorElement).getAttribute('href') === '/event/show-a')).toBe(true);
    expect(eventLinks.some(a => (a as HTMLAnchorElement).getAttribute('href') === '/event/show-b')).toBe(true);

    // Chamadas corretas
    expect(data.resolveCityBySlug).toHaveBeenCalledWith('campinas', 'SP');
    expect(data.getCityEvents).toHaveBeenCalledWith({ city: 'Campinas', state: 'SP', take: 200 });
  });

  it('retorna notFound quando slug é inválido (parseCitySlug=null)', async () => {
    slug.parseCitySlug.mockReturnValue(null);

    const { default: Page } = await import('./page');
    await Page({ params: Promise.resolve({ slug: 'qualquer-coisa' }) } as any);

    expect(nav.notFound).toHaveBeenCalledTimes(1);
    expect(data.resolveCityBySlug).not.toHaveBeenCalled();
    expect(data.getCityEvents).not.toHaveBeenCalled();
  });

  it('retorna notFound quando cidade não encontrada', async () => {
    slug.parseCitySlug.mockReturnValue({ citySlug: 'cidade-x', state: 'SP' });
    data.resolveCityBySlug.mockResolvedValueOnce(null);

    const { default: Page } = await import('./page');
    await Page({ params: Promise.resolve({ slug: 'cidade-x-sp' }) } as any);

    expect(nav.notFound).toHaveBeenCalledTimes(1);
    expect(data.getCityEvents).not.toHaveBeenCalled();
  });

  it('mostra mensagem "Nenhum evento futuro encontrado." quando items === 0', async () => {
    slug.parseCitySlug.mockReturnValue({ citySlug: 'campinas', state: 'SP' });
    data.resolveCityBySlug.mockResolvedValueOnce('Campinas');
    data.getCityEvents.mockResolvedValueOnce([]);

    const { default: Page } = await import('./page');
    const ui = await Page({ params: Promise.resolve({ slug: 'campinas-sp' }) } as any);
    render(ui as any);

    expect(screen.getByText(/Nenhum evento futuro encontrado\./i)).toBeInTheDocument();
  });

  it('mostra contagem "N evento(s) encontrados" quando há resultados', async () => {
    slug.parseCitySlug.mockReturnValue({ citySlug: 'campinas', state: 'SP' });
    data.resolveCityBySlug.mockResolvedValueOnce('Campinas');
    data.getCityEvents.mockResolvedValueOnce([
      { id: 'e1', slug: 'show-a', title: 'Show A', heroPublicId: 'h1' },
      { id: 'e2', slug: 'show-b', title: 'Show B', heroPublicId: 'h2' },
      { id: 'e3', slug: 'show-c', title: 'Show C', heroPublicId: null },
    ]);

    const { default: Page } = await import('./page');
    const ui = await Page({ params: Promise.resolve({ slug: 'campinas-sp' }) } as any);
    render(ui as any);

    // A página monta "N evento(s) encontrados" com pluralização simples
    expect(screen.getByText(/3 eventos encontrados/i)).toBeInTheDocument();
  });
});
