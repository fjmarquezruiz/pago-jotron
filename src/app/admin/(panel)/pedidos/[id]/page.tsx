import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminOrderDetail } from '@/components/admin/orders/admin-order-detail';
import { cancelNotice, canAdminCancel, primaryAction } from '@/lib/admin/orders';
import { customerLabel } from '@/lib/admin/dashboard';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminOrder, listAdminCancellationTypes } from '@/lib/db/admin-orders';
import { buildOrderDetail } from '@/lib/orders/detail';
import { ORDER_STATUS } from '@/lib/orders/status';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión y del estado actual del pedido: nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Pedido | Pago de Jotrón' };

/** Id de la URL como entero válido, o `null` (la página responde 404). */
function parseOrderId(raw: string): number | null {
    const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
    return Number.isSafeInteger(id) && id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * Detalle de un pedido del panel (Figma: admin-order-detail, -pending-payment y -blocked; CU11). Solo
 * el administrador; aquí se vuelve a comprobar con el rol de la BD. Un pedido que no existe responde
 * 404. Los botones salen de las mismas reglas que la API (`canTransition`).
 */
export default async function AdminOrderPage({ params }: { params: { id: string } }) {
    const user = await getSessionUser();
    if (user === null || user.role !== 'Administrador') redirect('/acceso-denegado');

    const orderId = parseOrderId(params.id);
    if (orderId === null) notFound();

    const [found, reasons] = await Promise.all([
        getAdminOrder(orderId),
        listAdminCancellationTypes(),
    ]);
    if (found === null) notFound();

    const detail = buildOrderDetail(found);
    const { order } = found;
    const { status, blockedFrom } = detail;

    return (
        <AdminOrderDetail
            detail={detail}
            customer={{
                label: customerLabel(
                    order.customerName,
                    order.customerLastName,
                    order.customerEmail,
                ),
                email: order.customerEmail,
                phone: order.customerPhone ?? order.phone,
            }}
            actions={{
                orderId,
                orderNumber: detail.number,
                status,
                primary: primaryAction(status, blockedFrom),
                canCancel: canAdminCancel(status, blockedFrom),
                cancelNotice: cancelNotice({
                    status,
                    blockedFrom,
                    paymentMethod: detail.paymentMethod,
                }),
                reasons,
                invoiceHref:
                    status === ORDER_STATUS.DELIVERED && detail.invoiceNumber !== null
                        ? `/api/admin/pedidos/${orderId}/factura`
                        : null,
            }}
        />
    );
}
