'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { CheckoutHydrator } from '@/components/shop/checkout-hydrator';
import { CheckoutSteps } from '@/components/shop/checkout-steps';
import {
    ConfirmationFrame,
    PlacedResult,
    RejectedResult,
} from '@/components/shop/confirmation-result';
import { ConfirmationSkeleton } from '@/components/shop/confirmation-skeleton';
import { useCartLines } from '@/components/shop/use-cart-lines';
import { useCheckoutData } from '@/components/shop/use-checkout-data';
import { useConfirmationOrder } from '@/components/shop/use-confirmation-order';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
    cardOrderText,
    confirmationVariant,
    greetingName,
    orderSummary,
    rejectedSummary,
    today,
    transferParagraphs,
    type ConfirmationSummary,
    type ConfirmationTarget,
} from '@/lib/checkout/confirmation';
import type { OrderLoadFailure } from '@/lib/checkout/order-load';
import type { TransferDetails } from '@/lib/payments/transfer';
import { cartStore, useCartStore } from '@/stores/cart';
import { checkoutStore, useCheckoutStore } from '@/stores/checkout';
import { useCartHydrated } from '@/stores/use-cart-hydrated';
import { useCartSynced } from '@/stores/use-cart-synced';
import { useCheckoutHydrated } from '@/stores/use-checkout-hydrated';

/** Modalidad de envío tal como la manda el servidor para el resumen del rechazo. */
export interface ConfirmationShippingType {
    id: number;
    name: string;
    cost: string;
    maxDeliveryDays: number | null;
}

interface ConfirmationViewProps {
    /** Qué se muestra: un pedido hecho o el rechazo (la página ya redirige lo inválido). */
    target: Exclude<ConfirmationTarget, { kind: 'invalid' }>;
    /** Datos bancarios para la transferencia (`getTransferDetails`), o `null` si no están configurados. */
    transfer: TransferDetails | null;
    /** Modalidades de envío vigentes, para poner nombre y coste al envío elegido (solo en el rechazo). */
    shippingTypes: readonly ConfirmationShippingType[];
}

/**
 * Página Confirmar del checkout, paso 4 (Figma: checkout-4-confirmacion, su variante de
 * transferencia y checkout-3-pago-rechazado). Componente de cliente: el pedido y el perfil se
 * piden a la API con la sesión, y el carrito y las elecciones del checkout viven en el navegador.
 *
 * - `?pedido=<id>` con tarjeta: "¡Pedido confirmado!". Con transferencia: "Pedido recibido:
 *   pendiente de pago". Resumen con el pedido guardado.
 * - `?resultado=rechazado`: "¡No se ha podido procesar el pago!", con el paso 4 en rojo. No hay
 *   pedido: el resumen se pinta con el carrito (intacto) y la dirección y el envío elegidos.
 *
 * Al mostrar un pedido hecho se vacía el carrito local y se olvida la compra en curso; en el
 * rechazo no se toca nada.
 *
 * @example
 * <ConfirmationView target={{ kind: 'order', orderId: 4521 }} transfer={null} shippingTypes={[]} />
 */
export function ConfirmationView({ target, transfer, shippingTypes }: ConfirmationViewProps) {
    return (
        <>
            <CheckoutHydrator />
            {target.kind === 'order' ? (
                <PlacedOrder orderId={target.orderId} transfer={transfer} />
            ) : (
                <RejectedPayment shippingTypes={shippingTypes} />
            )}
        </>
    );
}

/** Pedido hecho: lo pide a la API, pinta su variante y cierra la compra en el navegador. */
function PlacedOrder({ orderId, transfer }: { orderId: number; transfer: TransferDetails | null }) {
    const { state, reload } = useConfirmationOrder(orderId);
    const cartHydrated = useCartHydrated();
    const cartSynced = useCartSynced();
    const checkoutHydrated = useCheckoutHydrated();

    const variant = state.status === 'ready' ? confirmationVariant(state.order) : null;

    // Cierre de compra: el servidor ya vació `cart_products`; aquí se vacía el carrito local (el
    // contador de la cabecera marca 0) y se olvida la compra en curso. Se espera a que ambos
    // almacenes estén recuperados (escribir antes los pisaría) y a que el carrito esté
    // sincronizado (si no, una subida pendiente podría volver a llenar el de la cuenta). Las dos
    // acciones solo escriben si algo cambia, así que repetirlas es inocuo.
    const closed = variant !== null && cartHydrated && cartSynced && checkoutHydrated;
    useEffect(() => {
        if (!closed) return;
        cartStore.getState().empty();
        checkoutStore.getState().reset();
    }, [closed]);

    if (state.status === 'loading') return <ConfirmationSkeleton />;

    if (state.status === 'error') {
        return state.reason === 'error' ? (
            <LoadError onRetry={reload} />
        ) : (
            <NotAvailable reason={state.reason} orderId={orderId} />
        );
    }

    if (variant === null) return <NotAvailable reason="not-found" orderId={orderId} />;

    const { order, profile } = state;
    return (
        <ConfirmationFrame summary={orderSummary(order)}>
            {variant === 'card' ? (
                <PlacedResult
                    orderId={order.id}
                    name={greetingName(profile)}
                    text={cardOrderText(order.number, profile?.email ?? null)}
                />
            ) : (
                <PlacedResult
                    orderId={order.id}
                    name={greetingName(profile)}
                    paragraphs={transferParagraphs(order.number, transfer)}
                />
            )}
        </ConfirmationFrame>
    );
}

