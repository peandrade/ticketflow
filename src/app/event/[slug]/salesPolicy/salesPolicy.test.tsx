import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SalesPolicy } from './salesPolicy';

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

describe('SalesPolicy', () => {
  it('renderiza todas as infos quando opcionais estão presentes', () => {
    const onlineAt = new Date('2025-04-10T10:00:00-03:00');
    const boxAt = new Date('2025-04-10T11:00:00-03:00');

    render(
      <SalesPolicy
        policy={{
          serviceFeePercent: 20,
          limitPerCpf: 6,
          halfTicketsPerCpf: 2,
          onlineSaleOpensAt: onlineAt,
          boxOfficeOpensAt: boxAt,
          onlinePayments: 'Cartão até 3x s/ juros, 4 a 8x c/ juros, Pix',
          boxOfficePayments: 'Cartão 3x s/ juros, Débito, Dinheiro',
          buyUrl: 'https://www.ticketmaster.com.br',
        }}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 3, name: /informações de venda/i }),
    ).toBeInTheDocument();

    expect(screen.getByText('Taxa de serviço online')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();

    expect(screen.getByText(/Limite de ingressos por CPF/i)).toBeInTheDocument();
    expect(screen.getByText(/6 \(máx\. 2 meias\)/)).toBeInTheDocument();

    const vendasDD = screen.getByText('Início das vendas').parentElement!.querySelector('dd')!;
    expect(vendasDD).toBeTruthy();
    expect(vendasDD).toHaveTextContent(/10\/04\/2025.*10:00/);
    expect(screen.getByText('ticketflow.com.br')).toBeInTheDocument();
    expect(vendasDD).toHaveTextContent(/10\/04\/2025.*11:00/);
    expect(vendasDD).toHaveTextContent(/Bilheteria Oficial/);

    expect(
      screen.getByText('Cartão até 3x s/ juros, 4 a 8x c/ juros, Pix'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cartão 3x s/ juros, Débito, Dinheiro'),
    ).toBeInTheDocument();
  });

  it('omite opcionais quando ausentes (sem meias, sem buyUrl, sem boxOfficeOpensAt)', () => {
    const onlineAt = new Date('2025-04-10T10:00:00-03:00');

    render(
      <SalesPolicy
        policy={{
          serviceFeePercent: 15,
          limitPerCpf: 4,
          onlineSaleOpensAt: onlineAt,
          onlinePayments: 'Pix e Cartão',
          boxOfficePayments: 'Dinheiro',    
        }}
      />,
    );

    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText(/^4$/)).toBeInTheDocument();
    expect(screen.queryByText(/\(máx\./i)).toBeNull();

    const vendasDD = screen.getByText('Início das vendas').parentElement!.querySelector('dd')!;
    expect(vendasDD).toBeTruthy();
    expect(vendasDD).toHaveTextContent(/10\/04\/2025.*10:00/);
    expect(within(vendasDD).queryByText('ticketflow.com.br')).toBeNull();
    expect(within(vendasDD).queryByText(/Bilheteria Oficial/)).toBeNull();

    expect(screen.getByText('Pix e Cartão')).toBeInTheDocument();
    expect(screen.getByText('Dinheiro')).toBeInTheDocument();
  });
});
