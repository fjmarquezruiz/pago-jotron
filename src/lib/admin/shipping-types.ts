/**
 * Reglas puras de los tipos de envío del panel (CU13): cómo se numeran, cómo se rotula su estado y
 * cuándo se puede desactivar uno. Sin acceso a la BD, para poder probarlas.
 */
import { entityNumber } from '@/lib/admin/catalog';
import { formatBusinessDeliveryTime } from '@/lib/catalog/shipping';
import { formatEuros } from '@/lib/utils';

/** Ruta del listado de tipos de envío. */
export const ADMIN_SHIPPING_PATH = '/admin/envios';

/**
 * Id de un tipo de envío como se enseña: `ENV-001`. No hay columna: se deriva del id.
 *
 * @param id - `shipping_types.shipping_type_id`.
 */
export function shippingTypeNumber(id: number): string {
    return entityNumber('ENV', id);
}

/**
 * Etiqueta del estado de un tipo de envío (Figma: Estado de admin-shipping-types-list). La tabla
 * guarda `is_blocked`; el diseño dice «Activo» y el bloqueado se rotula «Bloqueado».
 *
 * @param isBlocked - `is_blocked` de la fila.
 */
export function shippingStatusLabel(isBlocked: boolean): string {
    return isBlocked ? 'Bloqueado' : 'Activo';
}

/**
 * Plazo de entrega de la tabla: `3-5 días laborables`, `1 día laborable`; la recogida, que no tiene
 * plazo, se pinta como `—` (Figma: Table Data Cell, tipo vacío).
 *
 * @param min - `min_delivery_days`.
 * @param max - `max_delivery_days`.
 */
export function shippingDeliveryText(min: number | null, max: number | null): string {
    return formatBusinessDeliveryTime(min, max) ?? '—';
}

/**
 * Precio de la tabla: `4,95 €`.
 *
 * @param cost - `shipping_types.cost`, como texto decimal.
 */
export function shippingPriceText(cost: string): string {
    return formatEuros(cost);
}

/**
 * Dice si se puede desactivar un tipo de envío: debe quedar al menos otro activo, o el checkout se
 * quedaría sin modalidades que ofrecer.
 *
 * @param otherActiveCount - Tipos de envío activos SIN contar el que se desactiva.
 * @returns `true` si queda al menos uno activo.
 */
export function canDeactivateShipping(otherActiveCount: number): boolean {
    return otherActiveCount >= 1;
}
