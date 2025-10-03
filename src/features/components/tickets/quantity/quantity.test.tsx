import React from 'react';
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest";
import Quantity from './quantity';

describe('Quantity', () => {
    it('Mostrar o valor incial', () => {
        const onChange = vi.fn();
        render(<Quantity value={0} onChange={onChange} />);
        expect(screen.getByText('0')).toHaveTextContent('0');
    });

    it('Incrementar valor', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Quantity value={0} onChange={onChange} />);
        
        const plus = screen.getByRole('button', { name: /\+|Aumentar/i});
        await user.click(plus);
        expect(onChange).toHaveBeenLastCalledWith(1);
    });

    it('Decrementar valor', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Quantity value={1} onChange={onChange} />);
        
        const minus = screen.getByRole('button', { name: /-|Diminuir/i});
        await user.click(minus);
        expect(onChange).toHaveBeenLastCalledWith(0);
    });
});