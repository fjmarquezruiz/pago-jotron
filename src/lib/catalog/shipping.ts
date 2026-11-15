import { formatEuros } from '@/lib/utils';

/** Lo que la ficha necesita de una modalidad de envío (fila de `shipping_types`). */
export interface ShippingOptionInput {
    name: string;
    /** Coste en euros: los `decimal` llegan como texto desde Drizzle. */
    cost: string;
    minDeliveryDays: number | null;
    maxDeliveryDays: number | null;
}

/**
 * Plazo de entrega como texto: `1 día`, `3-5 días`. Si solo hay un extremo, se usa ese número.
 *
 * @param min - Días mínimos de entrega, o `null`.
 * @param max - Días máximos de entrega, o `null`.
 * @returns El plazo, o `null` si la modalidad no tiene plazo (por ejemplo, la recogida en bodega).
 *
 * @example
 * formatDeliveryTime(3, 5); // '3-5 días'
 */
export function formatDeliveryTime(min: number | null, max: number | null): string | null {
    const from = min ?? max;
    const to = max ?? min;
    if (from === null || to === null) return null;
    if (from === to) return `${from} ${from === 1 ? 'día' : 'días'}`;
    return `${from}-${to} días`;
}

/**
 * Línea de una modalidad de envío para la ficha: nombre, plazo y precio. Un coste de 0 se pinta
 * como "gratis" y una modalidad sin plazo no lo muestra.
 *
 * @param option - La modalidad de envío tal como sale de la BD.
 * @returns El texto, por ejemplo `Envío estándar: 3-5 días (4,95 €).`
 *
 * @example
 * formatShippingOption({ name: 'Recogida en bodega', cost: '0.00', minDeliveryDays: null, maxDeliveryDays: null });
 * // 'Recogida en bodega (gratis).'
 */
export function formatShippingOption({
    name,
    cost,
    minDeliveryDays,
    maxDeliveryDays,
}: ShippingOptionInput): string {
    const price = Number(cost) === 0 ? 'gratis' : formatEuros(cost);
    const time = formatDeliveryTime(minDeliveryDays, maxDeliveryDays);
    return `${name}${time ? `: ${time}` : ''} (${price}).`;
}
