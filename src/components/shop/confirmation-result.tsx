import Link from 'next/link';
import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { OrderSummary } from '@/components/shop/order-summary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
    REJECTION_TEXT,
    rejectionSubtitle,
    thanksText,
    type ConfirmationSummary,
} from '@/lib/checkout/confirmation';

/**
 * Esqueleto de la página Confirmar (Figma: checkout-4-confirmacion): los pasos, el `h1`
 * "Confirmar" y la rejilla 2/3 + 1/3 con la tarjeta de resultado y el resumen. Por debajo de `xl`
 * se apila. Sin resumen, la tarjeta ocupa todo el ancho.
 *
 * @param props.errorStep - `true` en el rechazo: el paso 4 se pinta en rojo.
 * @param props.summary - Datos del resumen del pedido, o `null` si no se pueden mostrar.
 * @param props.children - La tarjeta de resultado.
 */
export function ConfirmationFrame({
    errorStep = false,
    summary,
    children,
}: {
    errorStep?: boolean;
    summary: ConfirmationSummary | null;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-12">
            <CheckoutSteps current={3} errorStep={errorStep ? 3 : undefined} />
            <h1 className="min-h-12 font-display text-4xl">Confirmar</h1>
            {summary ? (
                <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                    {/* Una celda flex: la tarjeta se estira a la altura del resumen (spec, duda 16). */}
                    <div className="flex xl:col-span-2">{children}</div>
                    <OrderSummary {...summary} className="self-stretch" />
                </div>
            ) : (
                children
            )}
        </div>
    );
}

/** Subtítulo de la tarjeta (Geist Medium 20/28, `foreground`) y su texto, con 12 px entre ellos. */
function Message({ subtitle, children }: { subtitle: string; children: ReactNode }) {
    // `EmptyState` envuelve la descripción en un `<p>`: solo caben `span`.
    return (
        <span className="flex flex-col gap-3">
            <span className="text-xl font-medium text-foreground">{subtitle}</span>
            {children}
        </span>
    );
}

/** Los dos botones de la tarjeta: el de borde y el `brand`. */
function Actions({
    secondary,
    primary,
}: {
    secondary: { href: string; label: string };
    primary: { href: string; label: string };
}) {
    return (
        <>
            <Button asChild variant="outline">
                <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
            <Button asChild variant="brand">
                <Link href={primary.href}>{primary.label}</Link>
            </Button>
        </>
    );
}

/** Clases que quitan el alto mínimo de 640 px en móvil: allí la tarjeta mide lo que su contenido. */
const CARD_CLASS = 'max-xl:min-h-0';

interface PlacedResultProps {
    /** Id del pedido, para "Ver detalle". */
    orderId: number;
    /** Nombre con el que se saluda, o `null`. */
    name: string | null;
    /** Texto que sigue al saludo: una frase (tarjeta). */
    text?: string;
    /** O varios párrafos (transferencia). */
    paragraphs?: string[];
}

/**
 * Tarjeta del pedido hecho. Con `text` es el pedido pagado con tarjeta ("¡Pedido confirmado!");
 * con `paragraphs`, el pendiente de transferencia ("Pedido recibido: pendiente de pago"), con los
 * párrafos separados por 14 px como en el diseño. Es una región `role="status"`: el lector de
 * pantalla anuncia el resultado.
 *
 * "Ver detalle" lleva a `/pedidos/<id>`.
 * TODO: esa pantalla (detalle de pedido) no existe todavía y da 404 hasta la fase siguiente.
 */
export function PlacedResult({ orderId, name, text, paragraphs }: PlacedResultProps) {
    return (
        <EmptyState
            role="status"
            icon={<CircleCheck />}
            titleAs="h2"
            title={paragraphs ? 'Pedido recibido: pendiente de pago' : '¡Pedido confirmado!'}
            description={
                <Message subtitle={thanksText(name)}>
                    {paragraphs ? (
                        <span className="flex flex-col gap-3.5">
                            {paragraphs.map((paragraph) => (
                                <span key={paragraph}>{paragraph}</span>
                            ))}
                        </span>
                    ) : (
                        <span>{text}</span>
                    )}
                </Message>
            }
            action={
                <Actions
                    secondary={{ href: `/pedidos/${orderId}`, label: 'Ver detalle' }}
                    primary={{ href: '/productos', label: 'Seguir comprando' }}
                />
            }
            className={CARD_CLASS}
        />
    );
}

/**
 * Tarjeta del pago rechazado (Figma: checkout-3-pago-rechazado). Es una región `role="alert"`: se
 * anuncia al aparecer. Los dos botones llevan al paso Pago.
 *
 * @param props.name - Nombre con el que se saluda, o `null`.
 */
export function RejectedResult({ name }: { name: string | null }) {
    return (
        <EmptyState
            role="alert"
            icon={<CircleAlert />}
            titleAs="h2"
            title="¡No se ha podido procesar el pago!"
            description={
                <Message subtitle={rejectionSubtitle(name)}>
                    <span>{REJECTION_TEXT}</span>
                </Message>
            }
            action={
                <Actions
                    secondary={{ href: '/checkout/pago', label: 'Cambiar método' }}
                    primary={{ href: '/checkout/pago', label: 'Volver a intentar' }}
                />
            }
            className={CARD_CLASS}
        />
    );
}
