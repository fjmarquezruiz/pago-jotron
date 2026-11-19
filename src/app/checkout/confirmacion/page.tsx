import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CartSuggestions } from '@/components/shop/cart-suggestions';
import { CatalogHero } from '@/components/shop/catalog-hero';
import { ConfirmationView } from '@/components/shop/confirmation-view';
import { ProductRelatedSkeleton } from '@/components/shop/product-skeleton';
import { parseConfirmationParams, type ConfirmationParams } from '@/lib/checkout/confirmation';
import { getShippingTypes } from '@/lib/db/queries';
import { getTransferDetails } from '@/lib/payments/transfer';

/** Depende de la URL y de los datos bancarios del entorno, y las sugerencias son al azar: no se cachea. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Confirmar pedido | Pago de Jotrón' };

/**
 * Confirmar, paso 4 del checkout (Figma: checkout-4-confirmacion, su variante de transferencia y
 * checkout-3-pago-rechazado): cabecera de la tienda, `ConfirmationView` (de cliente) y "También te
 * puede gustar". Tres variantes en la misma ruta, según la URL (`parseConfirmationParams`):
 *
 * - `?pedido=<id>`: el pedido hecho, con tarjeta o con transferencia.
 * - `?resultado=rechazado`: el pago rechazado.
 * - Cualquier otra cosa: redirige al carrito.
 *
 * Es privada (el middleware protege `/checkout`). Del servidor salen los datos bancarios (solo
 * para un pedido: la transferencia) y las modalidades de envío (solo en el rechazo, para nombrar
 * el envío elegido); el pedido lo pide el cliente a `GET /api/pedidos/[id]`, que comprueba que sea
 * de la sesión.
 */
export default async function ConfirmationPage({
    searchParams,
}: {
    searchParams: ConfirmationParams;
}) {
    const target = parseConfirmationParams(searchParams);
    if (target.kind === 'invalid') redirect('/carrito');

    const shippingTypes =
        target.kind === 'rejected'
            ? (await getShippingTypes()).map(({ id, name, cost, maxDeliveryDays }) => ({
                  id,
                  name,
                  cost,
                  maxDeliveryDays,
              }))
            : [];

    return (
        <main>
            <CatalogHero titleAs="p" />
            <div className="px-6 py-16 lg:py-40">
                <div className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40">
                    <ConfirmationView
                        target={target}
                        transfer={target.kind === 'order' ? getTransferDetails() : null}
                        shippingTypes={shippingTypes}
                    />
                    <Suspense fallback={<ProductRelatedSkeleton />}>
                        <CartSuggestions />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
