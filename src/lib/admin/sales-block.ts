/**
 * Reglas del bloqueo de ventas (RF12, CU9, CU13). Funciones puras: sin base de datos ni red.
 *
 * Bloquear las ventas NO toca los pedidos ya hechos (están pagados y se sirven): el modal solo
 * avisa de los que siguen en curso. Poner un vino a la venta exige que su bodega y su D.O. lo estén.
 */
import { ORDER_STATUS as S, type OrderStatus } from '@/lib/orders/status';

/**
 * Estados de un pedido «en curso»: todavía no son finales ni están parados. Quedan fuera Entregado,
 * Anulado y Bloqueado.
 */
export const IN_PROGRESS_STATUSES = [
    S.PENDING,
    S.CONFIRMED,
    S.PROCESSING,
    S.PREPARED,
    S.SHIPPED,
] as const satisfies readonly OrderStatus[];

/** Qué se bloquea: decide la palabra del aviso («de esta bodega»). */
export type SalesBlockScope = 'product' | 'winery' | 'denomination';

/** Un pedido en curso afectado, como lo enseña la tabla del modal. */
export interface AffectedOrder {
    id: number;
    /** Número que se ve en el panel: `PJ-4521`. */
    number: string;
    status: OrderStatus;
}

/** Estado de venta de lo que rodea a un producto. */
export interface SalesParents {
    wineryBlocked: boolean;
    denominationBlocked: boolean;
}

/** Resultado de `canReleaseSales`. */
export type ReleaseCheck = { ok: true } | { ok: false; message: string };

/**
 * Dice si un producto puede ponerse a la venta: no si su bodega o su D.O. siguen bloqueadas.
 *
 * @param parents - Estado de su bodega y de su D.O.
 * @returns `{ ok: true }`, o el motivo en español para mostrarlo tal cual.
 *
 * @example
 * canReleaseSales({ wineryBlocked: true, denominationBlocked: false });
 * // { ok: false, message: 'No se puede poner a la venta: su bodega tiene las ventas bloqueadas' }
 */
export function canReleaseSales({
    wineryBlocked,
    denominationBlocked,
}: SalesParents): ReleaseCheck {
    if (wineryBlocked && denominationBlocked)
        return {
            ok: false,
            message:
                'No se puede poner a la venta: su bodega y su denominación de origen tienen las ventas bloqueadas',
        };
    if (wineryBlocked)
        return {
            ok: false,
            message: 'No se puede poner a la venta: su bodega tiene las ventas bloqueadas',
        };
    if (denominationBlocked)
        return {
            ok: false,
            message:
                'No se puede poner a la venta: su denominación de origen tiene las ventas bloqueadas',
        };
    return { ok: true };
}

/** Palabra con la que el aviso nombra lo que se bloquea. */
const SCOPE_TEXT: Record<SalesBlockScope, string> = {
    product: 'este producto',
    winery: 'esta bodega',
    denomination: 'esta denominación',
};

/**
 * Frase del aviso del modal de bloqueo: cuántos pedidos en curso afecta y que siguen su curso.
 * Devuelve las partes para pintar el número en negrita.
 *
 * @param count - Pedidos en curso afectados.
 * @param scope - Qué se bloquea.
 * @returns `null` si no hay ninguno (no hay aviso).
 */
export function affectedOrdersNotice(
    count: number,
    scope: SalesBlockScope,
): { before: string; strong: string; after: string } | null {
    if (count <= 0) return null;
    const strong = count === 1 ? '1 pedido en curso' : `${count} pedidos en curso`;
    const target = scope === 'product' ? 'este producto' : `productos de ${SCOPE_TEXT[scope]}`;
    return {
        before: 'Hay ',
        strong,
        after: ` con ${target}: no cambian y seguirán su curso.`,
    };
}
