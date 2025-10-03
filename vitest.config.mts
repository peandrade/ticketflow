import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  logLevel: 'error',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup-vitest.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'e2e', 'playwright'],
    onConsoleLog(log, type) {
      const isPrismaRuntime = /[\\/]prisma[\\/]runtime[\\/]/i.test(log);
      const isMissingMap = /Failed to load source map/i.test(log) || /ENOENT.*\.js\.map/i.test(log);
      if (isPrismaRuntime && isMissingMap) return false;
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov', 'html'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/.next/**',
        '**/node_modules/**',
        'src/generated/**',
        'prisma/**',
        'src/test/**',
        '**/*.config.*',
        'next.config.ts',
        'next-env.d.ts',
        'vitest.config.*',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/features/components/ui/**',
        '**/index.{ts,tsx,js,jsx}'
      ],
    },
  },
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./src/test/stubs/server-only.ts', import.meta.url)),
    },
  },
});
