'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    loadConfirmationOrder,
    type OrderLoadFailure,
    type OrderLoadResult,
} from '@/lib/checkout/order-load';

/** Estado de la carga del pedido de la confirmación. */
export type ConfirmationOrderState =
    | { status: 'loading' }
    | { status: 'error'; reason: OrderLoadFailure }
    | (Extract<OrderLoadResult, { ok: true }> & { status: 'ready' });

/**
 * Carga el pedido (`GET /api/pedidos/[id]`) y el perfil de la cuenta para la página Confirmar, sin
 * caché y con tiempo máximo (`loadConfirmationOrder`).
 *
 * - `status: 'loading'` hasta que llega la respuesta.
 * - `status: 'ready'` con `order` y `profile` (este puede ser `null`).
 * - `status: 'error'` con `reason`: `'unauthorized'` (401), `'not-found'` (no existe o es de otra
 *   cuenta) y `'error'` para lo demás.
 *
 * `reload()` vuelve a pedirlo ("Reintentar"). Al desmontar se cancela la petición en vuelo.
 *
 * @param orderId - Id del pedido (`?pedido=`).
 * @returns El estado y `reload`.
 *
 * @example
 * const { state, reload } = useConfirmationOrder(4521);
 */
export function useConfirmationOrder(orderId: number): {
    state: ConfirmationOrderState;
    reload: () => void;
} {
    const [state, setState] = useState<ConfirmationOrderState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        void loadConfirmationOrder(orderId, { signal: controller.signal }).then((result) => {
            if (controller.signal.aborted) return;
            setState(
                result.ok
                    ? { status: 'ready', ...result }
                    : { status: 'error', reason: result.reason },
            );
        });
        return () => controller.abort();
    }, [orderId, attempt]);

    const reload = useCallback(() => {
        setState({ status: 'loading' });
        setAttempt((value) => value + 1);
    }, []);

    return { state, reload };
}
