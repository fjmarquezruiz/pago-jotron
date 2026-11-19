import * as React from 'react';
import { Lock, RotateCcw, ShieldLock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Texto del diseño de Figma que no sale de la BD: confirmar con la bodega.
const TRUST_BADGES = [
    { icon: ShieldLock, text: 'Pago seguro' },
    { icon: RotateCcw, text: 'Devoluciones gratuitas' },
    { icon: Lock, text: 'Cifrado SSL' },
];

interface SummaryPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    /** Título del panel. Por defecto "Resumen del pedido". */
    title?: React.ReactNode;
    /** Id del título (lo referencia `aria-labelledby`); único en la página. */
    titleId?: string;
}

/**
 * Contenedor del resumen del pedido (Figma: summary-cart), común al carrito y al checkout: fondo
 * `muted`, `rounded-sm`, relleno de 40 px y 32 px entre sus partes, con el título en `h2`. En
 * escritorio se queda en su columna (`max-w-120`, arriba); por debajo de `xl` ocupa todo el ancho.
 *
 * @example
 * <SummaryPanel titleId="cart-summary-title">…filas…</SummaryPanel>
 */
export function SummaryPanel({
    title = 'Resumen del pedido',
    titleId = 'order-summary-title',
    className,
    children,
    ...props
}: SummaryPanelProps) {
    return (
        <aside
            aria-labelledby={titleId}
            className={cn(
                'flex max-w-120 flex-col gap-8 self-start rounded-sm bg-muted p-10 max-xl:max-w-none',
                className,
            )}
            {...props}
        >
            <h2 id={titleId} className="text-xl font-medium">
                {title}
            </h2>
            {children}
        </aside>
    );
}

interface SummaryRowProps {
    label: React.ReactNode;
    value: React.ReactNode;
    /** `baseline` alinea por la línea base (Figma: "Entrega estimada"); por defecto centrado. */
    align?: 'center' | 'baseline';
}

/**
 * Una fila del resumen: etiqueta pequeña a la izquierda y valor a la derecha.
 *
 * @example
 * <SummaryRow label="Subtotal" value="46,90 €" />
 */
export function SummaryRow({ label, value, align = 'center' }: SummaryRowProps) {
    return (
        <div
            className={cn(
                'flex justify-between gap-4 font-medium whitespace-nowrap',
                align === 'baseline' ? 'items-baseline' : 'items-center',
            )}
        >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-base">{value}</p>
        </div>
    );
}

/**
 * Separador más total del resumen. El total es una región en vivo (`aria-live="polite"`): al
 * cambiar (una cantidad, la modalidad de envío) el lector de pantalla anuncia "Total …".
 *
 * @param props.value - El total ya formateado (`formatCents`).
 *
 * @example
 * <SummaryTotal value={formatCents(quote.totalCents)} />
 */
export function SummaryTotal({ value }: { value: React.ReactNode }) {
    return (
        <>
            <Separator />
            <div
                aria-live="polite"
                aria-atomic="true"
                className="flex items-center justify-between text-xl font-medium whitespace-nowrap"
            >
                <p>Total</p>
                <p>{value}</p>
            </div>
        </>
    );
}

/**
 * Insignias de confianza del pie del resumen: pago seguro, devoluciones y cifrado.
 *
 * @example
 * <TrustBadges />
 */
export function TrustBadges() {
    return (
        <ul className="flex flex-col gap-2.5">
            {TRUST_BADGES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    {text}
                </li>
            ))}
        </ul>
    );
}
