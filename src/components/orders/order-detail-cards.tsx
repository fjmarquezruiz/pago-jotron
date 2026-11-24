import { Separator } from '@/components/ui/separator';
import { formatCents } from '@/lib/cart/totals';
import type { OrderDetail } from '@/lib/orders/detail';
import { cn } from '@/lib/utils';
import { paymentMethodLabel, shippingLabel } from './order-detail-model';

/** Tarjeta de la columna derecha (Figma: Detail-Card): fondo `muted`, 24 px de relleno, 380 px. */
function DetailCard({
    title,
    titleId,
    className,
    children,
}: {
    title: string;
    titleId: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            aria-labelledby={titleId}
            className={cn('flex flex-col gap-5 rounded-sm bg-muted p-6', className)}
        >
            <h2 id={titleId} className="text-base font-medium">
                {title}
            </h2>
            {children}
        </section>
    );
}

/** Una fila del resumen: etiqueta pequeña a la izquierda y valor a la derecha. */
function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between gap-4 whitespace-nowrap">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
        </div>
    );
}

/**
 * Subtotal, envío, IVA y total de un pedido (Figma: Details Table), con los importes de
 * `detail.quote` (calculados con los precios guardados). Lo comparten la tarjeta del cliente y la
 * caja del panel.
 *
 * @param props.quote - `detail.quote`.
 */
export function OrderSummaryRows({ quote }: { quote: OrderDetail['quote'] }) {
    return (
        <>
            <dl className="flex flex-col gap-1">
                <Row label="Subtotal" value={formatCents(quote.subtotalCents)} />
                <Row
                    label="Envío"
                    value={quote.shippingCents === 0 ? 'Gratis' : formatCents(quote.shippingCents)}
                />
                <Row label="IVA" value="Incluido" />
            </dl>
            <Separator />
            <div
                aria-live="polite"
                className="flex items-baseline justify-between whitespace-nowrap"
            >
                <p className="text-sm font-medium">Total</p>
                <p className="text-lg font-semibold">{formatCents(quote.totalCents)}</p>
            </div>
        </>
    );
}

/**
 * Columna derecha del detalle (Figma: Details Table y Detail-Card): resumen del pedido con el
 * subtotal, el envío, el IVA y el total (de `detail.quote`, calculado con los precios guardados),
 * dirección de envío con el método de entrega e información de pago. Sin número de seguimiento ni
 * datos de la tarjeta: no se guardan.
 *
 * @param props.detail - El pedido (`buildOrderDetail`).
 *
 * @example
 * <OrderDetailCards detail={detail} />
 */
export function OrderDetailCards({ detail }: { detail: OrderDetail }) {
    const { quote, shippingAddress: address, shippingType } = detail;
    // Mismas líneas que `formatStreetLine` y `formatCityLine`; aquí los tipos llegan como texto de la BD.
    const street = [`${address.streetType} ${address.streetName}`, address.number, address.floor]
        .filter(Boolean)
        .join(', ');
    const city = `${address.city}, ${address.postalCode}`;
    return (
        <div className="flex w-full flex-col gap-gap-lg lg:max-w-95">
            <DetailCard title="Resumen del pedido" titleId="order-summary-title">
                <OrderSummaryRows quote={quote} />
            </DetailCard>
            <DetailCard title="Dirección de envío" titleId="order-address-title">
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{address.recipientName}</p>
                    <p className="text-xs text-muted-foreground">{street}</p>
                    <p className="text-xs text-muted-foreground">{city}</p>
                    <p className="text-xs text-muted-foreground">{address.country}</p>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Método de entrega</p>
                    <p className="text-xs text-muted-foreground">{shippingLabel(shippingType)}</p>
                </div>
            </DetailCard>
            <DetailCard title="Información de pago" titleId="order-payment-title">
                <p className="text-sm font-medium">{paymentMethodLabel(detail.paymentMethod)}</p>
            </DetailCard>
        </div>
    );
}
