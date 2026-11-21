import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { getUserInvoice } from '@/lib/db/queries';
import { getInvoiceIssuer } from '@/lib/invoices/issuer';
import { renderInvoicePdf } from '@/lib/invoices/pdf';
import { ORDER_STATUS } from '@/lib/orders/status';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión de cada petición y usa `@react-pdf/renderer`, que necesita Node.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Respuesta JSON que ningún navegador ni intermediario guarda: son datos personales de una cuenta. */
function respond(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Nombre de archivo seguro: el número de factura (`F-2026-0001`) sin nada que rompa la cabecera. */
function fileName(number: string): string {
    return `${number.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
}

/**
 * La factura en PDF de un pedido del cliente (RF8, CU8). Solo para la cuenta de la sesión y solo si
 * el pedido está Entregado: el pedido de otra cuenta, uno que no existe, uno sin factura y uno que
 * aún no se ha entregado responden igual (404), para no revelar qué ids existen ni en qué estado
 * están. El PDF sale de la copia que se guardó al emitir la factura (`invoices.snapshot`), no de
 * datos vivos, así que no cambia aunque cambie el perfil o el producto.
 *
 * Respuestas: 200 el PDF (`application/pdf`, como descarga); 400 el id no es un entero válido; 401
 * sin sesión; 404 no existe, es de otra cuenta, no tiene factura o no está Entregado; 503 faltan los
 * datos fiscales de la tienda (`INVOICE_ISSUER_*`); 500 error interno.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getSessionUserId();
        if (userId === null) return respond({ message: 'Inicia sesión para continuar' }, 401);

        const orderId = /^\d+$/.test(params.id) ? Number(params.id) : NaN;
        if (!Number.isSafeInteger(orderId) || orderId < 1 || orderId > MAX_ID)
            return respond({ message: 'El identificador del pedido no es válido' }, 400);

        const found = await getUserInvoice(userId, orderId);
        if (found === null || found.status !== ORDER_STATUS.DELIVERED)
            return respond({ message: 'El pedido no existe' }, 404);

        let issuer;
        try {
            issuer = getInvoiceIssuer();
        } catch (error) {
            console.error(error);
            return respond({ message: 'La factura no está disponible ahora mismo' }, 503);
        }

        const pdf = await renderInvoicePdf(found.document, issuer);
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
