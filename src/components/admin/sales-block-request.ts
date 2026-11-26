import type { AffectedOrder } from '@/lib/admin/sales-block';

/** Resultado de pedir los pedidos en curso que afecta un bloqueo. */
export type AffectedOrdersOutcome = { kind: 'ok'; orders: AffectedOrder[] } | { kind: 'error' };

/**
 * Pide al servidor los pedidos en curso con productos de lo que se va a bloquear (producto, bodega
 * o D.O.). Solo lectura. Nunca lanza.
 *
 * @param url - `GET` de la ruta: `/api/admin/bodegas/3/ventas`, `/api/admin/productos/5/estado`…
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns Los pedidos, o `error` si falla la red o la respuesta no es la esperada.
 */
export async function fetchAffectedOrders(
    url: string,
    request: typeof fetch = fetch,
): Promise<AffectedOrdersOutcome> {
    try {
        const response = await request(url, { cache: 'no-store' });
        if (!response.ok) return { kind: 'error' };
        const body = (await response.json().catch(() => null)) as { orders?: unknown } | null;
        if (!Array.isArray(body?.orders)) return { kind: 'error' };
        return { kind: 'ok', orders: body.orders as AffectedOrder[] };
    } catch {
        return { kind: 'error' };
    }
}
