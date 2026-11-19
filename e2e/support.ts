import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import mysql from 'mysql2/promise';
import Stripe from 'stripe';
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

// ---------------------------------------------------------------------------------------------
// Checkout (RF7): BD y Stripe de verdad, para comprobar lo que la interfaz no enseña y limpiar
// ---------------------------------------------------------------------------------------------

/** Id del cliente de prueba (`user@jotron.com`) en el seed. */
export const TEST_USER_ID = 3;

/**
 * Variable de entorno: la del proceso o, si no está, la de `.env.local` (Playwright no lo carga).
 * Nunca se imprime: hay claves.
 */
function env(name: string): string {
    const fromProcess = process.env[name];
    if (fromProcess) return fromProcess;
    const file = path.join(process.cwd(), '.env.local');
    const line = existsSync(file)
        ? readFileSync(file, 'utf8')
              .split('\n')
              .find((candidate) => candidate.startsWith(`${name}=`))
        : undefined;
    const value = line
        ?.slice(name.length + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    if (!value) throw new Error(`Falta ${name} (entorno o .env.local)`);
    return value;
}

let pool: mysql.Pool | undefined;

/** Ejecuta una consulta SQL contra la BD local y devuelve las filas. */
export async function sql<T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
): Promise<T[]> {
    pool ??= mysql.createPool({ uri: env('DATABASE_URL'), connectionLimit: 2 });
    const [rows] = await pool.query(query, params);
    return rows as T[];
}

/** Cierra la conexión a la BD (al terminar el fichero de pruebas). */
export async function closeDb(): Promise<void> {
    await pool?.end();
    pool = undefined;
}

/** Estados de un PaymentIntent que se pueden cancelar. */
const CANCELLABLE: string[] = [
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'requires_capture',
];

let stripeClient: Stripe | undefined;

/** SDK de Stripe de servidor con la clave de PRUEBA de `.env.local`. */
export function stripe(): Stripe {
    stripeClient ??= new Stripe(env('STRIPE_SECRET_KEY'));
    return stripeClient;
}

/** Foto de lo que un test de compra puede alterar, para devolverlo a como estaba. */
export interface CheckoutSnapshot {
    stock: Map<number, number>;
    profile: { name: string; last_name: string; phone: string | null; id_card: string | null };
    addressIds: number[];
    orderIds: number[];
    /** Momento de inicio (s), para encontrar los PaymentIntents que cree el test. */
    startedAt: number;
}

/** Guarda el stock de todas las presentaciones, el perfil y las direcciones/pedidos del cliente de prueba. */
export async function snapshotCheckout(): Promise<CheckoutSnapshot> {
    const variants = await sql<{ variant_id: number; stock: number }>(
        'SELECT variant_id, stock FROM product_variants',
    );
    const [profile] = await sql<CheckoutSnapshot['profile']>(
        'SELECT name, last_name, phone, id_card FROM users WHERE user_id = ?',
        [TEST_USER_ID],
    );
    const addresses = await sql<{ address_id: number }>(
        'SELECT address_id FROM addresses WHERE user_id = ?',
        [TEST_USER_ID],
    );
    const orders = await sql<{ order_id: number }>(
        'SELECT order_id FROM orders WHERE user_id = ?',
        [TEST_USER_ID],
    );
    return {
        stock: new Map(variants.map((row) => [row.variant_id, row.stock])),
        profile,
        addressIds: addresses.map((row) => row.address_id),
        orderIds: orders.map((row) => row.order_id),
        startedAt: Math.floor(Date.now() / 1000) - 5,
    };
}

/**
 * Deja la BD y Stripe como estaban: devuelve el dinero de los cobros (o cancela las reservas),
 * borra los pedidos y direcciones que creó el test, restaura stock y perfil, vacía el carrito del
 * cliente de prueba y, si `orders`/`addresses` quedan vacías, reinicia su `AUTO_INCREMENT`.
 */
