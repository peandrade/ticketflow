import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PerformanceInfo } from './performanceInfo';

describe('PerformanceInfo', () => {
  it('renderiza seção com horários, local e classificação', () => {
    const starts = new Date('2025-12-01T20:00:00.000Z');

    const { container } = render(
      <PerformanceInfo
        option={{
          id: 'p1',
          startsAt: starts,
          venue: { name: 'Allianz Parque', city: 'São Paulo', state: 'SP' },
        }}
      />
    );

    expect(screen.getByText(/Abertura dos portões/i)).toBeInTheDocument();
    expect(screen.getByText(/Horário do show/i)).toBeInTheDocument();
    expect(screen.getByText(/Local/i)).toBeInTheDocument();
    expect(screen.getByText(/Classificação/i)).toBeInTheDocument();

    const timeEls = Array.from(container.querySelectorAll('time'));
    expect(timeEls.some(t => t.getAttribute('datetime')?.startsWith(starts.toISOString().slice(0, 19)))).toBe(true);

    expect(screen.getByText('Allianz Parque')).toBeInTheDocument();
  });

  it('não renderiza nada quando option é indefinida', () => {
    const { container } = render(<PerformanceInfo />);
    expect(container).toBeEmptyDOMElement();
  });
});
