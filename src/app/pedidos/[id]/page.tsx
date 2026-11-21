import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AccountShell } from '@/components/account/account-shell';
import { OrderDetailView } from '@/components/orders/order-detail-view';
import { getSessionUserId } from '@/lib/auth/session';
import { getUserOrder } from '@/lib/db/queries';
import { buildOrderDetail } from '@/lib/orders/detail';
import { orderNumber } from '@/lib/orders/format';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión y del reloj (plazo de cancelación): nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Pedido | Pago de Jotrón' };

/** Id de la URL como entero válido, o `null` (la página responde 404). */
function parseOrderId(raw: string): number | null {
    const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
    return Number.isSafeInteger(id) && id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * Detalle de un pedido del cliente (RF8; Figma: account-order-*): líneas, envío, dirección y estado,
 * con Cancelar dentro del plazo (CU7). Es el destino de "Ver detalle" de la confirmación de la
 * compra. Privada (el middleware protege `/pedidos`): sin sesión lleva al acceso y vuelve aquí. El
 * pedido de otra cuenta responde 404, igual que uno que no existe.
 */
export default async function OrderPage({ params }: { params: { id: string } }) {
    const orderId = parseOrderId(params.id);
    if (orderId === null) notFound();

    const userId = await getSessionUserId();
    if (userId === null)
        redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/pedidos/${params.id}`)}`);

    const found = await getUserOrder(userId, orderId);
    if (found === null) notFound();

    return (
        <AccountShell
            current="pedidos"
            breadcrumb={[
                { label: 'Mi cuenta', href: '/cuenta/pedidos' },
                { label: 'Historial de pedidos', href: '/cuenta/pedidos' },
                { label: `Pedido #${orderNumber(orderId)}` },
            ]}
        >
            <OrderDetailView detail={buildOrderDetail(found)} />
        </AccountShell>
    );
}
