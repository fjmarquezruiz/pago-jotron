import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Resultados de las lecturas de la transacción, en el orden en que `updateProduct` las hace. */
let reads: unknown[][] = [];
const writes: { op: string; values?: unknown }[] = [];
const audits: unknown[] = [];
let duplicate: Error | null = null;

/** Consulta falsa: cualquier método encadenado devuelve la misma y, al esperarla, saca la siguiente lectura. */
function chain(op: string) {
    const query: Record<string, unknown> = {};
    for (const method of ['from', 'where', 'for', 'set', 'values', 'orderBy', 'limit'])
        query[method] = (values?: unknown) => {
            if (method === 'set' || method === 'values') writes.push({ op, values });
            return query;
        };
    query.then = (resolve: (value: unknown) => void, reject: (error: unknown) => void) => {
        if (duplicate && op !== 'select') return reject(duplicate);
        return resolve(op === 'select' ? (reads.shift() ?? []) : [{ insertId: 99 }]);
    };
    return query;
}
const tx = {
    select: () => chain('select'),
    insert: () => chain('insert'),
    update: () => chain('update'),
    delete: () => chain('delete'),
};
vi.mock('@/lib/admin/catalog-api', () => ({
    auditedCatalogChange: async (
        work: (tx: unknown) => Promise<{ result: unknown; audit: unknown }>,
    ) => {
        const { result, audit } = await work(tx);
        audits.push(audit);
        return result;
    },
}));

import { createProduct, setProductBlocked, updateProduct } from './admin-products-write';
import type { ProductFormValues } from '@/lib/validations/admin-products';

const actor = { id: 7, role: 'Editor' as const };

const form = (stock: number, loadedStock: number) =>
    ({
        name: 'Jotrón Reserva',
        wineryId: 1,
        guaranteeOfOriginId: 1,
        typologyId: 1,
        vintage: 2019,
        description: '',
        image: null,
        grapes: [],
        variants: [
            {
                variantId: 10,
                format: 'Botella',
                capacity: 750,
                capacityUnit: 'ml',
                price: 24.5,
                stock,
                loadedStock,
                isBlocked: false,
            },
        ],
    }) as ProductFormValues;

const product = {
    id: 5,
    name: 'Jotrón Reserva',
    wineryId: 1,
    guaranteeOfOriginId: 1,
    typologyId: 1,
    vintage: 2019,
    description: null,
    image: null,
};
const variantRow = (stock: number) => ({
    id: 10,
    productId: 5,
    format: 'Botella',
    capacity: 750,
    capacityUnit: 'ml',
    price: '24.50',
    stock,
    isBlocked: false,
});
/** Lecturas de un guardado: producto, bodega, D.O., tipología, presentaciones y uvas. */
const readsFor = (currentStock: number) => [
    [product],
    [{ id: 1 }],
    [{ id: 1 }],
    [{ id: 1 }],
    [variantRow(currentStock)],
    [],
];
const stockWrites = () =>
    writes.filter(
        (w) =>
            w.op === 'update' && (w.values as { stock?: number } | undefined)?.stock !== undefined,
    );

beforeEach(() => {
    reads = [];
    writes.length = 0;
    audits.length = 0;
    duplicate = null;
});

