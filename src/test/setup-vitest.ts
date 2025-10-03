import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Polyfill do fetch no jsdom quando necessário
import 'whatwg-fetch';

// Mocks mínimos para Next App Router em ambiente de teste
vi.mock('next/navigation', () => {
  // mocks suficientes para componentes que usam useRouter/usePathname
  const push = vi.fn();
  const replace = vi.fn();
  const back = vi.fn();
  const refresh = vi.fn();
  return {
    useRouter: () => ({ push, replace, back, refresh, prefetch: vi.fn() }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    notFound: () => { throw new Error('next/navigation.notFound called'); },
    redirect: (url: string) => { throw new Error(`redirect to: ${url}`); }
  };
});

// next/image em testes (renderiza <img>)
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
  }
}));

// Assure que o ambiente tenha TextEncoder/Decoder (Node 18+ geralmente possui)
import { TextEncoder, TextDecoder } from 'util';
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder as any;

// Extensões customizadas (se quiser)
expect.extend({});
