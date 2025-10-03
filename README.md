# TicketFlow

Aplicação de **venda e gestão de ingressos** construída com **Next.js + TypeScript + Tailwind**. Projeto “full-stack” com **Prisma** para acesso a dados e **Stripe** para pagamentos. Foco em **DX**, **performance** e **mobile-first**.

> **Status:** pronto para uso local e evolução incremental. Layout compatível com mobile e testes configurados para **cobertura 100%** (via thresholds de cobertura).

---

## Sumário

- [Stack & Bibliotecas](#stack--bibliotecas)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Projeto](#configuração-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Como Rodar](#como-rodar)
- [Testes & Cobertura](#testes--cobertura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Funcionalidades](#funcionalidades)
- [Arquitetura (visão rápida)](#arquitetura-visão-rápida)
- [Padrões de Código](#padrões-de-código)
- [Performance & Mobile](#performance--mobile)
- [Segurança](#segurança)
- [Deploy](#deploy)
- [Roadmap](#roadmap)
- [Créditos](#créditos)
- [Licença](#licença)

---

## Stack & Bibliotecas

**Aplicação**
- **Next.js** (App Router)
- **React** + **TypeScript**
- **Tailwind CSS** (mobile-first)
- **Radix UI** (acessibilidade e componentes semântico-focados)
- **Stripe** (`@stripe/stripe-js`) para checkout
- **Prisma** (`@prisma/client`) para ORM

**Qualidade & DX**
- **Vitest** (unitário/integração) com **coverage**
- **ESLint** + **@typescript-eslint** + **eslint-plugin-import**
- **Prettier**
- **Husky** + **lint-staged**
- **tsx** (scripts TS no Node)
- (opcional) **@next/bundle-analyzer** para análise de bundle

> Observação: a lista acima cobre as bibliotecas principais usadas no projeto (além dos utilitários Radix listados no `package.json`).

---

## Pré-requisitos

- **Node.js 20+ (LTS)**
- **pnpm** (recomendado)
  
Ative o Corepack (opcional, mas recomendado):
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## Configuração do Projeto

1. **Instalar dependências**
   ```bash
   pnpm install
   ```

2. **Configurar variáveis de ambiente**
   - Copie `./.env.example` para `./.env.local` e preencha (ver seção abaixo).
   - **Nunca** versione `.env*`.

3. **Banco de dados (Prisma)**
   ```bash
   pnpm prisma migrate dev
   pnpm db:seed   # seeding opcional; veja prisma/seed.ts
   ```

4. **Rodar em desenvolvimento**
   ```bash
   pnpm dev
   ```

5. **Acessar**
   - App: `http://localhost:3000`

---

## Variáveis de Ambiente

Crie `./.env.local` com:

```dotenv
# Banco de dados
DATABASE_URL="postgresql://user:password@host:5432/ticketflow?schema=public"

# Stripe (client/server)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # se usar webhooks localmente

# Node env
NODE_ENV="development"
```

> **Dica:** valide env em runtime (ex.: criar `src/core/env.ts` com Zod) para falhar cedo em caso de configuração incorreta.

---

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:watch": "vitest",
  "coverage": "vitest run --coverage",
  "db:seed": "prisma db seed"
}
```

Comandos úteis:

```bash
pnpm dev            # ambiente de desenvolvimento
pnpm build          # build de produção
pnpm start          # servir build
pnpm lint           # lint
pnpm typecheck      # checagem de tipos
pnpm test           # testes
pnpm coverage       # cobertura com relatório
pnpm db:seed        # popular dados iniciais
```

---

## Como Rodar

```bash
pnpm install
pnpm prisma migrate dev
pnpm db:seed          # opcional
pnpm dev
```

Build de produção:

```bash
pnpm build
pnpm start
```

---

## Testes & Cobertura

- **Vitest** para testes unitários/integração.
- Relatório de cobertura em `./coverage`.
- Thresholds configuráveis para manter **100%**. Exemplo de `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      all: true,
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
      exclude: [
        'next-env.d.ts',
        'src/**/__tests__/**',
        'src/**/types.ts',
        'src/**/mocks/**'
      ]
    }
  }
});
```

Executar:
```bash
pnpm coverage
```

> **Dica:** use **MSW** (Mock Service Worker) para stubs de rede e garanta testes determinísticos.

---

## Estrutura de Pastas

```txt
app/                      # rotas (App Router) e layouts
  (routes)/
  layout.tsx
  page.tsx
src/
  components/             # UI reutilizável (ex.: Footer)
  features/               # fluxos/coisas de negócio (ex.: orders, tickets)
  core/                   # env, logger, utils puros
  lib/                    # adaptadores
  styles/                 # estilos globais (Tailwind base)
prisma/
  schema.prisma
  seed.ts
public/                   # assets estáticos
tests/                    # testes (unit/integration)
```

---

## Funcionalidades

- **Catálogo e detalhes de eventos/ingressos** (UI responsiva)
- **Carrinho/checkout** com **Stripe**
- **Pedidos e recibos** (impressão/compartilhamento)
- **Acessibilidade**: navegação por teclado, foco visível (Radix/Tailwind)
- **Internacionalização & SEO básicos** (metadados do Next)
- **Observabilidade básica** (source maps; integração Sentry opcional)

> A disponibilidade exata de módulos pode variar por ambiente/flag. Consulte as rotas e `features/`.

---

## Arquitetura (visão rápida)

- **Server-first**: páginas e data-fetching no servidor; cliente só para interações.
- **Boundaries claros**:
  - `core/` (puro: env, utils)
  - `features/` (casos de uso + UI específica)
  - `components/` (UI compartilhada)
- **Prisma** para acesso a dados. **Migrations** versionadas.
- **Stripe** no cliente (chave pública) e no servidor (se necessário, webhooks).

---

## Padrões de Código

- **TypeScript strict**; preferir **named exports** e **type-only imports**.
- **ESLint/Prettier** com hooks de commit (**Husky + lint-staged**).
- **Commits pequenos e atômicos**.  
- Evitar **`any`**; use **unions discriminadas** e `assertNever` para exaustividade.

---

## Performance & Mobile

- **Mobile-first** (Tailwind).  
- **Dynamic import** apenas para componentes pesados (modais, carrosséis).  
- Prefira **`startTransition`** ao tratar interações que disparam trabalho caro.  
- Monitore **INP**/tarefas longas; use `web-vitals` em dev se necessário.

---

## Segurança

- **Não** versione `.env*`.  
- Rotacione chaves em caso de exposição.  
- Ative **headers** de segurança (CSP progressiva, `X-Content-Type-Options`, `Referrer-Policy`).  
- Valide variáveis de ambiente em runtime.

---

## Deploy

- **Vercel** (recomendado) ou Node self-hosted.
- Defina as variáveis de ambiente no provedor.
- Garanta `DATABASE_URL` e chaves do Stripe no painel do ambiente.
- Habilite **source maps** de produção para melhor rastreio de erros.

---

## Roadmap

- [ ] E2E com **Playwright** (smoke: checkout/recibo).  
- [ ] **Sentry** (server + client) com release tracking.  
- [ ] **Bundle analyzer** por rota e metas de tamanho.  
- [ ] Internacionalização completa (i18n).  

---

## Créditos

Desenvolvido por **Pedro Andrade**  
- GitHub: https://github.com/peandrade  
- LinkedIn: https://www.linkedin.com/in/pedro-andrade-santos/

---

## Licença

Licença definida em `LICENSE` (padrão: **MIT**). Ajuste conforme necessário.

---

> Dúvidas comuns ficam resolvidas executando: `pnpm install`, `pnpm prisma migrate dev`, `pnpm dev`. Para garantir a cobertura 100%, rode `pnpm coverage` e mantenha os thresholds no `vitest.config.ts`.
