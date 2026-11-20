import { expect, test, type Page } from '@playwright/test';
import {
    PRODUCT,
    TEST_USER_ID,
    addFromProductPage,
    clearServerCart,
    closeDb,
    fillCard,
    fillDatosAndContinue,
    newDevice,
    productVariant,
    reachCheckout,
    restoreCheckout,
    signInWithForm,
    snapshotCheckout,
    sql,
    stripe,
    type CheckoutSnapshot,
} from './support';

/**
 * RF7: el recorrido de compra, de la ficha del producto a la confirmación. No se simula nada: son el
 * navegador, la app, la API, Stripe (claves de PRUEBA de `.env.local`), next-auth y MySQL de verdad.
 * Cada prueba deshace lo que hace (reembolsa el cobro, borra pedido y dirección, devuelve el stock
 * y el perfil y vacía el carrito del cliente de prueba).
 */
const HOLDER = 'Pago de Jotrón S.L.';

interface OrderRow {
    order_id: number;
    status: string;
    payment_method: string;
    payment_intent_id: string | null;
}

/** Los pedidos del cliente de prueba, con el nombre de su estado. */
async function orders(): Promise<OrderRow[]> {
    return sql<OrderRow>(
        `SELECT o.order_id, s.name AS status, o.payment_method, o.payment_intent_id
         FROM orders o JOIN order_statuses s ON s.status_id = o.status_id
         WHERE o.user_id = ?`,
        [TEST_USER_ID],
    );
}

/** Cuántas unidades del vino de pruebas hay en el carrito guardado del cliente de prueba. */
async function serverCartCount(): Promise<number> {
    const [row] = await sql<{ n: number }>(
        'SELECT COUNT(*) AS n FROM cart_products WHERE user_id = ?',
        [TEST_USER_ID],
    );
    return Number(row.n);
}

/** Pulsa "Realizar pedido" cuando el botón se habilita (los iframes de Stripe avisan de forma asíncrona). */
async function placeOrder(page: Page): Promise<void> {
    const button = page.getByRole('button', { name: 'Realizar pedido' });
    await expect(button).toBeEnabled();
    await button.click();
}

