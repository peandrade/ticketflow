import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfirmDialog from './confirmDialog';

describe('ConfirmDialog (client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = 'auto';
  });

  it('não renderiza quando open=false', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={false}
        title="Tem certeza?"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza com título/descrição, foca o botão cancelar e bloqueia scroll', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { unmount } = render(
      <ConfirmDialog
        open
        title="Excluir item"
        description="Essa ação não pode ser desfeita."
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const dialog = screen.getByRole('dialog', { hidden: false });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Excluir item/i })).toBeInTheDocument();
    expect(screen.getByText(/não pode ser desfeita/i)).toBeInTheDocument();

    // foco inicial no botão "Cancelar"
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    expect(document.activeElement).toBe(cancelBtn);

    // bloqueio de scroll
    expect(document.body.style.overflow).toBe('hidden');

    // ao desmontar, restaura o overflow
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('clique no overlay chama onClose', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Sair?" onClose={onClose} onConfirm={onConfirm} />
    );

    // overlay é o div com bg preto translúcido
    const overlay = document.body.querySelector('div[class*="bg-black"]') as HTMLDivElement;
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('botão Cancelar chama apenas onClose', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Confirma?" onClose={onClose} onConfirm={onConfirm} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('botão Confirmar chama onConfirm e depois onClose', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Confirma?" onClose={onClose} onConfirm={onConfirm} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onClose.mock.invocationCallOrder.length).toBeGreaterThan(0);
    onClose.mock.invocationCallOrder[0] as number;
  });

  it('pressionar Escape fecha (onClose)', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Fechar?" onClose={onClose} onConfirm={onConfirm} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renderiza textos customizados dos botões', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Apagar?"
        confirmText="Apagar"
        cancelText="Voltar"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('button', { name: /Voltar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apagar/i })).toBeInTheDocument();
  });
});
