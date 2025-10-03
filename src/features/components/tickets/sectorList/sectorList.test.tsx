import React from 'react';
import SectorList from './sectorList';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
}));

describe('Sector List', () => {
  const types = [
    {
      id: 'pista',
      name: 'Pista',
      variants: [
        { id: 'v1', priceCents: 1000, feeCents: 100, active: true },
        { id: 'v2', priceCents: 1200, feeCents: 150, active: true },
      ],
      inventory: { available: 10 },
    },
    {
      id: 'vip',
      name: 'VIP',
      variants: [{ id: 'v3', priceCents: 3000, feeCents: 300, active: true }],
      inventory: { available: 0 },
    },
  ];
  it('onSelect devera ser chamado no click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SectorList types={types} onSelect={onSelect} selectedId="Pista" />);

    const label = screen.getByRole('button', { name: /-|Pista/i });
    await user.click(label);
    expect(onSelect).toHaveBeenCalledWith('pista');
  });
});