export async function restoreCheckout(before: CheckoutSnapshot): Promise<void> {
    const client = stripe();

    // Stripe: los pedidos con PaymentIntent cobrado se reembolsan…
    const created = await sql<{ order_id: number; payment_intent_id: string | null }>(
        'SELECT order_id, payment_intent_id FROM orders WHERE user_id = ? AND order_id NOT IN (?)',
        [TEST_USER_ID, before.orderIds.length ? before.orderIds : [0]],
    );
    const ids = new Set(
        created.flatMap((row) => (row.payment_intent_id ? [row.payment_intent_id] : [])),
    );
    // …y cualquier PaymentIntent creado durante el test (también los sin pedido: rechazos y reservas) se anula.
    const recent = await client.paymentIntents.list({
        created: { gte: before.startedAt },
        limit: 20,
    });
    for (const intent of recent.data) {
        if (intent.status === 'succeeded') ids.add(intent.id);
        else if (CANCELLABLE.includes(intent.status)) await client.paymentIntents.cancel(intent.id);
    }
    for (const id of Array.from(ids)) {
        const intent = await client.paymentIntents.retrieve(id);
        if (intent.status !== 'succeeded') continue;
        const refunds = await client.refunds.list({ payment_intent: id, limit: 1 });
        if (refunds.data.length === 0) await client.refunds.create({ payment_intent: id });
    }

    // BD: pedidos y líneas, direcciones, carrito, stock y perfil.
    for (const { order_id } of created) {
        await sql('DELETE FROM order_products WHERE order_id = ?', [order_id]);
        await sql('DELETE FROM orders WHERE order_id = ?', [order_id]);
    }
    const addresses = await sql<{ address_id: number }>(
        'SELECT address_id FROM addresses WHERE user_id = ?',
        [TEST_USER_ID],
    );
    for (const { address_id } of addresses) {
        if (!before.addressIds.includes(address_id)) {
            await sql('DELETE FROM addresses WHERE address_id = ?', [address_id]);
        }
    }
    await sql('DELETE FROM cart_products WHERE user_id = ?', [TEST_USER_ID]);
    for (const [variantId, stock] of Array.from(before.stock)) {
        await sql('UPDATE product_variants SET stock = ? WHERE variant_id = ? AND stock <> ?', [
            stock,
            variantId,
            stock,
        ]);
    }
    await sql(
        'UPDATE users SET name = ?, last_name = ?, phone = ?, id_card = ? WHERE user_id = ?',
        [
            before.profile.name,
            before.profile.last_name,
            before.profile.phone,
            before.profile.id_card,
            TEST_USER_ID,
        ],
    );
    for (const table of ['orders', 'addresses']) {
        const [{ n }] = await sql<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
        if (Number(n) === 0) await sql(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }
}

/** Presentación (`variant_id`, precio y stock) del producto de las pruebas. */
export async function productVariant(): Promise<{
    variant_id: number;
    stock: number;
    price: string;
}> {
    const [row] = await sql<{ variant_id: number; stock: number; price: string }>(
        `SELECT v.variant_id, v.stock, v.price FROM product_variants v
         JOIN products p ON p.product_id = v.product_id WHERE p.slug = ?`,
        [PRODUCT.slug],
    );
    return row;
}

/**
 * Como anónimo: añade el vino de pruebas, abre el carrito, pulsa "Continuar", inicia sesión con el
 * formulario y llega a `/checkout` (Datos).
 */
export async function reachCheckout(page: Page): Promise<void> {
    await page.goto(`/productos/${PRODUCT.slug}`);
    await addFromProductPage(page);
    await page.goto('/carrito');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.getByRole('link', { name: /^Continuar/ }).click();
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fcheckout$/);
    await signInWithForm(page);
    await expect(page).toHaveURL(/\/checkout$/);
}

/**
 * Rellena Datos (el cliente de prueba no tiene dirección: se abre el formulario de nueva dirección)
 * y pulsa "Continuar pago".
 */
export async function fillDatosAndContinue(page: Page): Promise<void> {
    await expect(page.getByRole('heading', { name: 'Información de contacto' })).toBeVisible();
    // Contacto: nombre y correo vienen de la cuenta; el teléfono, no.
    await page.getByLabel('Teléfono').first().fill('600123456');

    const address = page.getByRole('group', { name: 'Nueva dirección' });
    await address.getByRole('combobox', { name: 'Tipo de vía' }).click();
    await page.getByRole('option', { name: 'Calle', exact: true }).click();
    await address.getByLabel('Nombre de la vía').fill('Larios');
    await address.getByLabel('Número').fill('12');
    await address.getByLabel('Código postal').fill('28014');
    await address.getByLabel('Ciudad').fill('Madrid');
    await expect(address.getByLabel('Provincia')).not.toHaveValue('');
    await address.getByLabel('Teléfono').fill('600123456');
    await address.getByRole('radio', { name: 'Envío' }).check();

    await page.getByRole('button', { name: 'Continuar pago' }).click();
    // En desarrollo, la primera visita compila la página de Pago (con Stripe): tarda.
    await expect(page).toHaveURL(/\/checkout\/pago$/, { timeout: 90_000 });
}

/**
 * Rellena los tres iframes de Stripe (uno por campo) y el titular.
 *
 * @param page - Pago, ya cargada.
 * @param number - Número de tarjeta de prueba.
 */
export async function fillCard(page: Page, number: string): Promise<void> {
    // Solo los visibles: Stripe añade además un iframe oculto (no es de ningún campo).
    const selector = 'iframe[name^="__privateStripeFrame"]:visible';
    await expect(page.locator(selector)).toHaveCount(3);
    const year = String((new Date().getFullYear() + 3) % 100).padStart(2, '0');
    const fields = [
        { placeholder: '0000-0000-0000-0000', value: number },
        { placeholder: 'MM / AA', value: `12${year}` },
        { placeholder: '123', value: '123' },
    ];
    for (const [index, { placeholder, value }] of Array.from(fields.entries())) {
        const frame = page.frameLocator(selector).nth(index);
        await frame.getByPlaceholder(placeholder).fill(value);
    }
    await page.getByLabel('Nombre del titular').fill('Cliente Demo');
}
