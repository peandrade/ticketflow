import React from 'react';
import { OrdersGrid } from './ordersGrid';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : (href?.pathname ?? '#')} {...rest}>
      {children}
    </a>
  ),
}));

// Descarta props booleanas específicas do Next <Image /> para evitar warnings
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

// ✅ Mocka o path correto que o componente usa
const CDN_H = vi.hoisted(() => ({
  urlCdn: vi.fn((id: string, opts: any) => `/cdn/${id}?w=${opts?.w}&ar=${opts?.ar}&c=${opts?.c}`),
}));
vi.mock('@/core/utils', () => ({ urlCdn: CDN_H.urlCdn }));

describe('OrdersGrid', () => {
  it('renderiza itens e links de detalhes com aria-label', () => {
    const items = [
      { id: 'o1', eventTitle: 'Show X', createdAt: '2030-01-01T00:00:00Z', status: 'PAID', totalCents: 0 },
      { id: 'o2', eventTitle: 'Show Y', createdAt: '2030-01-01T00:00:00Z', status: 'PAID', totalCents: 0 },
      { id: 'o3', eventTitle: 'Show Z', createdAt: '2030-01-01T00:00:00Z', status: 'PAID', totalCents: 0 },
    ] as any;

    render(<OrdersGrid items={items} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/orders/o1');
    expect(links[1]).toHaveAttribute('href', '/orders/o2');
    expect(links[2]).toHaveAttribute('href', '/orders/o3');

    expect(links[0]).toHaveAccessibleName('Abrir pedido o1');
  });

  it('quando há coverPublicId renderiza <img> com src gerado por urlCdn e alt=eventTitle', () => {
    const item = {
      id: 'abcdefgh1234',
      eventTitle: 'Festival XPTO',
      venueName: 'Arena Alfa',
      coverPublicId: 'cover-x',
      createdAt: '2030-01-01T00:00:00Z',
      status: 'PAID',
      totalCents: 0,
    };

    render(<OrdersGrid items={[item] as any} />);

    // ✅ O componente usa w: 600 (não 800)
    expect(CDN_H.urlCdn).toHaveBeenCalledWith(
      'cover-x',
      expect.objectContaining({ w: 600, ar: '1:1', c: 'fill' }),
    );

    const img = screen.getByRole('img', { name: /festival xpto/i }) as HTMLImageElement;
    expect(img.src).toMatch(/\/cdn\/cover-x\?w=600&ar=1:1&c=fill/);

    expect(screen.queryByText(/sem imagem/i)).toBeNull();
  });

  it('quando NÃO há coverPublicId mostra fallback "Sem imagem"', () => {
    render(
      <OrdersGrid
        items={[
          {
            id: 'o1',
            eventTitle: 'Sem capa',
            createdAt: '2030-01-01T00:00:00Z',
            status: 'PAID',
            totalCents: 0,
          },
        ] as any}
      />,
    );

    expect(screen.getByText(/sem imagem/i)).toBeInTheDocument();
  });

  it('exibe venueName quando definido e omite quando ausente', () => {
    const items = [
      {
        id: 'o1',
        eventTitle: 'Show A',
        venueName: 'Estádio 1',
        coverPublicId: 'c1',
        createdAt: '2030-01-01T00:00:00Z',
        status: 'PAID',
        totalCents: 0,
      },
      {
        id: 'o2',
        eventTitle: 'Show B',
        createdAt: '2030-01-01T00:00:00Z',
        status: 'PAID',
        totalCents: 0,
      },
    ] as any;

    render(<OrdersGrid items={items} />);

    const cards = screen.getAllByRole('link');
    expect(within(cards[0]).getByText('Estádio 1')).toBeInTheDocument();
    expect(within(cards[1]).queryByText(/Estádio 1/)).toBeNull();
  });

  it('mostra prefixo do id (#slice 0..8) e a data formatada (contendo o ano local)', () => {
    const createdAt = '2030-01-01T00:00:00Z';

    render(
      <OrdersGrid
        items={[
          {
            id: 'abcdefghi-xyz',
            eventTitle: 'Show Data',
            createdAt,
            status: 'PAID',
            totalCents: 0,
          } as any,
        ]}
      />,
    );

    const card = screen.getByRole('link');

    expect(within(card).getByText('#abcdefgh')).toBeInTheDocument();

    const year = new Date(createdAt).getFullYear();
    expect(within(card).getByText(new RegExp(String(year)))).toBeInTheDocument();
  });

  it('estado vazio quando não há itens', () => {
    render(<OrdersGrid items={[]} />);
    expect(screen.getByText(/você ainda não tem pedidos/i)).toBeInTheDocument();
  });
});
