import { priceToCents } from '@/lib/cart/totals';
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

/**
 * La modalidad de envío más barata de las que tienen plazo de entrega: excluye la recogida en
 * bodega, que no lo tiene (`minDeliveryDays` y `maxDeliveryDays` nulos). Compara los costes en
 * céntimos enteros. Si hay empate de coste, gana el menor plazo máximo (el mayor de los dos
 * extremos; si falta uno, vale el otro) y, después, el menor plazo mínimo (un mínimo nulo cuenta
 * 0). Si aún empatan, la primera en el orden recibido.
 *
 * @param options - Las modalidades de envío, tal como salen de la BD.
 * @returns La modalidad elegida, o `null` si ninguna tiene plazo de entrega (o no hay ninguna).
 * @throws {RangeError} Si el coste de una modalidad con plazo no es un importe válido.
 *
 * @example
 * cheapestDelivery([
 *     { name: 'Envío exprés 24 h', cost: '9.95', minDeliveryDays: 1, maxDeliveryDays: 1 },
 *     { name: 'Envío estándar', cost: '4.95', minDeliveryDays: 3, maxDeliveryDays: 5 },
 *     { name: 'Recogida en bodega', cost: '0.00', minDeliveryDays: null, maxDeliveryDays: null },
 * ]);
 * // el envío estándar: la recogida no tiene plazo y el exprés es más caro
 */
export function cheapestDelivery<T extends ShippingOptionInput>(options: readonly T[]): T | null {
    let best: { option: T; cents: number; maxDays: number; minDays: number } | null = null;
    for (const option of options) {
        const { minDeliveryDays: min, maxDeliveryDays: max } = option;
        if (min === null && max === null) continue;

        const candidate = {
            option,
            cents: priceToCents(option.cost),
            maxDays: max ?? min ?? 0,
            minDays: min ?? 0,
        };
        // Solo reemplaza si es estrictamente mejor: en un empate total se queda la primera.
        if (
            best === null ||
            candidate.cents < best.cents ||
            (candidate.cents === best.cents &&
                (candidate.maxDays < best.maxDays ||
                    (candidate.maxDays === best.maxDays && candidate.minDays < best.minDays)))
        ) {
            best = candidate;
        }
    }
    return best?.option ?? null;
}

/**
 * Las modalidades de envío que se ofrecen en el checkout: las que tienen plazo de entrega. Deja
 * fuera la recogida en bodega (`minDeliveryDays` y `maxDeliveryDays` nulos), igual que
 * `cheapestDelivery`. Conserva el orden recibido.
 *
 * @param options - Las modalidades de envío, tal como salen de la BD.
 * @returns Las que tienen plazo; vacío si ninguna.
 *
 * @example
 * deliveryOptions([
 *     { name: 'Envío estándar', cost: '4.95', minDeliveryDays: 3, maxDeliveryDays: 5 },
 *     { name: 'Recogida en bodega', cost: '0.00', minDeliveryDays: null, maxDeliveryDays: null },
 * ]);
 * // solo el envío estándar
 */
export function deliveryOptions<T extends ShippingOptionInput>(options: readonly T[]): T[] {
    return options.filter(
        ({ minDeliveryDays, maxDeliveryDays }) =>
            minDeliveryDays !== null || maxDeliveryDays !== null,
    );
}

/**
 * Plazo de entrega en días laborables, como lo dibuja el resumen del checkout: `1 día laborable`,
 * `3-5 días laborables`.
 *
 * @param min - Días mínimos de entrega, o `null`.
 * @param max - Días máximos de entrega, o `null`.
 * @returns El plazo, o `null` si la modalidad no tiene plazo.
 *
 * @example
 * formatBusinessDeliveryTime(3, 5); // '3-5 días laborables'
 */
export function formatBusinessDeliveryTime(min: number | null, max: number | null): string | null {
    const time = formatDeliveryTime(min, max);
    if (time === null) return null;
    return time === '1 día' ? '1 día laborable' : `${time} laborables`;
}

/**
 * Nombre de una modalidad con su precio entre paréntesis, para el selector de envío y la fila
 * "Envío" de la confirmación. Un coste de 0 se pinta como "gratis".
 *
 * @param option - Nombre y coste (en euros, como texto) de la modalidad.
 * @returns El texto, por ejemplo `Envío estándar (4,95 €)`.
 *
 * @example
 * formatShippingChoice({ name: 'Envío estándar', cost: '4.95' }); // 'Envío estándar (4,95 €)'
 */
export function formatShippingChoice({
    name,
    cost,
}: Pick<ShippingOptionInput, 'name' | 'cost'>): string {
    return `${name} (${Number(cost) === 0 ? 'gratis' : formatEuros(cost)})`;
}
