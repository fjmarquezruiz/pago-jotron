import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

/** Configuración de Vitest: mismo alias `@/` que en tsconfig.json. Los tests unitarios viven junto al código. */
export default defineConfig({
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    // El tsconfig deja el JSX sin transformar (`preserve`, para Next): Vitest lo compila él, para poder
    // pintar componentes en las pruebas.
    oxc: { jsx: { runtime: 'automatic' } },
    // Las pruebas E2E (`e2e/`) las ejecuta Playwright (`pnpm test:e2e`), no Vitest.
    test: { exclude: [...configDefaults.exclude, 'e2e/**'] },
});
