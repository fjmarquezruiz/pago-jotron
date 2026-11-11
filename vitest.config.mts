import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Configuración de Vitest: mismo alias `@/` que en tsconfig.json. */
export default defineConfig({
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
});
