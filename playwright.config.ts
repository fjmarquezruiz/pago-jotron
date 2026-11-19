import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './e2e/support';

/**
 * Pruebas E2E (`pnpm e2e`): el navegador, la app y la BD de verdad. Necesitan MySQL arrancado y
 * sembrado (`pnpm db:seed`). Si ya hay un servidor en `BASE_URL` lo reutilizan; si no, arrancan
 * `pnpm dev`. En local usan el Chrome del sistema (no hace falta descargar navegadores); en CI,
 * el de Playwright (`pnpm exec playwright install --with-deps chromium`).
 */
export default defineConfig({
    testDir: './e2e',
    timeout: 120_000,
    expect: { timeout: 15_000 },
    // Las pruebas comparten un usuario y su carrito en la BD: de una en una.
    workers: 1,
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chrome',
            use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
        },
    ],
    webServer: {
        command: `pnpm dev -p ${new URL(BASE_URL).port || '3000'}`,
        // Una URL que contesta 200 al instante y no pasa por la verificación de edad (`/` redirige).
        url: `${BASE_URL}/api/auth/csrf`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
