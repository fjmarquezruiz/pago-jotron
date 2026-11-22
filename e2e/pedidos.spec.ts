import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { TEST_USER, TEST_USER_ID, closeDb, newDevice, signInWithForm, sql } from './support';

/**
 * RF8: el cliente consulta sus pedidos, los cancela en plazo y no puede cancelar lo que ya no
 * toca. Los pedidos se insertan directamente en la BD local (con la antigüedad y el estado que
 * cada prueba necesita) y se entra por la interfaz de verdad: formulario de login, páginas, diálogo
 * y API. Son pedidos sin PaymentIntent, así que no se toca Stripe. Cada prueba deshace lo que hace:
 * borra pedidos, auditoría y dirección, y devuelve el stock.
 */

/** Presentación con stock a la que se asignan las líneas de los pedidos de prueba. */
const VARIANT_ID = 1;
const QUANTITY = 2;
/** API de Mailpit (docker compose up -d mailpit): la bandeja donde cae el correo de la tienda. */
const MAILPIT = 'http://localhost:8025/api/v1';

/** Espera al correo con ese asunto, lo devuelve (con su cuerpo) y lo borra de la bandeja. */
async function takeMail(subject: string): Promise<{ To: { Address: string }[]; Text: string }> {
    for (let attempt = 0; attempt < 20; attempt++) {
        const { messages } = (await (
            await fetch(`${MAILPIT}/search?query=${encodeURIComponent(`subject:"${subject}"`)}`)
        ).json()) as { messages: { ID: string }[] };
        if (messages.length > 0) {
            const mail = await (await fetch(`${MAILPIT}/message/${messages[0].ID}`)).json();
            await fetch(`${MAILPIT}/messages`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ IDs: messages.map(({ ID }) => ID) }),
            });
            return mail;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`No llegó a Mailpit el correo «${subject}»`);
}

/** Otro cliente del seed, para el pedido que no es nuestro. */
const OTHER_USER_ID = 5;

let addressId: number;
let stockBefore: number;
let lastAuditId: number;
let seriesBefore: { year: number; last_number: number }[];
const created: number[] = [];

/** Hace `ageHours` horas que el pedido nació y entró en su estado. */
interface SeedOrder {
    status: string;
    ageHours?: number;
    method?: 'Tarjeta' | 'Transferencia';
    blockedFrom?: string;
    userId?: number;
}

/** Id de un estado de pedido por su nombre. */
async function statusId(name: string): Promise<number> {
    const [row] = await sql<{ status_id: number }>(
        'SELECT status_id FROM order_statuses WHERE name = ?',
        [name],
    );
    return row.status_id;
}

/** Inserta un pedido (con una línea) y devuelve su id. */
async function seedOrder({
    status,
    ageHours = 2,
    method = 'Tarjeta',
    blockedFrom,
    userId = TEST_USER_ID,
}: SeedOrder): Promise<number> {
    const [{ price, tax_rate }] = await sql<{ price: string; tax_rate: string }>(
        `SELECT v.price, t.tax_rate FROM product_variants v
         JOIN products p ON p.product_id = v.product_id
         JOIN typologies t ON t.typology_id = p.typology_id WHERE v.variant_id = ?`,
        [VARIANT_ID],
    );
    const result = (await sql(
        `INSERT INTO orders (user_id, shipping_address_id, billing_address_id, payment_method,
             shipping_type_id, shipping_cost, total, status_id, blocked_from_status_id,
             status_updated_at, created_at)
         VALUES (?, ?, ?, ?, 1, 4.95, ?, ?, ?, NOW() - INTERVAL ? HOUR, NOW() - INTERVAL ? HOUR)`,
        [
            userId,
            addressId,
            addressId,
            method,
            (Number(price) * QUANTITY + 4.95).toFixed(2),
            await statusId(status),
            blockedFrom ? await statusId(blockedFrom) : null,
            ageHours,
            ageHours,
        ],
    )) as unknown as { insertId: number };
    const orderId = Number(result.insertId);
    await sql(
        'INSERT INTO order_products (order_id, variant_id, quantity, unit_price, tax_rate) VALUES (?, ?, ?, ?, ?)',
        [orderId, VARIANT_ID, QUANTITY, price, tax_rate],
    );
    created.push(orderId);
    return orderId;
}

/** Estado, quién anuló y motivo de un pedido, tal como están en la BD. */
async function orderRow(orderId: number) {
    const [row] = await sql<{
        status: string;
        cancelled_by: string | null;
        cancellation_type_id: number | null;
        blocked_from_status_id: number | null;
    }>(
        `SELECT s.name AS status, o.cancelled_by, o.cancellation_type_id, o.blocked_from_status_id
         FROM orders o JOIN order_statuses s ON s.status_id = o.status_id WHERE o.order_id = ?`,
        [orderId],
    );
    return row;
}

