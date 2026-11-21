import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatOrderMoment } from '@/lib/orders/dates';
import type { OrderDetail } from '@/lib/orders/detail';
import { stepperProgress, type PaymentMethod } from '@/lib/orders/status-ui';
import { CancelOrderDialog } from './cancel-order-dialog';
import { OrderDetailCards } from './order-detail-cards';
import { OrderDetailLines } from './order-detail-lines';
import { orderActions, orderStepDates, paymentMethodLabel } from './order-detail-model';
import { OrderNotice } from './order-notice';
import { OrderStatusBadge } from './order-status-badge';
import { OrderStepper } from './order-stepper';

/**
 * Detalle de un pedido del cliente (Figma: account-order-*): título con su estado, fecha y forma
 * de pago, botones (Cancelar solo dentro del plazo, Factura solo en Entregado y aún deshabilitado),
 * seguimiento, aviso de Pendiente de pago, Bloqueado o Anulado, líneas y la columna de resumen,
 * dirección y pago. Todo sale de `detail` (`buildOrderDetail`): ni el botón ni el aviso repiten las
 * reglas de estado.
 *
 * @param props.detail - El pedido del cliente.
 *
 * @example
 * <OrderDetailView detail={buildOrderDetail(found)} />
 */
export function OrderDetailView({ detail }: { detail: OrderDetail }) {
    const actions = orderActions(detail);
    const { notice } = stepperProgress({
        status: detail.status,
        blockedFrom: detail.blockedFrom,
        paymentMethod: detail.paymentMethod as PaymentMethod,
    });
    const { date, time } = formatOrderMoment(detail.createdAt);

    return (
        <>
            <header className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                    <div className="flex min-h-10 items-center gap-4">
                        <h1 className="text-2xl font-medium">Pedido #{detail.number}</h1>
                        <OrderStatusBadge status={detail.status} />
                    </div>
                    {(actions.cancel || actions.invoice) && (
                        <div className="flex items-center gap-3">
                            {actions.cancel && (
                                <CancelOrderDialog
                                    orderId={detail.id}
                                    orderNumber={detail.number}
                                    paymentMethod={detail.paymentMethod}
                                />
                            )}
                            {actions.invoice && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0} className="inline-flex rounded-sm">
                                            <Button variant="outline" disabled aria-disabled>
                                                <Download aria-hidden="true" />
                                                Factura (PDF)
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        La factura estará disponible próximamente
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <p>
                        Fecha del pedido:{' '}
                        <strong className="font-semibold text-foreground">{date}</strong>
                        <span className="text-foreground"> a las {time}</span>
                    </p>
                    <span aria-hidden="true" className="hidden h-4 w-px bg-border sm:block" />
                    <p>
                        Método de pago:{' '}
                        <strong className="font-semibold text-foreground">
                            {paymentMethodLabel(detail.paymentMethod)}
                        </strong>
                    </p>
                </div>
                {actions.cancelHint && (
                    <p className="text-xs text-muted-foreground">
                        Puedes cancelar el pedido durante las 24 h siguientes a la compra.
                    </p>
                )}
            </header>
            <OrderStepper
                status={detail.status}
                blockedFrom={detail.blockedFrom}
                paymentMethod={detail.paymentMethod as PaymentMethod}
                cancelledBy={detail.cancelledBy}
                dates={orderStepDates(detail)}
            />
            {notice && <OrderNotice kind={notice} />}
            <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_23.75rem]">
                <OrderDetailLines lines={detail.lines} />
                <OrderDetailCards detail={detail} />
            </div>
        </>
    );
}
