import { AdminPage } from '@/components/admin/admin-page';
import { OrderStepper } from '@/components/orders/order-stepper';
import { Separator } from '@/components/ui/separator';
import { formatCents } from '@/lib/cart/totals';
import { adminOrderDescription } from '@/lib/admin/orders';
import { formatOrderMoment } from '@/lib/orders/dates';
import type { OrderDetail } from '@/lib/orders/detail';
import {
    orderStepDates,
    paymentMethodLabel,
    shippingLabel,
} from '@/components/orders/order-detail-model';
import { OrderSummaryRows } from '@/components/orders/order-detail-cards';
import type { PaymentMethod } from '@/lib/orders/status-ui';
import { AdminOrderActions, type AdminOrderActionsProps } from './admin-order-actions';
import { AdminOrderBox } from './admin-order-box';
import { AdminOrderLines } from './admin-order-lines';

/** El cliente del pedido tal como lo enseña la caja "Cliente". */
export interface AdminOrderCustomer {
    /** Nombre y apellidos, o el correo si la cuenta no los tiene. */
    label: string;
    email: string;
    phone: string | null;
}

/**
 * Detalle de un pedido en el panel (Figma: admin-order-detail, admin-order-pending-payment y
 * admin-order-blocked; CU11): migas, título con la frase de estado y los botones, el seguimiento, las
 * líneas a la izquierda y a la derecha el resumen, el cliente, la dirección y el pago; al final una
 * línea y los mismos botones. Sin número de seguimiento ni datos de la tarjeta: no se guardan.
 *
 * @param props.detail - El pedido (`buildOrderDetail`).
 * @param props.customer - Su cliente.
 * @param props.actions - Lo que puede hacer el administrador (`AdminOrderActions`).
 */
export function AdminOrderDetail({
    detail,
    customer,
    actions,
}: {
    detail: OrderDetail;
    customer: AdminOrderCustomer;
    actions: AdminOrderActionsProps;
}) {
    const { shippingAddress: address, shippingType, quote } = detail;
    const street = [`${address.streetType} ${address.streetName}`, address.number, address.floor]
        .filter(Boolean)
        .join(', ');
    const units = detail.lines.reduce((sum, line) => sum + line.quantity, 0);
    const pendingTransfer =
        detail.status === 'Pendiente de pago' && detail.paymentMethod === 'Transferencia';
    const buttons = <AdminOrderActions {...actions} />;

    return (
        <AdminPage
            breadcrumb={[
                { label: 'Pedidos', href: '/admin/pedidos' },
                { label: `#${detail.number}` },
            ]}
            title={`Pedido #${detail.number}`}
            description={adminOrderDescription({
                status: detail.status,
                paymentMethod: detail.paymentMethod,
                moment: formatOrderMoment(detail.createdAt),
                units,
                total: formatCents(quote.totalCents),
            })}
            actions={buttons}
        >
            <div className="grid items-start gap-12 lg:grid-cols-3">
                <OrderStepper
                    admin
                    className="lg:col-span-3"
                    status={detail.status}
                    blockedFrom={detail.blockedFrom}
                    paymentMethod={detail.paymentMethod as PaymentMethod}
                    cancelledBy={detail.cancelledBy}
                    dates={orderStepDates(detail)}
                />
                <div className="lg:col-span-2">
                    <AdminOrderLines lines={detail.lines} />
                </div>
                <div className="flex flex-col gap-12">
                    <AdminOrderBox title="Resumen del pedido" titleId="admin-order-summary-title">
                        <OrderSummaryRows quote={quote} />
                    </AdminOrderBox>
                    <AdminOrderBox title="Cliente" titleId="admin-order-customer-title">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">{customer.label}</p>
                            {customer.label !== customer.email && (
                                <p className="text-xs text-muted-foreground">{customer.email}</p>
                            )}
                            {customer.phone && (
                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            )}
                        </div>
                    </AdminOrderBox>
                    <AdminOrderBox title="Dirección de envío" titleId="admin-order-address-title">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">{address.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{street}</p>
                            <p className="text-xs text-muted-foreground">
                                {address.postalCode} {address.city}
                            </p>
                            <p className="text-xs text-muted-foreground">{address.country}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Método de entrega</p>
                            <p className="text-xs text-muted-foreground">
                                {shippingLabel(shippingType)}
                            </p>
                        </div>
                    </AdminOrderBox>
                    <AdminOrderBox title="Información de pago" titleId="admin-order-payment-title">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">
                                {paymentMethodLabel(detail.paymentMethod)}
                            </p>
                            {pendingTransfer && (
                                <p className="text-xs text-muted-foreground">
                                    Cobro pendiente de confirmar
                                </p>
                            )}
                        </div>
                    </AdminOrderBox>
                </div>
            </div>
            <Separator />
            <div className="flex items-center justify-end gap-gap-sm">{buttons}</div>
        </AdminPage>
    );
}
