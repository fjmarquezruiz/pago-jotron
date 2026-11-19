/**
 * Avisos al usuario por los cambios que `reconcileCart` hace en el carrito (RF6), como función
 * pura: solo convierte la lista de cambios en frases, no toca el carrito ni el almacén.
 */
import { formatPresentation } from '@/lib/catalog/presentation';
import type { CartChange } from './reconcile';

/** Lo que se necesita de una línea del servidor para nombrarla en un aviso. */
export interface NoticeLine {
    variantId: number;
    name: string;
    format: string;
    capacity: number;
    capacityUnit: 'ml' | 'g';
}

/**
 * Convierte los cambios del carrito en los avisos que ve el usuario.
 *
 * - Un `sold-out` o un `clamped` de una línea conocida (está en `lines`) tiene su propio aviso,
 *   con el nombre y la presentación. Van en el orden de `changes`.
 * - Las `unavailable` no se nombran, y un `sold-out` o `clamped` cuya línea no está en `lines` se
 *   trata igual que ellas: se agrupan en un solo aviso, al final, que dice cuántos productos se
 *   han quitado.
 *
 * @param changes - Los cambios que devolvió `reconcileCart`.
 * @param lines - Datos de las líneas del servidor para nombrarlas.
 * @returns Los avisos, o una lista vacía si no hay cambios.
 *
 * @example
 * describeChanges(
 *     [{ type: 'removed', variantId: 4, reason: 'sold-out' }],
 *     [{ variantId: 4, name: 'Jotrón Tinto Roble', format: 'Botella', capacity: 750, capacityUnit: 'ml' }],
 * );
 * // ['«Jotrón Tinto Roble» (Botella 75 cl) se ha agotado y lo hemos quitado de tu carrito.']
 */
export function describeChanges(
    changes: readonly CartChange[],
    lines: readonly NoticeLine[],
): string[] {
    const lineByVariant = new Map(lines.map((line) => [line.variantId, line]));

    const notices: string[] = [];
    let unnamed = 0;
    for (const change of changes) {
        const line = lineByVariant.get(change.variantId);
        if (!line || (change.type === 'removed' && change.reason === 'unavailable')) {
            unnamed += 1;
            continue;
        }

        const label = `«${line.name}» (${formatPresentation(line)})`;
        if (change.type === 'removed') {
            notices.push(`${label} se ha agotado y lo hemos quitado de tu carrito.`);
        } else {
            const left =
                change.to === 1 ? 'Solo queda 1 unidad' : `Solo quedan ${change.to} unidades`;
            notices.push(`${left} de ${label}: hemos ajustado la cantidad.`);
        }
    }

    if (unnamed === 1) {
        notices.push('Hemos quitado de tu carrito un producto que ya no está disponible.');
    } else if (unnamed > 1) {
        notices.push(
            `Hemos quitado de tu carrito ${unnamed} productos que ya no están disponibles.`,
        );
    }
    return notices;
}
