import Link from 'next/link';
import { ArrowRight, Lock, RotateCcw, ShieldLock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCents } from '@/lib/cart/totals';
import { formatDeliveryTime, type ShippingOptionInput } from '@/lib/catalog/shipping';
import { formatEuros } from '@/lib/utils';

/** La modalidad de envío con la que se calcula "Envío desde" y la entrega estimada. */
export type CartDelivery = Pick<
    ShippingOptionInput,
    'cost' | 'minDeliveryDays' | 'maxDeliveryDays'
>;

// Texto del diseño de Figma que no sale de la BD: confirmar con la bodega.
const TRUST_BADGES = [
    { icon: ShieldLock, text: 'Pago seguro' },
    { icon: RotateCcw, text: 'Devoluciones gratuitas' },
    { icon: Lock, text: 'Cifrado SSL' },
];

/** Una fila del resumen: etiqueta pequeña a la izquierda y valor a la derecha. */
function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between font-medium whitespace-nowrap">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-base">{value}</p>
        </div>
    );
}

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
        <aside
            aria-labelledby="cart-summary-title"
            className="flex max-w-120 flex-col gap-8 self-start rounded-sm bg-muted p-10 max-xl:max-w-none"
        >
            <h2 id="cart-summary-title" className="text-xl font-medium">
                Resumen del pedido
            </h2>
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
            <Separator />
            {/* Región en vivo: al cambiar una cantidad o quitar una línea, el lector anuncia "Total …". */}
            <div
                aria-live="polite"
                aria-atomic="true"
                className="flex items-center justify-between text-xl font-medium whitespace-nowrap"
            >
                <p>Total</p>
                <p>{formatCents(subtotalCents)}</p>
            </div>
            <Button asChild variant="brand" size="lg" className="w-full">
                <Link href="/checkout">
                    Continuar
                    <ArrowRight aria-hidden="true" />
                </Link>
            </Button>
            <ul className="flex flex-col gap-2.5">
                {TRUST_BADGES.map(({ icon: Icon, text }) => (
                    <li
                        key={text}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                        {text}
                    </li>
                ))}
            </ul>
        </aside>
    );
}
