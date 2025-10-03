import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceSelect } from './performanceSelect';
import type { PerformanceOption } from '@/types/event';

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

describe('PerformanceSelect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('render inicial: mostra placeholder e dropdown fechado', () => {
    render(
      <PerformanceSelect eventTitle="Show Z" options={options} onChange={vi.fn()} />
    );

    expect(screen.getByText(/Selecione a data/i)).toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: /selecione a data/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('abre e fecha com o botão (aria-expanded atualiza)', () => {
    render(
      <PerformanceSelect eventTitle="Show Z" options={options} onChange={vi.fn()} />
    );
    const trigger = screen.getByRole('button', { name: /selecione a data/i });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('fecha ao clicar fora e ao pressionar Esc', () => {
    render(
      <PerformanceSelect eventTitle="Show Z" options={options} onChange={vi.fn()} />
    );
    const trigger = screen.getByRole('button', { name: /selecione a data/i });

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.click(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('seleciona uma opção: chama onChange e fecha o dropdown', () => {
    const onChange = vi.fn();
    render(
      <PerformanceSelect eventTitle="Show Z" options={options} onChange={onChange} />
    );
    const trigger = screen.getByRole('button', { name: /selecione a data/i });
    fireEvent.click(trigger);

    const rioOption = screen.getAllByRole('option').find((el) =>
      el.textContent?.includes('Rio de Janeiro')
    );
    expect(rioOption).toBeDefined();

    fireEvent.click(rioOption!);

    expect(onChange).toHaveBeenCalledWith('p2');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('com value definido: mostra cidade e marca aria-selected na opção ativa', () => {
    render(
      <PerformanceSelect
        eventTitle="Show Z"
        options={options}
        value="p1"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger.textContent).toMatch(/São Paulo/);

    fireEvent.click(trigger);
    const opts = screen.getAllByRole('option');
    const active = opts.find((el) => el.textContent?.includes('São Paulo'));
    const inactive = opts.find((el) => el.textContent?.includes('Rio de Janeiro'));
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(inactive).toHaveAttribute('aria-selected', 'false');
  });
});

const base: PerformanceOption[] = [
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

describe('PerformanceSelect – extra coverage', () => {
  it('aceita startsAt como string (cobre new Date(d))', () => {
    const stringOptions: PerformanceOption[] = [
      { ...base[0], id: 'ps1', startsAt: '2099-03-01T15:30:00Z' as any, venue: base[0]!.venue },
      { ...base[1], id: 'ps2', startsAt: '2099-03-02T18:00:00Z' as any, venue: base[1]!.venue },
    ];

    render(<PerformanceSelect eventTitle="Show Z" options={stringOptions} onChange={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /selecione a data/i }));
    const opts = screen.getAllByRole('option');

    expect(opts.some((o) => /às/.test(o.textContent || ''))).toBe(true);
  });

  it('handler de clique-fora retorna cedo quando o ref está nulo (sem lançar erro)', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');

    const { unmount } = render(
      <PerformanceSelect eventTitle="Show Z" options={base} onChange={() => {}} />
    );

    const clickCb = addSpy.mock.calls.find(([type]) => type === 'click')?.[1] as
      | ((e: MouseEvent) => void)
      | undefined;

    expect(clickCb).toBeTruthy();

    unmount();

    expect(() => clickCb!(new MouseEvent('click'))).not.toThrow();

    addSpy.mockRestore();
  });
});