test.describe('RF7: compra', () => {
    let before: CheckoutSnapshot;

    test.beforeEach(async ({ browser }) => {
        await clearServerCart(browser);
        before = await snapshotCheckout();
    });
    test.afterEach(async () => {
        await restoreCheckout(before);
    });
    test.afterAll(async () => {
        await closeDb();
    });

    test('compra con tarjeta: pedido confirmado, cobro en Stripe, stock descontado y carrito vacío', async ({
        browser,
    }) => {
        test.setTimeout(240_000);
        const variant = await productVariant();
        const device = await newDevice(browser);
        const page = await device.newPage();

        await reachCheckout(page);
        await fillDatosAndContinue(page);

        await expect(page.getByRole('heading', { name: 'Pago', level: 1 })).toBeVisible();
        await fillCard(page, '4242 4242 4242 4242');
        await placeOrder(page);

        await expect(page).toHaveURL(/\/checkout\/confirmacion\?pedido=\d+$/, { timeout: 60_000 });
        const id = Number(new URL(page.url()).searchParams.get('pedido'));
        await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible();
        await expect(page.getByText(`#PJ-${id}`).first()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Carrito (0)' })).toBeVisible();

        // BD: el pedido, sus líneas con precio e IVA, el stock y el carrito.
        const [order] = await orders();
        expect(order).toMatchObject({
            order_id: id,
            status: 'Confirmado',
            payment_method: 'Tarjeta',
        });
        expect(order.payment_intent_id).toMatch(/^pi_/);
        const lines = await sql<{
            variant_id: number;
            quantity: number;
            unit_price: string;
            tax_rate: string;
        }>(
            'SELECT variant_id, quantity, unit_price, tax_rate FROM order_products WHERE order_id = ?',
            [id],
        );
        expect(lines).toHaveLength(1);
        expect(lines[0].variant_id).toBe(variant.variant_id);
        expect(Number(lines[0].unit_price)).toBe(Number(variant.price));
        expect(Number(lines[0].tax_rate)).toBeGreaterThan(0);
        const after = await productVariant();
        expect(after.stock).toBe(variant.stock - lines[0].quantity);
        expect(await serverCartCount()).toBe(0);

        // Stripe: el cobro está capturado.
        const intent = await stripe().paymentIntents.retrieve(order.payment_intent_id as string);
        expect(intent.status).toBe('succeeded');

        await device.close();
    });

    test('tarjeta rechazada: sigue en Pago sin cargo, sin pedido y con stock y carrito intactos', async ({
        browser,
    }) => {
        test.setTimeout(240_000);
        const variant = await productVariant();
        const device = await newDevice(browser);
        const page = await device.newPage();

        await reachCheckout(page);
        await fillDatosAndContinue(page);
        await fillCard(page, '4000 0000 0000 0002');
        await placeOrder(page);

        await expect(page.getByText(/^No pudimos procesar tu pago/)).toBeVisible({
            timeout: 60_000,
        });
        await expect(page.getByText('No se ha realizado ningún cargo.')).toBeVisible();
        await expect(page).toHaveURL(/\/checkout\/pago$/);

        expect(await orders()).toHaveLength(0);
        expect((await productVariant()).stock).toBe(variant.stock);
        expect(await serverCartCount()).toBe(1);
        await expect(page.getByRole('link', { name: 'Carrito (1)' })).toBeVisible();

        await device.close();
    });

    test('transferencia: pedido pendiente de pago con los datos bancarios y sin cobro en Stripe', async ({
        browser,
    }) => {
        test.setTimeout(240_000);
        const variant = await productVariant();
        const device = await newDevice(browser);
        const page = await device.newPage();

        await reachCheckout(page);
        await fillDatosAndContinue(page);

        const transfer = page.getByRole('radio', { name: 'Transferencia bancaria' });
        test.skip(
            (await transfer.count()) === 0,
            'El servidor no ofrece la transferencia (MVP2): necesita BANK_TRANSFER_ENABLED=true, BANK_TRANSFER_HOLDER y BANK_TRANSFER_IBAN.',
        );
        await transfer.check();
        await expect(
            page.getByRole('heading', { name: 'Datos para la transferencia' }),
        ).toBeVisible();
        await placeOrder(page);

        await expect(page).toHaveURL(/\/checkout\/confirmacion\?pedido=\d+$/, { timeout: 60_000 });
        const id = Number(new URL(page.url()).searchParams.get('pedido'));
        await expect(
            page.getByRole('heading', { name: 'Pedido recibido: pendiente de pago' }),
        ).toBeVisible();
        await expect(page.getByText(`Titular: ${HOLDER}`)).toBeVisible();
        await expect(page.getByText(/^IBAN: ES\d{2}/)).toBeVisible();
        await expect(page.getByText(`Concepto: PJ-${id}`)).toBeVisible();
        await expect(page.getByRole('link', { name: 'Carrito (0)' })).toBeVisible();

        const [order] = await orders();
        expect(order).toMatchObject({
            order_id: id,
            status: 'Pendiente de pago',
            payment_method: 'Transferencia',
            payment_intent_id: null,
        });
        expect((await productVariant()).stock).toBeLessThan(variant.stock);
        expect(await serverCartCount()).toBe(0);

        await device.close();
    });

    test('sin existencias al cerrar el pedido: pantalla de pago rechazado y nada se queda cobrado', async ({
        browser,
    }) => {
        test.setTimeout(240_000);
        const variant = await productVariant();
        const device = await newDevice(browser);
        const page = await device.newPage();

        // El importe ya está autorizado cuando se pide crear el pedido: justo antes de que llegue
        // esa petición otro cliente se lleva las existencias.
        await page.route('**/api/checkout/pedido', async (route) => {
            await sql('UPDATE product_variants SET stock = 0 WHERE variant_id = ?', [
                variant.variant_id,
            ]);
            await route.continue();
        });

        await reachCheckout(page);
        await fillDatosAndContinue(page);
        await fillCard(page, '4242 4242 4242 4242');
        await placeOrder(page);

        await expect(page).toHaveURL(/\/checkout\/confirmacion\?resultado=rechazado$/, {
            timeout: 60_000,
        });
        await expect(
            page.getByRole('heading', { name: '¡No se ha podido procesar el pago!' }),
        ).toBeVisible();
        expect(await orders()).toHaveLength(0);
        expect(await serverCartCount()).toBe(1);

        await device.close();
    });
});

test.describe('RF7: acceso al checkout', () => {
    test.beforeEach(async ({ browser }) => {
        await clearServerCart(browser);
    });
    test.afterAll(async ({ browser }) => {
        await clearServerCart(browser);
        await closeDb();
    });

    test('sin sesión pide iniciarla y, al hacerlo, vuelve a /checkout', async ({ browser }) => {
        const device = await newDevice(browser);
        const page = await device.newPage();
        // Con algo en el carrito para que Datos no mande de vuelta a /carrito.
        await page.goto(`/productos/${PRODUCT.slug}`);
        await addFromProductPage(page);

        await page.goto('/checkout');
        await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fcheckout$/);
        await signInWithForm(page);
        await expect(page).toHaveURL(/\/checkout$/);
        await expect(page.getByRole('heading', { name: 'Información de contacto' })).toBeVisible();

        await device.close();
    });

    test('con el carrito vacío, /checkout lleva a /carrito', async ({ browser }) => {
        const device = await newDevice(browser);
        const page = await device.newPage();
        await page.goto('/auth/login?callbackUrl=%2Fcheckout');
        await signInWithForm(page);
        await expect(page).toHaveURL(/\/carrito$/);

        await page.goto('/checkout');
        await expect(page).toHaveURL(/\/carrito$/);

        await device.close();
    });
});