describe('updateProduct: control optimista del stock', () => {
    it('escribe el stock nuevo si el leído no ha cambiado', async () => {
        reads = readsFor(10);
        const result = await updateProduct(actor, 5, form(15, 10));
        expect(result).toEqual({ ok: true, value: { changed: true } });
        expect(stockWrites()).toHaveLength(1);
        expect(stockWrites()[0].values).toMatchObject({ stock: 15 });
        expect(audits[0]).toMatchObject({ entity: 'product', id: 5, changes: ['presentaciones'] });
    });
    it('409 y no guarda nada si el stock cambió mientras se editaba', async () => {
        reads = readsFor(8); // una compra lo bajó de 10 a 8
        const result = await updateProduct(actor, 5, form(15, 10));
        expect(result).toMatchObject({ ok: false, code: 'stock_conflict' });
        expect(writes).toHaveLength(0);
        expect(audits[0]).toBeNull();
    });
    it('no toca el stock si el formulario no lo cambió, aunque la fila ya sea otra', async () => {
        reads = readsFor(8); // una compra lo bajó de 10 a 8; el formulario solo cambia el precio
        const input = form(10, 10);
        input.variants[0].price = 30;
        const result = await updateProduct(actor, 5, input);
        expect(result).toEqual({ ok: true, value: { changed: true } });
        expect(stockWrites()).toHaveLength(0);
    });
    it('sin cambios no deja asiento', async () => {
        reads = readsFor(10);
        const result = await updateProduct(actor, 5, form(10, 10));
        expect(result).toEqual({ ok: true, value: { changed: false } });
        expect(audits[0]).toBeNull();
    });
    it('rechaza una presentación que no es del producto o sin loadedStock', async () => {
        reads = readsFor(10);
        const foreign = form(10, 10);
        foreign.variants[0].variantId = 99;
        expect(await updateProduct(actor, 5, foreign)).toMatchObject({
            ok: false,
            code: 'invalid_variant',
        });
        reads = readsFor(10);
        const blind = form(10, 10);
        delete blind.variants[0].loadedStock;
        expect(await updateProduct(actor, 5, blind)).toMatchObject({
            ok: false,
            code: 'invalid_variant',
        });
    });
    it('404 si el producto no existe', async () => {
        reads = [[]];
        expect(await updateProduct(actor, 5, form(10, 10))).toMatchObject({
            ok: false,
            code: 'not_found',
        });
    });
    it('400 si la bodega no existe', async () => {
        reads = [[product], []];
        expect(await updateProduct(actor, 5, form(10, 10))).toMatchObject({
            ok: false,
            code: 'invalid_reference',
        });
    });
});

describe('createProduct', () => {
    it('crea con slug de nombre y añada y deja el asiento «creado»', async () => {
        reads = [[{ id: 1 }], [{ id: 1 }], [{ id: 1 }]];
        const input = form(5, 0);
        input.variants[0].variantId = undefined;
        delete input.variants[0].loadedStock;
        const result = await createProduct(actor, input);
        expect(result).toEqual({ ok: true, value: { id: 99, slug: 'jotron-reserva-2019' } });
        expect(writes[0].values).toMatchObject({ slug: 'jotron-reserva-2019' });
        expect(audits[0]).toMatchObject({ entity: 'product', id: 99, changes: ['creado'] });
    });
    it('409 si el slug ya existe', async () => {
        reads = [[{ id: 1 }], [{ id: 1 }], [{ id: 1 }]];
        duplicate = Object.assign(new Error("Duplicate entry 'x' for key 'products.slug'"), {
            code: 'ER_DUP_ENTRY',
        });
        expect(await createProduct(actor, form(5, 0))).toMatchObject({
            ok: false,
            code: 'slug_taken',
        });
    });
});

describe('setProductBlocked', () => {
    it('bloquea y anota «ventas bloqueadas»', async () => {
        reads = [[{ name: 'Jotrón', isBlocked: false }]];
        expect(await setProductBlocked(actor, 5, true)).toEqual({
            ok: true,
            value: { changed: true },
        });
        expect(audits[0]).toMatchObject({ changes: ['ventas bloqueadas'] });
    });
    it('no cambia ni anota nada si ya estaba así', async () => {
        reads = [[{ name: 'Jotrón', isBlocked: true }]];
        expect(await setProductBlocked(actor, 5, true)).toEqual({
            ok: true,
            value: { changed: false },
        });
        expect(audits[0]).toBeNull();
        expect(writes).toHaveLength(0);
    });
    it('404 si no existe', async () => {
        reads = [[]];
        expect(await setProductBlocked(actor, 5, true)).toMatchObject({
            ok: false,
            code: 'not_found',
        });
    });
});
