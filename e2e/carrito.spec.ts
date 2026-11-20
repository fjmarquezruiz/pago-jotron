import { expect, test } from '@playwright/test';
import {
    PRODUCT,
    addFromProductPage,
    clearServerCart,
    newDevice,
    signInWithForm,
    storedCart,
} from './support';

/**
 * RF6: el carrito del cliente se guarda en su cuenta, se recupera en cualquier dispositivo y, al
 * iniciar sesión, se fusiona con el que tenía como anónimo. Aquí no se simula nada: son el
 * navegador, la app, la API, next-auth y la BD (MySQL) de verdad.
 */
test.describe('RF6: el carrito del cliente', () => {
    test.beforeAll(async ({ browser }) => {
        await clearServerCart(browser);
    });
    test.afterAll(async ({ browser }) => {
        await clearServerCart(browser);
    });

    test('lo que añado como anónimo sigue ahí al iniciar sesión, en otro dispositivo y tras cerrarla', async ({
        browser,
    }) => {
        const device = await newDevice(browser);
        const page = await device.newPage();

        // 1. Anónimo: añado un vino desde su ficha. El carrito vive solo en este navegador.
        await page.goto(`/productos/${PRODUCT.slug}`);
        await addFromProductPage(page);
        await expect(page.getByRole('link', { name: /^Carrito \([1-9]\d*\)$/ })).toBeVisible();
        const anonymous = await storedCart(page);
        expect(anonymous.owner).toBeNull();
        expect(anonymous.items).toHaveLength(1);

        // 2. Lo veo en el carrito. "Continuar" sin sesión pide iniciarla y vuelve a /checkout.
        await page.goto('/carrito');
        await expect(page.locator('tbody tr')).toHaveCount(1);
        // Solo en la tabla: "También te puede gustar" es al azar y puede llevar el mismo vino.
        await expect(page.locator('tbody').getByRole('link', { name: PRODUCT.name })).toHaveCount(
            1,
        );
        await page.getByRole('link', { name: /^Continuar/ }).click();
        await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fcheckout$/);

        // 3. Inicio sesión con el formulario: el carrito anónimo pasa a ser el de la cuenta.
        await signInWithForm(page);
        await expect(page).toHaveURL(/\/checkout$/);
        await expect(page.getByRole('heading', { name: 'Información de contacto' })).toBeVisible();

        await page.goto('/carrito');
        await expect(page.locator('tbody tr')).toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();

        // 4. Está guardado en el servidor, no solo en el navegador: lo dice la API, con la sesión.
        const saved = await (await page.request.get('/api/carrito')).json();
        expect(saved.userId).not.toBeNull();
        expect(saved.items).toEqual(anonymous.items);
        expect(await storedCart(page)).toEqual({ items: anonymous.items, owner: saved.userId });

        // 5. Otro dispositivo (sin nada guardado): al iniciar sesión recupera el mismo carrito.
        const other = await newDevice(browser);
        const otherPage = await other.newPage();
        expect(await (await other.request.get('/api/carrito')).json()).toEqual({
            userId: null,
            items: [],
        });
        await otherPage.goto('/auth/login?callbackUrl=%2Fcarrito');
        await signInWithForm(otherPage);
        await expect(otherPage).toHaveURL(/\/carrito$/);
        await expect(otherPage.locator('tbody tr')).toHaveCount(1);
        expect(await storedCart(otherPage)).toEqual({
            items: anonymous.items,
            owner: saved.userId,
        });
        await other.close();

        // 6. Cierro sesión: el navegador queda sin carrito (el siguiente visitante no lo ve)…
        await page.getByRole('button', { name: 'Cerrar sesión' }).click();
        await expect(page).toHaveURL(/\/productos$/);
        await expect(page.getByRole('link', { name: 'Carrito (0)' })).toBeVisible();
        expect(await storedCart(page)).toEqual({ items: [], owner: null });

        // 7. …pero el de la cuenta sigue guardado: vuelvo a entrar y está.
        await page.goto('/auth/login?callbackUrl=%2Fcarrito');
        await signInWithForm(page);
        await expect(page).toHaveURL(/\/carrito$/);
        await expect(page.locator('tbody tr')).toHaveCount(1);
        expect((await storedCart(page)).items).toEqual(anonymous.items);

        await device.close();
    });
});
