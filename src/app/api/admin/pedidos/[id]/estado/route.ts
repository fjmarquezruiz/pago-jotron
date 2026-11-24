import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/require-role';
import { changeOrderStatus } from '@/lib/orders/change-status';
import { ORDER_STATUS } from '@/lib/orders/status';
import { CHANGE_STATUS_HTTP } from '@/lib/orders/status-http';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/** Respuesta JSON que ningún navegador ni intermediario guarda. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

const bodySchema = z.object({
    status: z.enum(Object.values(ORDER_STATUS) as [string, ...string[]]),
    cancellationTypeId: z.number().int().min(1).max(MAX_ID).optional(),
});

/**
 * Administración cambia el estado de un pedido (RF8, CU11). El rol se comprueba aquí, en el
 * servidor, además de en el middleware: solo `Administrador`. La pantalla llega en A11.
 *
 * Cuerpo: `{ status, cancellationTypeId? }`; el motivo es obligatorio al pasar a 'Anulado'. Las
 * reglas son las de `canTransition` (no se saltan estados). Al anular se devuelve el stock y, si
 * era de tarjeta, se reembolsa.
 *
 * Al pasar a 'Entregado' se emite la factura en la misma transacción y se devuelve su número.
 *
 * Respuestas: 200 `{ status, refund, invoiceNumber }` (`invoiceNumber` solo al entregar); 400 id o cuerpo no válidos o motivo inexistente; 401 sin
 * sesión; 403 sin el rol; 404 no existe; 409 transición no permitida o el pedido cambió a la
 * vez; 503 faltan los datos fiscales de la tienda (`INVOICE_ISSUER_*`) al entregar; 500 error interno.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await requireRole(['Administrador']);
        if ('response' in auth) return auth.response;
        const { user } = auth;

        const orderId = /^\d+$/.test(params.id) ? Number(params.id) : NaN;
        if (!Number.isSafeInteger(orderId) || orderId < 1 || orderId > MAX_ID)
            return respond({ message: 'El identificador del pedido no es válido' }, 400);

        const body = await request.json().catch(() => undefined);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success)
            return respond(
                { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
                400,
            );

        const result = await changeOrderStatus(
            orderId,
            parsed.data.status as (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS],
            { role: 'Administrador', userId: user.id },
            { cancellationTypeId: parsed.data.cancellationTypeId },
        );
        if (!result.ok)
            return respond({ message: result.message }, CHANGE_STATUS_HTTP[result.code]);
        return respond({
            status: result.to,
            refund: result.refund,
            invoiceNumber: result.invoiceNumber,
        });
    } catch (error) {
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
