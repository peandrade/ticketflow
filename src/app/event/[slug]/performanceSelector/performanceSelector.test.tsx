import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PerformanceOption } from '@/types/event';

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
}));

const ps = vi.hoisted(() => ({ lastProps: null as any }));

vi.mock('../performanceSelect/performanceSelect', () => ({
  __esModule: true,
  PerformanceSelect: (props: any) => {
    ps.lastProps = props;
    return (
      <div data-testid="perf-select">
        <button onClick={() => props.onChange?.('p2')}>trigger-onChange</button>
      </div>
    );
  },
}));

import { PerformanceSelector } from './performanceSelector';
import { act } from 'react-dom/test-utils';

const options: PerformanceOption[] = [
  {
    id: 'p1',
    startsAt: new Date('2099-01-01T10:00:00Z'),
    venue: { name: 'Arena A', city: 'São Paulo', state: 'SP' },
    availableTotal: 100,
    minPriceCents: 5000,
    maxPriceCents: 8000,
  },
  {
    id: 'p2',
    startsAt: new Date('2099-01-02T20:00:00Z'),
    venue: { name: 'Arena B', city: 'Rio de Janeiro', state: 'RJ' },
    availableTotal: 50,
    minPriceCents: 6000,
    maxPriceCents: 12000,
  },
];

describe('PerformanceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ps.lastProps = null;
  });

  it('render inicial: botão "Ingressos" desabilitado e title de ajuda; repassa props ao PerformanceSelect', () => {
    const onChange = vi.fn();
    render(
      <PerformanceSelector
        eventTitle="Show Z"
        eventSlug="rock-night"
        options={options}
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId('perf-select')).toBeInTheDocument();
    expect(ps.lastProps.eventTitle).toBe('Show Z');
    expect(ps.lastProps.options).toEqual(options);
    expect(ps.lastProps.value).toBeUndefined();
    expect(typeof ps.lastProps.onChange).toBe('function');

    const btn = screen.getByRole('button', { name: /Ingressos/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Escolha uma data/local');

    fireEvent.click(btn);
    expect(nav.push).not.toHaveBeenCalled();
  });

  it('com value definido: botão habilitado e navega ao clicar', () => {
    render(
      <PerformanceSelector
        eventTitle="Show Z"
        eventSlug="rock-night"
        options={options}
        value="p1"
        onChange={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /Ingressos/i });
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Selecionar ingressos');

    fireEvent.click(btn);
    expect(nav.push).toHaveBeenCalledWith('/event/rock-night/tickets/page?performanceId=p1');
  });

  it('propaga onChange vindo do PerformanceSelect', () => {
    const onChange = vi.fn();
    render(
      <PerformanceSelector
        eventTitle="Show Z"
        eventSlug="rock-night"
        options={options}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByText('trigger-onChange'));
    expect(onChange).toHaveBeenCalledWith('p2');
    expect(nav.push).not.toHaveBeenCalled();
  });  
});
