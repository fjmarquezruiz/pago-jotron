import { asc, eq } from 'drizzle-orm';
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
 * Ids de los tipos de envío activos (no bloqueados), en orden y bloqueando sus filas
 * (`SELECT … FOR UPDATE`). Se llama ANTES de bloquear la fila concreta: así todas las peticiones
 * toman los bloqueos en el mismo orden y dos desactivaciones a la vez no se cruzan en un deadlock
 * ni dejan el checkout sin ninguno.
 */
export async function lockActiveShippingTypeIds(tx: CatalogTx): Promise<number[]> {
    const rows = await tx
        .select({ id: shippingTypes.id })
        .from(shippingTypes)
        .where(eq(shippingTypes.isBlocked, false))
        .orderBy(asc(shippingTypes.id))
        .for('update');
    return rows.map(({ id }) => id);
}

/** Cambia los valores de un tipo de envío. Lanza `ER_DUP_ENTRY` si el nombre ya es de otro. */
export async function updateShippingTypeRow(tx: CatalogTx, id: number, values: ShippingTypeValues) {
    await tx.update(shippingTypes).set(values).where(eq(shippingTypes.id, id));
}
