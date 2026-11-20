'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    loadCheckoutData,
    type CheckoutAccountData,
    type CheckoutLoadFailure,
} from '@/lib/checkout/load';

/** Estado de la carga de los datos de la cuenta para el checkout. */
export type CheckoutDataState =
    | { status: 'loading' }
    | { status: 'error'; reason: CheckoutLoadFailure }
    | ({ status: 'ready' } & CheckoutAccountData);

/**
 * Carga las direcciones (`GET /api/cuenta/direcciones`) y el perfil (`GET /api/cuenta/perfil`) de
 * la cuenta para los pasos del checkout, sin caché y con tiempo máximo (`loadCheckoutData`).
 *
 * - `status: 'loading'` hasta que llegan las dos respuestas.
 * - `status: 'ready'` con `addresses` y `profile`.
 * - `status: 'error'` con `reason`: `'unauthorized'` si no hay sesión (401; las páginas ya van tras
 *   el middleware, así que solo pasa si la sesión caduca) y `'error'` para lo demás.
 *
 * `reload()` vuelve a pedir los datos (por ejemplo, tras crear una dirección, o en "Reintentar") y
 * pasa por `loading`. Al desmontar se cancela la petición en vuelo.
 *
 * @returns El estado y `reload`.
 *
 * @example
 * const { state, reload } = useCheckoutData();
 * if (state.status === 'ready') return <AddressCardGroup addresses={state.addresses} … />;
 */
export function useCheckoutData(): { state: CheckoutDataState; reload: () => void } {
    const [state, setState] = useState<CheckoutDataState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        void loadCheckoutData({ signal: controller.signal }).then((result) => {
            if (controller.signal.aborted) return;
            setState(
                result.ok
                    ? { status: 'ready', ...result.data }
                    : { status: 'error', reason: result.reason },
            );
        });
        return () => controller.abort();
    }, [attempt]);

    const reload = useCallback(() => {
        setState({ status: 'loading' });
        setAttempt((value) => value + 1);
    }, []);

    return { state, reload };
}
