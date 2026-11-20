'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutDataContent } from '@/components/shop/checkout-data-content';
import { CheckoutDataSkeleton } from '@/components/shop/checkout-data-skeleton';
import { CheckoutHydrator } from '@/components/shop/checkout-hydrator';
import { CheckoutSteps } from '@/components/shop/checkout-steps';
import type { ShippingChoice } from '@/components/shop/checkout-summary';
import { useCartLines } from '@/components/shop/use-cart-lines';
import { useCheckoutData } from '@/components/shop/use-checkout-data';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { QuoteLineInput } from '@/lib/orders/quote';
import { useCartStore } from '@/stores/cart';
import { useCartHydrated } from '@/stores/use-cart-hydrated';
import { useCartSynced } from '@/stores/use-cart-synced';
import { useCheckoutHydrated } from '@/stores/use-checkout-hydrated';

interface CheckoutDataViewProps {
    /** Modalidades de envío con plazo (`deliveryOptions(await getShippingTypes())`). */
    shippingOptions: ShippingChoice[];
}

/** El carrito ya está al día: no hay que corregir nada aquí. `onLoaded` de `useCartLines` es obligatorio. */
function ignoreLines() {}

/**
 * Paso 2 del checkout, "Datos" (RF7, Figma: checkout-2-datos). Es de cliente porque el carrito y
 * las elecciones del checkout viven en el navegador. Reúne lo que hace falta antes de pintar el
 * formulario (`CheckoutDataContent`) y decide qué enseñar:
 *
 * - Mientras se recuperan el carrito (y su sincronización con la cuenta) y las elecciones del
 *   checkout, y se cargan la cuenta y las líneas del carrito: esqueleto (`CheckoutDataSkeleton`).
 * - **Carrito vacío: se redirige a `/carrito`** (`router.replace`, sin dejar `/checkout` en el
 *   historial), donde está el estado vacío con "Seguir comprando"; en el entretanto, esqueleto. Es
 *   lo mismo que ve quien llega aquí sin nada que comprar.
 * - **Carrito desactualizado** (una línea ya no se vende o pide más unidades que el stock): también
 *   a `/carrito`, que es quien pone el carrito al día y avisa de lo que ha cambiado (`CartView`).
 * - Sin sesión (401, solo si caduca: la ruta ya está tras el middleware): al inicio de sesión.
 * - Si falla la carga de la cuenta o de las líneas: aviso de error con "Reintentar".
 *
 * @example
 * <CheckoutDataView shippingOptions={deliveryOptions(await getShippingTypes())} />
 */
export function CheckoutDataView({ shippingOptions }: CheckoutDataViewProps) {
    const router = useRouter();
    const cartHydrated = useCartHydrated();
    const synced = useCartSynced();
    const checkoutHydrated = useCheckoutHydrated();
    const ready = cartHydrated && synced && checkoutHydrated;
    const items = useCartStore((state) => state.items);

    const {
        lines,
        status,
        retry: retryLines,
    } = useCartLines(ready ? items.map((item) => item.variantId) : [], ignoreLines);
    const { state, reload } = useCheckoutData();

    const empty = ready && items.length === 0;
    const outdated =
        ready &&
        status === 'ready' &&
        items.some((item) => {
            const line = lines.find((candidate) => candidate.variantId === item.variantId);
            return !line || line.stock < item.quantity;
        });
    const unauthorized = state.status === 'error' && state.reason === 'unauthorized';

    useEffect(() => {
        if (empty || outdated) router.replace('/carrito');
        else if (unauthorized) router.replace('/auth/login?callbackUrl=%2Fcheckout');
    }, [empty, outdated, unauthorized, router]);

    // Un `useMemo` por referencia estable: el presupuesto de `CheckoutDataContent` depende de ella.
    const quoteLines = useMemo<QuoteLineInput[]>(
        () =>
            items.flatMap((item) => {
                const line = lines.find((candidate) => candidate.variantId === item.variantId);
                return line
                    ? [{ quantity: item.quantity, price: line.price, taxRate: line.taxRate }]
                    : [];
            }),
        [items, lines],
    );

    let content: React.ReactNode;
    if (!ready || empty || outdated || unauthorized) {
        content = <CheckoutDataSkeleton />;
    } else if (status === 'error' || state.status === 'error') {
        content = (
            <div className="flex flex-col gap-12">
                <CheckoutSteps current={1} />
                <h1 className="sr-only">Datos</h1>
                <Alert
                    type="error"
                    title="No hemos podido cargar tus datos"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (status === 'error') retryLines();
                                if (state.status === 'error') reload();
                            }}
                        >
                            Reintentar
                        </Button>
                    }
                >
                    Comprueba tu conexión e inténtalo de nuevo.
                </Alert>
            </div>
        );
    } else if (status === 'loading' || state.status === 'loading') {
        content = <CheckoutDataSkeleton />;
    } else {
        content = (
            <CheckoutDataContent
                profile={state.profile}
                addresses={state.addresses}
                shippingOptions={shippingOptions}
                quoteLines={quoteLines}
            />
        );
    }

    return (
        <>
            <CheckoutHydrator />
            {content}
        </>
    );
}
