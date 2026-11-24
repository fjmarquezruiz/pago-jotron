import type { OrderStatus } from '@/lib/orders/status';

/** Resultado de pedir un cambio de estado a `PATCH /api/admin/pedidos/[id]/estado`. */
export type ChangeStatusOutcome =
    /** Hecho. `refund` dice qué pasó con el dinero al anular; `invoiceNumber`, la factura emitida al entregar. */
    | {
          kind: 'changed';
          refund: 'none' | 'done' | 'failed';
          invoiceNumber: string | null;
      }
    /** La API lo rechazó (409 transición no permitida o cambio simultáneo; 400 motivo no válido). */
    | { kind: 'rejected'; message: string }
    /** Cualquier otro fallo (sin red, sesión caducada, 500). */
    | { kind: 'error' };

/**
 * Pide a la API de administración que cambie el estado de un pedido. Las reglas las comprueba el
 * servidor; aquí solo se interpreta la respuesta.
 *
 * @param orderId - `orders.order_id`.
 * @param status - Estado al que pasa.
 * @param cancellationTypeId - Motivo (`cancellation_types`), obligatorio al anular.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El resultado, sin lanzar nunca.
 */
export async function changeStatusRequest(
    orderId: number,
    status: OrderStatus,
    cancellationTypeId?: number,
    request: typeof fetch = fetch,
): Promise<ChangeStatusOutcome> {
    try {
        const response = await request(`/api/admin/pedidos/${orderId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, cancellationTypeId }),
        });
        const body = (await response.json().catch(() => null)) as {
            message?: unknown;
            refund?: unknown;
            invoiceNumber?: unknown;
        } | null;
        if (response.ok)
            return {
                kind: 'changed',
                refund: body?.refund === 'done' || body?.refund === 'failed' ? body.refund : 'none',
                invoiceNumber: typeof body?.invoiceNumber === 'string' ? body.invoiceNumber : null,
            };
        if (
            (response.status === 409 || response.status === 400) &&
            typeof body?.message === 'string'
        )
            return { kind: 'rejected', message: body.message };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}
