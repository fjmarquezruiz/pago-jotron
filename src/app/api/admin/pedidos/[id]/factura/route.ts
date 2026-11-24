import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { getOrderInvoice } from '@/lib/db/admin-orders';
import { renderInvoicePdf } from '@/lib/invoices/pdf';
import { ORDER_STATUS } from '@/lib/orders/status';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión de cada petición y usa `@react-pdf/renderer`, que necesita Node.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Respuesta JSON que ningún navegador ni intermediario guarda. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Nombre de archivo seguro: el número de factura (`F-2026-0001`) sin nada que rompa la cabecera. */
function fileName(number: string): string {
    return `${number.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
}

/**
 * La factura en PDF de cualquier pedido, para el administrador (RF8, CU11). Es la misma copia
 * congelada (`invoices.snapshot`) que descarga el cliente. Solo `Administrador`; se comprueba aquí
 * además del middleware.
 *
 * Respuestas: 200 el PDF (`application/pdf`, como descarga); 400 id no válido; 401 sin sesión; 403
 * sin el rol; 404 no existe, no tiene factura o no está Entregado; 500 error interno.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await requireRole(['Administrador']);
        if ('response' in auth) return auth.response;

        const orderId = /^\d+$/.test(params.id) ? Number(params.id) : NaN;
        if (!Number.isSafeInteger(orderId) || orderId < 1 || orderId > MAX_ID)
            return respond({ message: 'El identificador del pedido no es válido' }, 400);

        const found = await getOrderInvoice(orderId);
        if (found === null || found.status !== ORDER_STATUS.DELIVERED)
            return respond({ message: 'El pedido no existe' }, 404);

        const pdf = await renderInvoicePdf(found.document);
        return new NextResponse(new Uint8Array(pdf), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName(found.document.number)}"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (error) {
        console.error(error);
        return respond({ message: 'Error interno del servidor' }, 500);
    }
}
