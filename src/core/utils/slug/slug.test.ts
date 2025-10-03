import { describe, it, expect } from 'vitest';
import {
  slugifyCity, cityToSlug, parseCitySlug,
  slugify, venueToSlug, parseVenueSlug, toSlug
} from '@/core/utils';

describe('slug utils', () => {
  it('slugifyCity remove acentos e normaliza', () => {
    expect(slugifyCity('São Paulo')).toBe('sao-paulo');
    expect(slugifyCity('Porto Alegre')).toBe('porto-alegre');
  });

  it('cityToSlug combina cidade e UF', () => {
    expect(cityToSlug('São Paulo', 'SP')).toBe('sao-paulo-sp');
  });

  it('parseCitySlug extrai partes válidas', () => {
    expect(parseCitySlug('sao-paulo-sp')).toEqual({ citySlug: 'sao-paulo', state: 'SP' });
    expect(parseCitySlug('invalido')).toBeNull();
  });

  it('slugify genérico', () => {
    expect(slugify('Café com Leite!')).toBe('cafe-com-leite');
    expect(slugify('  --A_B/C D--  ')).toBe('a-b-c-d');
  });

  it('venueToSlug e parseVenueSlug', () => {
    const slug = venueToSlug('Allianz Parque', 'São Paulo', 'SP');
    expect(slug).toBe('allianz-parque--sao-paulo-sp');
    expect(parseVenueSlug(slug)).toEqual({
      venueSlug: 'allianz-parque',
      citySlug: 'sao-paulo',
      state: 'SP',
    });
    expect(parseVenueSlug('x--y-spo')).toBeNull();
  });

  it('toSlug limpa e padroniza entradas diversas', () => {
    expect(toSlug('  Hello/World_2025!  ')).toBe('hello-world-2025');
    expect(toSlug('C++ & Rust ♥ Dev')).toBe('c-rust-dev');
  });
});
