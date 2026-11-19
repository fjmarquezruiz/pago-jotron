import {
    SummaryPanel,
    SummaryRow,
    SummaryTotal,
    TrustBadges,
} from '@/components/shop/summary-parts';
import { Separator } from '@/components/ui/separator';
import { formatCents } from '@/lib/cart/totals';
import { cn } from '@/lib/utils';
import { formatDeliveryAddress, type AddressLike } from '@/lib/checkout/address';

/** Una línea del pedido para el resumen de la confirmación. Importes en céntimos. */
export interface OrderSummaryItem {
    /** Clave estable de la línea (por ejemplo, el id de la presentación). */
    id: number | string;
    /** Nombre del producto (con su presentación, si procede). */
    name: string;
    quantity: number;
    /** Precio unitario con IVA incluido. */
    unitCents: number;
    /** Importe de la línea: `unitCents × quantity`. */
    totalCents: number;
}

interface OrderSummaryProps {
    /** Dirección de entrega: nombre de quien recibe, calle, código postal, localidad y país. */
    address: AddressLike;
    /** Fecha de entrega estimada ya formateada (`formatDeliveryDate`); sin ella no se pinta la fila. */
    estimatedDelivery?: string | null;
    /** Líneas del pedido. */
    items: readonly OrderSummaryItem[];
    /** Modalidad de envío: nombre y coste en céntimos (0 = gratis). */
    shipping: { name: string; cents: number };
    /** Total del pedido, en céntimos. */
    totalCents: number;
    className?: string;
}

/**
 * Resumen del pedido ya hecho (Figma: summary-cart de checkout-4-confirmar, spec §5): entrega a,
 * entrega estimada, artículos (nombre, "n × precio" y su importe), envío con el nombre de la
 * modalidad y su coste, IVA, total y sellos de confianza. Sin subtotal ni botón.
 *
 * Los importes los fija el pedido guardado; aquí no se calcula ningún precio. Ocupa el ancho de
 * su columna: pásale `className="self-stretch"` para que iguale el alto de la tarjeta de resultado.
 *
 * @example
 * <OrderSummary
 *     address={order.address}
 *     estimatedDelivery="Jue, 18 oct"
 *     items={[{ id: 4, name: 'Jotrón Tinto 2021', quantity: 2, unitCents: 2350, totalCents: 4700 }]}
 *     shipping={{ name: 'Envío estándar', cents: 495 }}
 *     totalCents={5195}
 * />
 */
export function OrderSummary({
    address,
    estimatedDelivery,
    items,
    shipping,
    totalCents,
    className,
}: OrderSummaryProps) {
    const { street, locality } = formatDeliveryAddress(address);
    return (
        <SummaryPanel titleId="order-summary-title" className={className}>
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-muted-foreground">Entrega a</p>
                <div className="flex flex-col gap-1">
                    <p className="text-base font-medium">{address.recipientName}</p>
                    <p className="text-sm text-muted-foreground">{street}</p>
                    <p className="text-sm text-muted-foreground">{locality}</p>
                </div>
            </div>
            {estimatedDelivery && (
                <>
                    <Separator />
                    <SummaryRow
                        label="Entrega estimada"
                        value={estimatedDelivery}
                        align="baseline"
                    />
                </>
            )}
            <Separator />
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-muted-foreground">Artículos</p>
                <div className="flex flex-col gap-4">
                    <ul className="flex flex-col gap-4">
                        {items.map((item, index) => (
                            <li
                                key={item.id}
                                className={cn(
                                    'flex items-start justify-between gap-4',
                                    index > 0 && 'border-t border-border pt-4',
                                )}
                            >
                                <div className="flex min-w-0 flex-col gap-1">
                                    <p className="text-base font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.quantity} × {formatCents(item.unitCents)}
                                    </p>
                                </div>
                                <p className="text-base font-medium whitespace-nowrap">
                                    {formatCents(item.totalCents)}
                                </p>
                            </li>
                        ))}
                    </ul>
                    <Separator />
                    <SummaryRow
                        label="Envío"
                        value={`${shipping.name} (${shipping.cents === 0 ? 'gratis' : formatCents(shipping.cents)})`}
                    />
                </div>
            </div>
            <SummaryRow label="IVA" value="Incluido" />
            <SummaryTotal value={formatCents(totalCents)} />
            <TrustBadges />
        </SummaryPanel>
    );
}