/** Sin reconciliar el carrito: `useCartLines` pide una función al llegar las líneas. */
const noop = () => {};

/**
 * Pago rechazado: no hay pedido, así que el resumen sale del carrito (que no se toca) y de la
 * dirección y el envío elegidos. Si falta algo (no hay elecciones guardadas, el carrito está vacío
 * o falla una carga) la tarjeta se enseña igual, sin resumen y sin nombre.
 */
function RejectedPayment({
    shippingTypes,
}: {
    shippingTypes: readonly ConfirmationShippingType[];
}) {
    const cartHydrated = useCartHydrated();
    const cartSynced = useCartSynced();
    const checkoutHydrated = useCheckoutHydrated();
    const ready = cartHydrated && cartSynced && checkoutHydrated;

    const cart = useCartStore((state) => state.items);
    const shippingAddressId = useCheckoutStore((state) => state.shippingAddressId);
    const shippingTypeId = useCheckoutStore((state) => state.shippingTypeId);
    const { state: account } = useCheckoutData();
    // Sin reconciliar: en el rechazo no se modifica el carrito.
    const { lines, status } = useCartLines(ready ? cart.map((item) => item.variantId) : [], noop);

    const summary = useMemo<ConfirmationSummary | null>(() => {
        if (!ready || account.status !== 'ready' || status !== 'ready') return null;
        const address = account.addresses.find((candidate) => candidate.id === shippingAddressId);
        const shippingType = shippingTypes.find((candidate) => candidate.id === shippingTypeId);
        if (!address || !shippingType) return null;
        return rejectedSummary({ cart, lines, shippingType, address, today: today() });
    }, [ready, account, status, shippingAddressId, shippingTypeId, shippingTypes, cart, lines]);

    // Con el carrito vacío `useCartLines` no pide nada y se queda en 'loading': no hay que esperarlo.
    const loading =
        !ready || account.status === 'loading' || (cart.length > 0 && status === 'loading');
    if (loading) return <ConfirmationSkeleton />;

    const name = account.status === 'ready' ? greetingName(account.profile) : null;
    return (
        <ConfirmationFrame errorStep summary={summary}>
            <RejectedResult name={name} />
        </ConfirmationFrame>
    );
}

/** El pedido no se puede enseñar: no existe o es de otra cuenta, no encaja con ninguna variante, o falta la sesión. */
function NotAvailable({
    reason,
    orderId,
}: {
    reason: Exclude<OrderLoadFailure, 'error'>;
    orderId: number;
}) {
    const callbackUrl = encodeURIComponent(`/checkout/confirmacion?pedido=${orderId}`);
    return (
        <div className="flex flex-col gap-12">
            <CheckoutSteps current={3} />
            <h1 className="min-h-12 font-display text-4xl">Confirmar</h1>
            {reason === 'unauthorized' ? (
                <EmptyState
                    titleAs="h2"
                    title="Inicia sesión para ver tu pedido"
                    description={
                        <span className="text-xl font-medium text-foreground">
                            Tu sesión ha caducado.
                        </span>
                    }
                    action={
                        <Button asChild variant="brand">
                            <Link href={`/auth/login?callbackUrl=${callbackUrl}`}>
                                Iniciar sesión
                            </Link>
                        </Button>
                    }
                    className="max-xl:min-h-0"
                />
            ) : (
                <EmptyState
                    titleAs="h2"
                    title="No encontramos este pedido"
                    description={
                        <span className="text-xl font-medium text-foreground">
                            Es posible que el enlace no sea correcto o que el pedido no sea de tu
                            cuenta.
                        </span>
                    }
                    action={
                        <Button asChild variant="brand">
                            <Link href="/productos">Seguir comprando</Link>
                        </Button>
                    }
                    className="max-xl:min-h-0"
                />
            )}
        </div>
    );
}

/** Fallo de red, de tiempo o del servidor al pedir el pedido: aviso con "Reintentar" (como el carrito). */
function LoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col gap-12">
            <CheckoutSteps current={3} />
            <h1 className="min-h-12 font-display text-4xl">Confirmar</h1>
            <Alert
                type="error"
                title="No hemos podido cargar tu pedido"
                action={
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        Reintentar
                    </Button>
                }
            >
                Comprueba tu conexión e inténtalo de nuevo.
            </Alert>
        </div>
    );
}
