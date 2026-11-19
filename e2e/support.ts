import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { AGE_VERIFIED_COOKIE } from '@/lib/auth/age';

/** Dónde corre la app. Coincide con `NEXTAUTH_URL` de `.env.local`, que next-auth usa en el login. */
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * Cliente de prueba del seed (`pnpm db:seed`, `src/db/seed.ts`). Las pruebas tocan solo su
 * carrito (`cart_products`) y lo vacían antes y después.
 */
export const TEST_USER = { email: 'user@jotron.com', password: 'Cliente1234' };

/** Un producto del seed con una sola presentación y stock. */
export const PRODUCT = { slug: 'jotron-tinto-roble-2023', name: 'Jotrón Tinto Roble' };

/**
 * Un "dispositivo": un navegador nuevo, sin `localStorage` ni cookies de sesión, con la
 * verificación de edad ya hecha (si no, todas las páginas redirigen a `/verificar-edad`).
 *
 * @param browser - El navegador de la prueba.
 * @returns Un contexto limpio con la edad verificada.
 */
export async function newDevice(browser: Browser): Promise<BrowserContext> {
    const context = await browser.newContext({
        baseURL: BASE_URL,
        viewport: { width: 1440, height: 900 },
    });
    await context.addCookies([{ name: AGE_VERIFIED_COOKIE, value: '1', url: BASE_URL }]);
    return context;
}

/**
 * Inicia sesión sin pasar por la interfaz, con la API de next-auth (token CSRF y credenciales). Solo
 * para preparar o limpiar: el recorrido que se prueba usa el formulario de verdad.
 *
 * @param context - El dispositivo en el que se abre la sesión.
 */
async function signInWithApi(context: BrowserContext): Promise<void> {
    const { csrfToken } = await (await context.request.get('/api/auth/csrf')).json();
    const response = await context.request.post('/api/auth/callback/credentials', {
        form: { csrfToken, ...TEST_USER, json: 'true' },
    });
    expect(response.ok()).toBeTruthy();
}

/**
 * Vacía el carrito que el cliente de prueba tiene guardado en el servidor (`PUT` con la lista
 * vacía), para que cada ejecución parta de cero.
 *
 * @param browser - El navegador de la prueba.
 */
export async function clearServerCart(browser: Browser): Promise<void> {
    const context = await newDevice(browser);
    await signInWithApi(context);
    const response = await context.request.put('/api/carrito', { data: { items: [] } });
    expect(response.ok()).toBeTruthy();
    await context.close();
}

/**
 * Rellena y envía el formulario de `/auth/login`, como lo haría una persona.
 *
 * @param page - La página de login.
 */
export async function signInWithForm(page: Page): Promise<void> {
    await page.getByLabel('Correo electrónico').fill(TEST_USER.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(TEST_USER.password);
    await page.locator('form').getByRole('button', { name: 'Iniciar sesión' }).click();
}

/** Lo que `localStorage` guarda del carrito (`src/stores/cart.ts`). */
export interface StoredCart {
    items: { variantId: number; quantity: number }[];
    owner: number | null;
}

/**
 * Lee el carrito guardado en el navegador.
 *
 * @param page - Cualquier página del dispositivo.
 * @returns Sus líneas y de quién es (`owner`: `null` si es anónimo).
 */
export async function storedCart(page: Page): Promise<StoredCart> {
    return page.evaluate(() => {
        const raw = localStorage.getItem('pago-jotron-cart');
        return raw ? JSON.parse(raw).state : { items: [], owner: null };
    });
}

/**
 * Pulsa "Añadir al carrito" en la ficha de un producto. Reintenta hasta que sale el aviso: un clic
 * antes de que React hidrate la página no hace nada.
 *
 * @param page - Una ficha de producto ya abierta.
 */
export async function addFromProductPage(page: Page): Promise<void> {
    const addButton = page.getByRole('button', { name: 'Añadir al carrito' });
    await expect(async () => {
        await addButton.click();
        await expect(page.getByText('Añadido al carrito')).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
}