/** Stock actual de la presentación de las pruebas. */
async function stock(): Promise<number> {
    const [row] = await sql<{ stock: number }>(
        'SELECT stock FROM product_variants WHERE variant_id = ?',
        [VARIANT_ID],
    );
    return Number(row.stock);
}

/** Inicia sesión como administrador con la API de next-auth (solo para preparar la prueba). */
async function signInAsAdmin(context: BrowserContext): Promise<void> {
    const { csrfToken } = await (await context.request.get('/api/auth/csrf')).json();
    const response = await context.request.post('/api/auth/callback/credentials', {
        form: { csrfToken, email: 'admin@jotron.com', password: 'Admin1234', json: 'true' },
    });
    expect(response.ok()).toBeTruthy();
}

/** Año actual en la hora de la tienda: el de la serie de facturas. */
function shopYear(): number {
    return Number(
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric' }).format(
            new Date(),
        ),
    );
}

/** Abre una página privada y entra por el formulario de login, como lo haría una persona. */
async function signInAndOpen(page: Page, url: string): Promise<void> {
    await page.goto(url);
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/);
    await signInWithForm(page);
    await expect(page).toHaveURL(new RegExp(`${url.replace(/[?]/g, '\\?')}$`));
}

test.describe('Pedidos del cliente (RF8)', () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async () => {
        // Una dirección de envío para los pedidos de prueba (la del cliente no existe).
        const result = (await sql(
            `INSERT INTO addresses (user_id, phone, street_type, street_name, number, postal_code,
                 city, province, recipient_name)
             VALUES (?, '600123456', 'Calle', 'Larios', '12', '28014', 'Madrid', 'Madrid', 'Juan Moreno')`,
            [TEST_USER_ID],
        )) as unknown as { insertId: number };
        addressId = Number(result.insertId);
    });

    test.beforeEach(async ({ browser }) => {
        stockBefore = await stock();
        const [{ id }] = await sql<{ id: number }>(
            'SELECT COALESCE(MAX(audit_log_id), 0) AS id FROM audit_logs',
        );
        lastAuditId = Number(id);
        seriesBefore = await sql('SELECT year, last_number FROM invoice_series');
        context = await newDevice(browser);
        page = await context.newPage();
    });

    test.afterEach(async () => {
        await context.close();
        for (const orderId of created.splice(0)) {
            await sql('DELETE FROM invoices WHERE order_id = ?', [orderId]);
            await sql('DELETE FROM orders WHERE order_id = ?', [orderId]); // las líneas caen en cascada
        }
        // El contador de facturas vuelve a como estaba, y el NIF del cliente de prueba, a ninguno.
        await sql('DELETE FROM invoice_series');
        for (const { year, last_number } of seriesBefore)
            await sql('INSERT INTO invoice_series (year, last_number) VALUES (?, ?)', [
                year,
                last_number,
            ]);
        await sql('UPDATE users SET id_card = NULL WHERE user_id = ?', [TEST_USER_ID]);
        await sql('DELETE FROM audit_logs WHERE audit_log_id > ?', [lastAuditId]);
        await sql('UPDATE product_variants SET stock = ? WHERE variant_id = ?', [
            stockBefore,
            VARIANT_ID,
        ]);
    });

    test.afterAll(async () => {
        await sql('DELETE FROM addresses WHERE address_id = ?', [addressId]);
        const [{ n }] = await sql<{ n: number }>('SELECT COUNT(*) AS n FROM orders');
        if (Number(n) === 0) await sql('ALTER TABLE orders AUTO_INCREMENT = 1');
        await closeDb();
    });

    test('cancela un pedido en plazo: queda Anulado, devuelve el stock y quita los botones', async () => {
        const id = await seedOrder({ status: 'Confirmado', ageHours: 2 });
        await signInAndOpen(page, `/pedidos/${id}`);

        await expect(page.getByRole('heading', { name: `Pedido #PJ-${id}` })).toBeVisible();
        await expect(page.getByText('Puedes cancelar el pedido durante las 24 h')).toBeVisible();

        await page.getByRole('button', { name: 'Cancelar pedido' }).click();
        const dialog = page.getByRole('alertdialog');
        await expect(dialog.getByText('Esta acción no se puede deshacer')).toBeVisible();
        await dialog.getByRole('button', { name: 'Cancelar pedido' }).click();

        await expect(page.getByText('Pedido cancelado')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0);
        await expect(page.getByText('Anulado').first()).toBeVisible();
        // El seguimiento cuenta la cancelación: quién y cuándo.
        const timeline = page.getByRole('list', { name: 'Estado del pedido' }).first();
        await expect(timeline.getByText('Cancelado por ti')).toBeVisible();
        await expect(timeline.getByText(/\d{1,2} \w{3,4}, \d{2}:\d{2}/).last()).toBeVisible();

        const row = await orderRow(id);
        expect(row).toMatchObject({ status: 'Anulado', cancelled_by: 'Cliente' });
        expect(row.cancellation_type_id).not.toBeNull();
        expect(await stock()).toBe(stockBefore + QUANTITY);
        const audit = await sql<{ action: string }>(
            'SELECT action FROM audit_logs WHERE audit_log_id > ?',
            [lastAuditId],
        );
        expect(audit.map(({ action }) => action)).toContain(
            `Pedido PJ-${id}: Confirmado → Anulado`,
        );

        // Y el cliente recibe el correo de anulación (sin PaymentIntent no hay nada que devolver).
        const mail = await takeMail(`Pedido PJ-${id} anulado`);
        expect(mail.To[0].Address).toBe(TEST_USER.email);
        expect(mail.Text).toContain('ha sido anulado');
        expect(mail.Text).toContain('No se ha hecho ningún cargo');
    });

    test('"Volver" cierra el diálogo y no cancela nada', async () => {
        const id = await seedOrder({ status: 'Confirmado', ageHours: 2 });
        await signInAndOpen(page, `/pedidos/${id}`);

        await page.getByRole('button', { name: 'Cancelar pedido' }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Volver' }).click();

        await expect(page.getByRole('alertdialog')).toHaveCount(0);
        expect((await orderRow(id)).status).toBe('Confirmado');
        expect(await stock()).toBe(stockBefore);
    });

    test('pasadas las 24 h no hay botón y la API rechaza la cancelación', async () => {
        const id = await seedOrder({ status: 'Confirmado', ageHours: 30 });
        await signInAndOpen(page, `/pedidos/${id}`);

        await expect(page.getByRole('heading', { name: `Pedido #PJ-${id}` })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0);
        await expect(page.getByText('Puedes cancelar el pedido durante las 24 h')).toHaveCount(0);

        const response = await context.request.post(`/api/pedidos/${id}/cancelar`);
        expect(response.status()).toBe(409);
        expect((await orderRow(id)).status).toBe('Confirmado');
        expect(await stock()).toBe(stockBefore);
    });

    test('Pendiente de pago se puede cancelar aunque lleve días', async () => {
        const id = await seedOrder({
            status: 'Pendiente de pago',
            ageHours: 24 * 5,
            method: 'Transferencia',
        });
        await signInAndOpen(page, `/pedidos/${id}`);

        await expect(page.getByText('Estamos esperando tu transferencia')).toBeVisible();
        await page.getByRole('button', { name: 'Cancelar pedido' }).click();
        await page
            .getByRole('alertdialog')
            .getByRole('button', { name: 'Cancelar pedido' })
            .click();

        await expect(page.getByText('Pedido cancelado')).toBeVisible();
        expect((await orderRow(id)).status).toBe('Anulado');
        expect(await stock()).toBe(stockBefore + QUANTITY);
    });

    test('Bloqueado: aviso de revisión, sin Cancelar ni Factura, y la API lo rechaza', async () => {
        const id = await seedOrder({
            status: 'Bloqueado',
            ageHours: 24 * 3,
            blockedFrom: 'Confirmado',
        });
        await signInAndOpen(page, `/pedidos/${id}`);

        await expect(page.getByText('Tu pedido está en revisión')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: /Factura/ })).toHaveCount(0);

        expect((await context.request.post(`/api/pedidos/${id}/cancelar`)).status()).toBe(409);
        expect((await orderRow(id)).status).toBe('Bloqueado');
    });

    test('al entregar se emite la factura (correlativa, completa o simplificada) y el cliente la descarga', async ({
        browser,
    }) => {
        const year = shopYear();
        const first = await seedOrder({ status: 'Enviado', ageHours: 48 });
        const second = await seedOrder({ status: 'Enviado', ageHours: 48 });
        const notDelivered = await seedOrder({ status: 'Confirmado', ageHours: 2 });

        // Administración entrega el primer pedido: el cliente no tiene NIF → factura simplificada.
        const admin = await newDevice(browser);
        await signInAsAdmin(admin);
        const deliver = (id: number) =>
            admin.request.patch(`/api/admin/pedidos/${id}/estado`, {
                data: { status: 'Entregado' },
            });

        const r1 = await deliver(first);
        expect(r1.ok()).toBeTruthy();
        expect((await r1.json()).invoiceNumber).toBe(`F-${year}-0001`);

        // Con NIF, la siguiente es completa; la numeración sigue sin huecos.
        await sql('UPDATE users SET id_card = ? WHERE user_id = ?', ['12345678Z', TEST_USER_ID]);
        const r2 = await deliver(second);
        expect((await r2.json()).invoiceNumber).toBe(`F-${year}-0002`);

        const rows = await sql<{ order_id: number; number: string; kind: string; total: string }>(
            'SELECT order_id, number, kind, total FROM invoices WHERE order_id IN (?, ?) ORDER BY number',
            [first, second],
        );
        expect(rows.map(({ number, kind }) => [number, kind])).toEqual([
            [`F-${year}-0001`, 'Simplificada'],
            [`F-${year}-0002`, 'Completa'],
        ]);
        // El emisor se copia a la factura al emitirla: descargarla no vuelve a leer el entorno.
        const [frozen] = await sql<{ issuer: string }>(
            "SELECT JSON_UNQUOTE(JSON_EXTRACT(snapshot, '$.issuer.taxId')) AS issuer FROM invoices WHERE order_id = ?",
            [first],
        );
        expect(frozen.issuer).toBeTruthy();
        const [series] = await sql<{ last_number: number }>(
            'SELECT last_number FROM invoice_series WHERE year = ?',
            [year],
        );
        expect(Number(series.last_number)).toBe(2);

        // El cliente ve el botón, descarga el PDF y es de verdad un PDF con su número en el nombre.
        await signInAndOpen(page, `/pedidos/${first}`);
        const link = page.getByRole('link', { name: 'Factura (PDF)' });
        await expect(link).toBeVisible();
        const downloading = page.waitForEvent('download');
        await link.click();
        const download = await downloading;
        expect(download.suggestedFilename()).toBe(`F-${year}-0001.pdf`);
        const file = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of file) chunks.push(chunk as Buffer);
        expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe('%PDF-');

        // La factura es solo del dueño y solo de un pedido Entregado.
        expect((await admin.request.get(`/api/pedidos/${first}/factura`)).status()).toBe(404);
        const mine = await context.request.get(`/api/pedidos/${notDelivered}/factura`);
        expect(mine.status()).toBe(404);
        await admin.close();
    });

    test('Entregado sin factura emitida: el botón sale deshabilitado y no hay Cancelar', async () => {
        const id = await seedOrder({ status: 'Entregado', ageHours: 24 * 10 });
        await signInAndOpen(page, `/pedidos/${id}`);

        await expect(page.getByRole('button', { name: /Factura/ })).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0);
    });

    test('con sesión, la cabecera tiene "Mi cuenta" y lleva al historial', async () => {
        await signInAndOpen(page, '/cuenta/pedidos');
        await page.goto('/productos');

        await page.getByRole('link', { name: 'Mi cuenta' }).click();
        await expect(page).toHaveURL(/\/cuenta\/pedidos$/);
        await expect(page.getByRole('heading', { name: 'Historial de pedidos' })).toBeVisible();
    });

    test('un pedido de otra cuenta responde 404', async () => {
        const id = await seedOrder({ status: 'Confirmado', userId: OTHER_USER_ID });
        await signInAndOpen(page, '/cuenta/pedidos');

        const response = await page.goto(`/pedidos/${id}`);
        expect(response?.status()).toBe(404);
        expect((await context.request.post(`/api/pedidos/${id}/cancelar`)).status()).toBe(404);
        expect((await orderRow(id)).status).toBe('Confirmado');
    });

    test('el historial lista 10 por página, filtra por estado y enlaza al detalle', async () => {
        const ids: number[] = [];
        for (let i = 0; i < 11; i += 1) {
            ids.push(
                await seedOrder({ status: i < 3 ? 'Entregado' : 'Enviado', ageHours: 100 + i }),
            );
        }
        const last = ids[ids.length - 1];
        await signInAndOpen(page, '/cuenta/pedidos');

        await expect(page.getByRole('heading', { name: 'Historial de pedidos' })).toBeVisible();
        await expect(page.getByText(/Mostrando 1[–-]10 de 11/)).toBeVisible();
        await expect(page.locator('tbody tr')).toHaveCount(10);
        await expect(page.locator('tbody').getByText(`#PJ-${ids[0]}`)).toBeVisible();

        await page.getByRole('link', { name: 'Página 2' }).first().click();
        await expect(page).toHaveURL(/pagina=2/);
        await expect(page.locator('tbody tr')).toHaveCount(1);
        await expect(page.locator('tbody').getByText(`#PJ-${last}`)).toBeVisible();

        await page.goto('/cuenta/pedidos?estado=Entregado');
        await expect(page.locator('tbody tr')).toHaveCount(3);
        await expect(page.locator('tbody').getByText('Enviado')).toHaveCount(0);

        await page.getByRole('link', { name: `Ver pedido PJ-${ids[0]}` }).click();
        await expect(page).toHaveURL(new RegExp(`/pedidos/${ids[0]}$`));
        await expect(page.getByRole('heading', { name: `Pedido #PJ-${ids[0]}` })).toBeVisible();
    });
});
