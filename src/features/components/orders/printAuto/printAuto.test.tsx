import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { PrintAuto } from './printAuto';

describe('PrintAuto', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('chama window.print após 100ms', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintAuto />);

    expect(printSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(99);
    expect(printSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('não quebra se window.print lançar erro (cobre try/catch)', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {
      throw new Error('boom');
    });

    expect(() => {
      render(<PrintAuto />);
      vi.runAllTimers();
    }).not.toThrow();

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('limpa o timeout ao desmontar (clearTimeout) e não imprime depois', () => {
    const clearSpy = vi.spyOn(global, 'clearTimeout');
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    const { unmount } = render(<PrintAuto />);
    unmount();

    expect(clearSpy).toHaveBeenCalledTimes(1);

    vi.runAllTimers();
    expect(printSpy).not.toHaveBeenCalled();
  });

  it('retorna null (não renderiza nada)', () => {
    const { container, unmount } = render(<PrintAuto />);
    expect(container.firstChild).toBeNull();
    unmount();
  });
});
