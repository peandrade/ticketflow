import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CapacityTable } from './capacityTable';

const tt = [
  { id: 'pista', name: 'Pista', initialQuantity: 1000 },
  { id: 'vip', name: 'VIP', initialQuantity: 250 },
];

describe('CapacityTable', () => {
  it('renderiza linhas e totais com razão default (40%)', () => {
    render(<CapacityTable ticketTypes={tt} />);
    const rows = screen.getAllByRole('row');
    const bodyRows = rows.slice(1, -1);
    expect(bodyRows).toHaveLength(2);

    const foot = rows.at(-1)!;
    const cells = within(foot).getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('1.250');
    expect(cells[2]).toHaveTextContent('500');
  });

  it('usa halfQuotaRatio customizado', () => {
    render(<CapacityTable ticketTypes={tt} halfQuotaRatio={0.2} />);
    const foot = screen.getAllByRole('row').at(-1)!;
    const cells = within(foot).getAllByRole('cell');
    expect(cells[2]).toHaveTextContent('250');
  });

  it('retorna null quando não há ticketTypes', () => {
    const { container } = render(<CapacityTable ticketTypes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('usa 0 quando initialQuantity é undefined (fallback do ?? 0)', () => {
    const ttMissing = [
      ...tt,
      { id: 'sem', name: 'Sem setor', initialQuantity: undefined as any },
    ];
  
    render(<CapacityTable ticketTypes={ttMissing} />);
  
    const row = screen.getByText('Sem setor').closest('tr')!;
    const cells = within(row).getAllByRole('cell');
  
    expect(cells[1]).toHaveTextContent(/^0$/);
    expect(cells[2]).toHaveTextContent(/^0$/);
  
    const foot = screen.getAllByRole('row').at(-1)!;
    const totalCells = within(foot).getAllByRole('cell');
    expect(totalCells[1]).toHaveTextContent('1.250');
    expect(totalCells[2]).toHaveTextContent('500');
  });  
});
