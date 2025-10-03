import { describe, it, expect } from "vitest";
import { formatBRL } from "./currency";

describe('formatBRL', () => {
    it('formata zero', () => {
        expect(formatBRL(0)).toBe('R$\u00A00,00');
    });

    it('formata valores inteiros em reais', () => {
        expect(formatBRL(12300)).toBe('R$\u00A0123,00');
    });

    it('formata valores inteiros em reais', () => {
        expect(formatBRL(123456789)).toBe('R$\u00A01.234.567,89');
    });

    it('formata valores inteiros em reais', () => {
        expect(formatBRL(199)).toBe('R$\u00A01,99');
    });
});
