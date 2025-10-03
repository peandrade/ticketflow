import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EventClient from './eventClient';
import type { PerformanceOption } from '@/types/event';

const ps = vi.hoisted(() => ({ lastProps: null as any }));
vi.mock('../performanceSelector', () => ({
  PerformanceSelector: (props: any) => {
    ps.lastProps = props;
    return (
      <div data-testid="selector" data-selected={props.value ?? ''}>
        <div data-testid="title">{props.eventTitle}</div>
        {props.options.map((o: any) => (
          <button key={o.id} onClick={() => props.onChange(o.id)}>
            select-{o.id}
          </button>
        ))}
        <button onClick={() => props.onChange('invalid')}>select-invalid</button>
      </div>
    );
  },
}));

const pi = vi.hoisted(() => ({ lastProps: null as any }));
vi.mock('../performanceInfo', () => ({
  PerformanceInfo: (props: any) => {
    pi.lastProps = props;
    return <div data-testid="info">info-{props.option?.id}</div>;
  },
}));

const ct = vi.hoisted(() => ({ lastProps: null as any }));
vi.mock('../capacityTable', () => ({
  CapacityTable: (props: any) => {
    ct.lastProps = props;
    return (
      <div data-testid="capacity" data-count={props.ticketTypes?.length ?? 0}>
        capacity
      </div>
    );
  },
}));

const sp = vi.hoisted(() => ({ lastProps: null as any }));
vi.mock('../salesPolicy', () => ({
  SalesPolicy: (props: any) => {
    sp.lastProps = props;
    return <div data-testid="policy">policy</div>;
  },
}));

const options: PerformanceOption[] = [
  {
    id: 'p1',
    startsAt: new Date('2099-01-01T10:00:00Z'),
    venue: { name: 'Arena A', city: 'São Paulo', state: 'SP' },
    availableTotal: 100,
    minPriceCents: 5000,
    maxPriceCents: 10000,
  },
  {
    id: 'p2',
    startsAt: new Date('2099-01-02T20:00:00Z'),
    venue: { name: 'Arena B', city: 'São Paulo', state: 'SP' },
    availableTotal: 50,
    minPriceCents: 6000,
    maxPriceCents: 12000,
  },
];

const performancesFull = [
  { id: 'p1', ticketTypes: [{ id: 'tt1' }] },
  { id: 'p2', ticketTypes: [{ id: 'tt2' }, { id: 'tt3' }] },
];

describe('EventClient', () => {
  it('render inicial: mostra selector e policy; NÃO mostra info/capacity', () => {
    render(
      <EventClient
        title="Show Z"
        eventSlug="show-z"
        options={options}
        performancesFull={performancesFull as any}
        policy={{ type: 'OPEN' } as any}
      />,
    );

    // Selector presente (o mock não tem botão "Selecione a data")
    expect(screen.getByTestId('selector')).toBeInTheDocument();

    // Info/Capacity ausentes no início
    expect(screen.queryByTestId('info')).toBeNull();
    expect(screen.queryByTestId('capacity')).toBeNull();

    // Policy SEMPRE visível no componente atual
    expect(screen.getByTestId('policy')).toBeInTheDocument();
    expect(sp.lastProps.policy?.type).toBe('OPEN');
  });

  it('seleção válida: renderiza info e capacity com props corretas (policy permanece)', () => {
    render(
      <EventClient
        title="Show Z"
        eventSlug="show-z"
        options={options}
        performancesFull={performancesFull as any}
        policy={{ type: 'OPEN' } as any}
      />,
    );

    fireEvent.click(screen.getByText('select-p2'));

    // DOM
    expect(screen.getByTestId('info')).toHaveTextContent('info-p2');
    expect(screen.getByTestId('capacity')).toHaveAttribute('data-count', '2');
    expect(screen.getByTestId('policy')).toBeInTheDocument();

    // Props capturadas pelos mocks
    expect(ps.lastProps.value).toBe('p2');
    expect(pi.lastProps.option?.id).toBe('p2');
    expect(ct.lastProps.ticketTypes?.length).toBe(2);
    expect(sp.lastProps.policy?.type).toBe('OPEN');
  });

  it('quando options muda e remove a selecionada: zera estado e some info/capacity (policy permanece)', async () => {
    const { rerender } = render(
      <EventClient
        title="T"
        eventSlug="e"
        options={options}
        performancesFull={performancesFull as any}
        policy={{ type: 'OPEN' } as any}
      />,
    );

    fireEvent.click(screen.getByText('select-p1'));
    expect(screen.getByTestId('info')).toHaveTextContent('info-p1');

    const optionsOnlyP2: PerformanceOption[] = [
      {
        id: 'p2',
        startsAt: new Date('2099-01-02T20:00:00Z'),
        venue: { name: 'Arena B', city: 'São Paulo', state: 'SP' },
        availableTotal: 50,
        minPriceCents: 6000,
        maxPriceCents: 12000,
      },
    ];
    rerender(
      <EventClient
        title="T"
        eventSlug="e"
        options={optionsOnlyP2}
        performancesFull={performancesFull as any}
        policy={{ type: 'OPEN' } as any}
      />,
    );

    await waitFor(() => {
      // Info/Capacity sumiram
      expect(screen.queryByTestId('info')).toBeNull();
      expect(screen.queryByTestId('capacity')).toBeNull();

      // Selector resetado
      expect(screen.getByTestId('selector')).toHaveAttribute('data-selected', '');
      expect(ps.lastProps.value).toBeUndefined();
    });

    // Policy permanece
    expect(screen.getByTestId('policy')).toBeInTheDocument();
  });

  it('se selectedOption existir mas selectedFull não: não renderiza info/capacity (policy permanece)', () => {
    const partialFull = [{ id: 'p1', ticketTypes: [{ id: 'tt1' }] }];
    render(
      <EventClient
        title="T"
        eventSlug="e"
        options={options}
        performancesFull={partialFull as any}
        policy={{ type: 'OPEN' } as any}
      />,
    );

    fireEvent.click(screen.getByText('select-p2'));

    expect(screen.queryByTestId('info')).toBeNull();
    expect(screen.queryByTestId('capacity')).toBeNull();
    expect(screen.getByTestId('policy')).toBeInTheDocument();
  });

  it('seleção inválida: efeito zera seleção e mantém conteúdo oculto (policy permanece)', async () => {
    render(
      <EventClient
        title="T"
        eventSlug="e"
        options={options}
        performancesFull={performancesFull as any}
        policy={{ type: 'OPEN' } as any}
      />,
    );

    fireEvent.click(screen.getByText('select-invalid'));

    await waitFor(() => {
      expect(screen.queryByTestId('info')).toBeNull();
      expect(ps.lastProps.value).toBeUndefined();
      expect(screen.getByTestId('selector')).toHaveAttribute('data-selected', '');
    });

    expect(screen.getByTestId('policy')).toBeInTheDocument();
  });
});
