import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));
vi.mock('@/core/utils', () => ({
  formatBRL: (cents: number) => `R$ ${(cents / 100).toFixed(2)}`,
  cn: (...cls: any[]) => cls.filter(Boolean).join(' '),
}));

const Q_H = vi.hoisted(() => ({ bypass: false }));
vi.mock('./quantity', () => ({
  __esModule: true,
  default: (props: any) =>
    Q_H.bypass ? (
      <button onClick={() => props.onChange(props.value + 1)}>
        
      </button>
    ) : (
      <button
        aria-label="Aumentar"
        type="button"
        disabled={props.incDisabled}
        onClick={() => !props.incDisabled && props.onChange(props.value + 1)}
      >
        Aumentar
      </button>
    ),
}));

import ValueSelector from './valueSelector';

describe('ValueSelector', () => {
  const type = {
    id: 't1',
    name: 'Setor A',
    variants: [
      { id: 'vFULL', kind: 'FULL', priceCents: 10000, feeCents: 1000, active: true },
      { id: 'vHALF', kind: 'HALF', priceCents: 5000, feeCents: 500, active: true },
    ],
  };

  it('renderiza variantes e incrementa quantidade da variante FULL', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ValueSelector
        performanceId="p1"
        type={type as any}
        value={{}}
        onChange={onChange}
        globalTotalQty={0}
        globalHalfQty={0}
      />,
    );

    const incButtons = screen.getAllByRole('button', { name: /aumentar/i });
    expect(incButtons.length).toBeGreaterThanOrEqual(1);

    expect(incButtons.length).toBeGreaterThan(0);
    await user.click(incButtons[0]!);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ vFULL: 1 }));
  });

  it('impede incremento quando incDisabled=true (limite de meia) mesmo se o controle chamar onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        
        Q_H.bypass = true;
    
        const onlyHalf = {
          id: 'tH',
          name: 'Meia',
          variants: [{ id: 'vHALF', kind: 'HALF', priceCents: 5000, feeCents: 500, active: true }],
        };
    
        render(
          <ValueSelector
            performanceId="p1"
            type={onlyHalf as any}
            value={{ vHALF: 0 }}
            onChange={onChange}
            globalTotalQty={0}
            globalHalfQty={2} 
          />,
        );
  
        await user.click(screen.getByRole('button', { name: /aumentar/i }));
        expect(onChange).not.toHaveBeenCalled();
    
        Q_H.bypass = false;
      });

  it('desabilita todos os incrementos quando globalTotalQty = 6 (limite)', () => {
    const onChange = vi.fn();

    render(
      <ValueSelector
        performanceId="p1"
        type={type as any}
        value={{ vFULL: 3, vHALF: 3 }}
        onChange={onChange}
        globalTotalQty={6}
        globalHalfQty={3}
      />,
    );

    screen.getAllByRole('button', { name: /aumentar/i }).forEach((b) => expect(b).toBeDisabled());
  });

  it('não renderiza controle de quantidade para variantes inativas', () => {
    const onChange = vi.fn();
    const type2 = {
      ...type,
      variants: [{ id: 'vFULL', kind: 'FULL', priceCents: 10000, feeCents: 1000, active: false }],
    };

    render(
      <ValueSelector
        performanceId="p1"
        type={type2 as any}
        value={{}}
        onChange={onChange}
        globalTotalQty={0}
        globalHalfQty={0}
      />,
    );

    expect(screen.queryByRole('button', { name: /aumentar/i })).toBeNull();
  });
});
