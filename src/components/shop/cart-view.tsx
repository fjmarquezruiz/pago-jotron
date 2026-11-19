'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CartItemsTable, type CartRow } from '@/components/shop/cart-items-table';
import { CartNotices } from '@/components/shop/cart-notices';
import { CartSkeleton } from '@/components/shop/cart-skeleton';
import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { CartSummary, type CartDelivery } from '@/components/shop/cart-summary';
import { useCartLines } from '@/components/shop/use-cart-lines';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { describeChanges } from '@/lib/cart/notices';
import { cartSubtotalCents, cartUnits, formatItemCount } from '@/lib/cart/totals';
import { useCartStore } from '@/stores/cart';
import { useCartHydrated } from '@/stores/use-cart-hydrated';
import { useCartSynced } from '@/stores/use-cart-synced';

interface CartViewProps {
    /** El envío más barato con plazo (`cheapestDelivery`), o `null` si no hay ninguno. */
    delivery: CartDelivery | null;
}

/**
 * Página del carrito (RF6, Figma: checkout-1-carrito y carrito-vacio). Es un componente de cliente
 * porque el carrito vive en el navegador (`localStorage`); el precio y el stock se piden al
 * servidor (`useCartLines`).
 *
 * Estados:
 * - Mientras se recupera el carrito y se cargan sus líneas: esqueleto.
 * - Carrito vacío: los pasos atenuados y el estado vacío con "Seguir comprando".
 * - Con líneas: pasos, título con el número de unidades, tabla, resumen y, si lo hay, el aviso de
 *   lo que ha cambiado.
 * - Si falla la carga: un aviso de error con "Reintentar".
 *
 * Al llegar las líneas se pone el carrito al día (`reconcileCart`): lo agotado o retirado se quita y
 * las cantidades se ajustan al stock, y un aviso (`CartNotices`) cuenta qué ha pasado y por qué.
 *
 * @example
 * <CartView delivery={cheapestDelivery(await getShippingTypes())} />
 */
export function CartView({ delivery }: CartViewProps) {
    const hydrated = useCartHydrated();
    // Con sesión, el carrito de la cuenta puede diferir del local: se espera a la sincronización
    // para no enseñar un momento un carrito que va a cambiar.
    const synced = useCartSynced();
    const ready = hydrated && synced;
    const items = useCartStore((state) => state.items);
    const setQuantity = useCartStore((state) => state.setQuantity);
    const remove = useCartStore((state) => state.remove);
    const reconcile = useCartStore((state) => state.reconcile);
    const [notices, setNotices] = useState<string[]>([]);

    // Hasta que el carrito está listo no se piden líneas: los ids pueden cambiar con la sincronización.
    const { lines, status, retry } = useCartLines(
        ready ? items.map((item) => item.variantId) : [],
        (loaded) => {
            // Se acumulan: una recarga posterior que no cambie nada no debe borrar un aviso sin leer.
            const messages = describeChanges(reconcile(loaded), loaded);
            if (messages.length > 0) {
                setNotices((previous) => [
                    ...previous,
                    ...messages.filter((message) => !previous.includes(message)),
                ]);
            }
        },
    );

    const noticeAlert = notices.length > 0 && (
        <CartNotices messages={notices} onClose={() => setNotices([])} />
    );

    if (!ready) return <CartSkeleton />;

    if (items.length === 0) {
        return (
            <div className="flex flex-col gap-12">
                <CheckoutSteps dimmed />
                {noticeAlert}
                <EmptyState
                    titleAs="h1"
                    title="Tu carrito está vacío"
                    description={
                        <span className="text-xl font-medium text-foreground">
                            Parece que todavía no has añadido nada a tu carrito.
                        </span>
                    }
                    action={
                        <Button asChild variant="brand">
                            <Link href="/productos">Seguir comprando</Link>
                        </Button>
                    }
                    className="h-182"
                />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col gap-12">
                <CheckoutSteps />
                <h1 className="sr-only">Tu carrito</h1>
                <Alert
                    type="error"
                    title="No hemos podido cargar tu carrito"
                    action={
                        <Button variant="outline" size="sm" onClick={retry}>
                            Reintentar
                        </Button>
                    }
                >
                    Comprueba tu conexión e inténtalo de nuevo.
                </Alert>
            </div>
        );
    }

    if (status === 'loading') return <CartSkeleton />;

    const rows = items.flatMap((item): CartRow[] => {
        const line = lines.find((candidate) => candidate.variantId === item.variantId);
        return line ? [{ line, quantity: item.quantity }] : [];
    });

    return (
        <div className="flex flex-col gap-12">
            <CheckoutSteps />
            <div className="flex min-h-12 items-baseline gap-4">
                <h1 className="font-display text-4xl">Tu carrito</h1>
                <p className="text-base text-muted-foreground">
                    ({formatItemCount(cartUnits(items))})
                </p>
            </div>
            {noticeAlert}
            <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <CartItemsTable
                        rows={rows}
                        onQuantityChange={(line, quantity) =>
                            setQuantity(line.variantId, quantity, line.stock)
                        }
                        onRemove={(line) => remove(line.variantId)}
                    />
                </div>
                <CartSummary subtotalCents={cartSubtotalCents(items, lines)} delivery={delivery} />
            </div>
        </div>
    );
}
