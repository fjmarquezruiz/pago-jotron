import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { shippingTypes } from '@/db/schema';
import type { CatalogTx } from '@/lib/admin/catalog-api';

/** Todos los tipos de envío del panel (CU13), por id: son pocos, no se paginan. */
export async function getAdminShippingTypes() {
    return db
        .select({
            id: shippingTypes.id,
            name: shippingTypes.name,
            cost: shippingTypes.cost,
            minDeliveryDays: shippingTypes.minDeliveryDays,
            maxDeliveryDays: shippingTypes.maxDeliveryDays,
            isBlocked: shippingTypes.isBlocked,
        })
        .from(shippingTypes)
        .orderBy(asc(shippingTypes.id));
}

export type AdminShippingTypeRow = Awaited<ReturnType<typeof getAdminShippingTypes>>[number];

/** Valores que se guardan de un tipo de envío; el coste va como texto decimal (`'4.95'`). */
export interface ShippingTypeValues {
    name: string;
    cost: string;
    minDeliveryDays: number | null;
    maxDeliveryDays: number | null;
    isBlocked: boolean;
}

/** Inserta un tipo de envío y devuelve su id. Lanza `ER_DUP_ENTRY` si el nombre ya existe. */
export async function insertShippingType(tx: CatalogTx, values: ShippingTypeValues) {
    const [result] = await tx.insert(shippingTypes).values(values);
    return result.insertId;
}

/**
 * Lee un tipo de envío bloqueándolo (`SELECT … FOR UPDATE`).
 *
 * @returns La fila, o `null` si no existe.
 */
export async function lockShippingType(tx: CatalogTx, id: number) {
    const [row] = await tx
        .select()
        .from(shippingTypes)
        .where(eq(shippingTypes.id, id))
        .for('update');
    return row ?? null;
}

/**
 * Cuenta los demás tipos de envío activos (no bloqueados) bloqueando sus filas, para que dos
 * desactivaciones a la vez no dejen el checkout sin ninguno.
 *
 * @param excludedId - El que se desactiva, que no cuenta.
 */
export async function countOtherActiveShippingTypes(tx: CatalogTx, excludedId: number) {
    const rows = await tx
        .select({ id: shippingTypes.id })
        .from(shippingTypes)
        .where(and(eq(shippingTypes.isBlocked, false), ne(shippingTypes.id, excludedId)))
        .for('update');
    return rows.length;
}

/** Cambia los valores de un tipo de envío. Lanza `ER_DUP_ENTRY` si el nombre ya es de otro. */
export async function updateShippingTypeRow(tx: CatalogTx, id: number, values: ShippingTypeValues) {
    await tx.update(shippingTypes).set(values).where(eq(shippingTypes.id, id));
}
