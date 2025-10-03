import React from 'react';
import { TicketFlow } from './ticketFlow';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
  cn: (...cls: any[]) => cls.filter(Boolean).join(' '),
}));

vi.mock('@/components/ui/button', () => ({
  Button: (p: any) => <button {...p} />,
}));

const getItemsFromDom = (container: HTMLElement) => {
  const el = container.querySelector('input[name="items"]') as HTMLInputElement | null;
  return el?.value ? JSON.parse(el.value) : [];
};

describe('TicketFlow (integração leve)', () => {
  const ticketTypes = [
    {
      id: 'setor-a',
      name: 'Setor A',
      variants: [
        { id: 'vFULL', kind: 'FULL', priceCents: 10000, feeCents: 1000, active: true },
        { id: 'vHALF', kind: 'HALF', priceCents: 5000, feeCents: 500, active: true },
      ],
    },
    {
      id: 'setor-b',
      name: 'Setor B',
      variants: [{ id: 'v2FULL', kind: 'FULL', priceCents: 12000, feeCents: 800, active: true }],
    },
  ];

  it('seleciona setor e adiciona um ingresso; Summary recebe 1 item', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TicketFlow performanceId="p1" ticketTypes={ticketTypes as any} startCheckoutAction={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /setor a/i }));
    await user.click(screen.getAllByRole('button', { name: /aumentar/i })[0]);

    const items = getItemsFromDom(container);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ qty: 1, variantId: 'vFULL' }));
    expect(screen.getByText(/Setor A \| Inteira/i)).toBeInTheDocument();
  });

  it('adiciona 2 inteiras (FULL) e monta label "Inteira"', async () => {
    const user = userEvent.setup();
    const tt = [
      {
        id: 'unico',
        name: 'Setor Único',
        variants: [{ id: 'vF', kind: 'FULL', priceCents: 10000, feeCents: 1000, active: true }],
      },
    ] as any;

    const { container } = render(
      <TicketFlow performanceId="p" ticketTypes={tt} startCheckoutAction={vi.fn()} /> // <-- usa tt
    );
    await user.click(screen.getByRole('button', { name: /setor único/i }));
    const inc = screen.getByRole('button', { name: /aumentar/i });
    await user.click(inc);
    await user.click(inc);

    const items = getItemsFromDom(container);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ variantId: 'vF', qty: 2 }));
    expect(items[0].name).toContain('Inteira');
  });

  it('adiciona 2 meias (HALF) e monta label "Meia-Entrada"', async () => {
    const user = userEvent.setup();
    const tt = [
      {
        id: 'meia',
        name: 'Meia',
        variants: [{ id: 'vH', kind: 'HALF', priceCents: 5000, feeCents: 500, active: true }],
      },
    ] as any;

    const { container } = render(
      <TicketFlow performanceId="p" ticketTypes={tt} startCheckoutAction={vi.fn()} /> // <-- usa tt
    );
    await user.click(screen.getByRole('button', { name: /meia/i }));
    const inc = screen.getByRole('button', { name: /aumentar/i });
    await user.click(inc);
    await user.click(inc);

    const items = getItemsFromDom(container);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ variantId: 'vH', qty: 2 }));
    expect(items[0].name).toContain('Meia-Entrada');
  });

  it('adiciona 2 idoso (ELDERLY) e monta label "Desc. 50% - Estatuto Idoso"', async () => {
    const user = userEvent.setup();
    const tt = [
      {
        id: 'idoso',
        name: 'Idoso',
        variants: [{ id: 'vE', kind: 'ELDERLY', priceCents: 5000, feeCents: 500, active: true }],
      },
    ] as any;

    const { container } = render(
      <TicketFlow performanceId="p" ticketTypes={tt} startCheckoutAction={vi.fn()} /> // <-- usa tt
    );
    await user.click(screen.getByRole('button', { name: /idoso/i }));
    const inc = screen.getByRole('button', { name: /aumentar/i });
    await user.click(inc);
    await user.click(inc);

    const items = getItemsFromDom(container);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ variantId: 'vE', qty: 2 }));
    expect(items[0].name).toContain('Desc. 50% - Estatuto Idoso');
  });

  it('adiciona 2 pcd (PCD) e monta label "PCD (50%)"', async () => {
    const user = userEvent.setup();
    const tt = [
      {
        id: 'pcd',
        name: 'PCD',
        variants: [{ id: 'vP', kind: 'PCD', priceCents: 5000, feeCents: 500, active: true }],
      },
    ] as any;

    const { container } = render(
      <TicketFlow performanceId="p" ticketTypes={tt} startCheckoutAction={vi.fn()} /> // <-- usa tt
    );
    await user.click(screen.getByRole('button', { name: /pcd/i }));
    const inc = screen.getByRole('button', { name: /aumentar/i });
    await user.click(inc);
    await user.click(inc);

    const items = getItemsFromDom(container);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ variantId: 'vP', qty: 2 }));
    expect(items[0].name).toContain('PCD (50%)');
  });

  it('botão "Trocar setor" volta para o passo sector', async () => {
    const user = userEvent.setup();
    render(
      <TicketFlow performanceId="p1" ticketTypes={ticketTypes as any} startCheckoutAction={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /setor a/i }));
    await user.click(screen.getByRole('button', { name: /trocar setor/i }));

    expect(screen.getByText(/selecionar setor/i)).toBeInTheDocument();
  });

  it('com lista de tipos vazia: permanece no passo sector e Summary recebe 0 item', () => {
    const { container } = render(
      <TicketFlow performanceId="p1" ticketTypes={[]} startCheckoutAction={vi.fn()} /> // <-- []
    );

    expect(screen.getByText(/selecionar setor/i)).toBeInTheDocument();

    const items = getItemsFromDom(container);
    expect(items).toHaveLength(0);

    expect(screen.getByRole('complementary', { name: /resumo da seleção/i })).toBeInTheDocument();
    expect(screen.getByText(/nenhum ingresso selecionado/i)).toBeInTheDocument();
  });
});
