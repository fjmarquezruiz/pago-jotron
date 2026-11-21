/** Resultado de pedir la cancelación de un pedido a `POST /api/pedidos/[id]/cancelar`. */
export type CancelOrderOutcome =
    /** Cancelado. `refund` dice qué pasó con el dinero (`failed`: anulado, reembolso por reintentar). */
    | { kind: 'cancelled'; refund: 'none' | 'done' | 'failed' }
    /** La API lo rechazó con 409: plazo vencido, estado que no lo permite o pedido cambiado a la vez. */
    | { kind: 'rejected'; message: string }
    /** Cualquier otro fallo (sin red, sesión caducada, 500). */
    | { kind: 'error' };

/**
 * Pide al servidor que cancele el pedido del cliente. El plazo y el dueño los comprueba el
 * servidor; aquí solo se interpreta la respuesta.
 *
 * @param orderId - `orders.order_id`.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El resultado, sin lanzar nunca.
 *
 * @example
 * const outcome = await cancelOrderRequest(5);
 * if (outcome.kind === 'cancelled') toast.success('Pedido cancelado');
 */
export async function cancelOrderRequest(
    orderId: number,
    request: typeof fetch = fetch,
): Promise<CancelOrderOutcome> {
    try {
        const response = await request(`/api/pedidos/${orderId}/cancelar`, { method: 'POST' });
        const body = (await response.json().catch(() => null)) as {
            message?: unknown;
            refund?: unknown;
        } | null;
        if (response.ok) {
            const refund =
                body?.refund === 'done' || body?.refund === 'failed' ? body.refund : 'none';
            return { kind: 'cancelled', refund };
        }
        if (response.status === 409 && typeof body?.message === 'string')
            return { kind: 'rejected', message: body.message };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}
