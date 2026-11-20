import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    SummaryPanel,
    SummaryRow,
    SummaryTotal,
    TrustBadges,
} from '@/components/shop/summary-parts';
import { formatCents } from '@/lib/cart/totals';
import { formatDeliveryTime, type ShippingOptionInput } from '@/lib/catalog/shipping';
import { formatEuros } from '@/lib/utils';

/** La modalidad de envío con la que se calcula "Envío desde" y la entrega estimada. */
export type CartDelivery = Pick<
    ShippingOptionInput,
    'cost' | 'minDeliveryDays' | 'maxDeliveryDays'
>;

interface CartSummaryProps {
    /** Suma de las líneas, en céntimos (`cartSubtotalCents`). */
    subtotalCents: number;
    /** El envío más barato con plazo (`cheapestDelivery`), o `null` si no hay ninguno. */
    delivery: CartDelivery | null;
}

/**
 * Resumen del pedido (Figma: summary-cart): subtotal, envío, entrega estimada, IVA, total, el
 * botón "Continuar" y los sellos de confianza.
 *
 * El envío no se elige en el carrito: se enseña desde cuánto sale y la entrega estimada es el plazo
 * de esa modalidad. La modalidad se elige en el paso de Datos, así que el total es el subtotal (IVA
 * incluido) y el envío se suma allí.
 *
 * El total es una región en vivo (`aria-live="polite"`): el cambio se anuncia al modificar
 * cantidades o quitar líneas.
 *
 * "Continuar" lleva a `/checkout`. No comprueba la sesión: el middleware manda a quien no la tiene a
 * `/auth/login?callbackUrl=/checkout`, y el login lo devuelve aquí.
 *
 * @example
 * <CartSummary subtotalCents={4690} delivery={{ cost: '4.95', minDeliveryDays: 3, maxDeliveryDays: 5 }} />
 */
export function CartSummary({ subtotalCents, delivery }: CartSummaryProps) {
    const time = delivery
        ? formatDeliveryTime(delivery.minDeliveryDays, delivery.maxDeliveryDays)
        : null;

    return (
        <SummaryPanel titleId="cart-summary-title">
            <SummaryRow label="Subtotal" value={formatCents(subtotalCents)} />
            {delivery && (
                <SummaryRow
                    label="Envío"
                    value={
                        Number(delivery.cost) === 0
                            ? 'Gratis'
                            : `desde ${formatEuros(delivery.cost)}`
                    }
                />
            )}
            {time && <SummaryRow label="Entrega estimada" value={time} />}
            <SummaryRow label="IVA" value="Incluido" />
            <SummaryTotal value={formatCents(subtotalCents)} />
            <Button asChild variant="brand" size="lg" className="w-full">
                <Link href="/checkout">
                    Continuar
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
            <TrustBadges />
        </SummaryPanel>
    );
}
