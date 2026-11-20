import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CartSuggestions } from '@/components/shop/cart-suggestions';
import { CatalogHero } from '@/components/shop/catalog-hero';
import { PaymentView } from '@/components/shop/payment-view';
import { ProductRelatedSkeleton } from '@/components/shop/product-skeleton';
import { deliveryOptions } from '@/lib/catalog/shipping';
import { getShippingTypes } from '@/lib/db/queries';
import { getTransferDetails } from '@/lib/payments/transfer';

/** Las modalidades de envío cambian desde el panel de administración y los datos bancarios salen del entorno: no se cachea. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Pago | Pago de Jotrón' };

/**
 * Pago, paso 3 del checkout (RF7; Figma: checkout-3-pago, checkout-3-pago-error y
 * checkout-3-pago-transferencia): cabecera de la tienda, `PaymentView` (de cliente: el carrito y
 * las elecciones de Datos viven en el navegador) y "También te puede gustar", con el mismo esqueleto
 * que el carrito. El footer lo pone el layout del checkout.
 *
 * Es privada: el middleware manda a `/auth/login?callbackUrl=/checkout/pago` a quien no tiene sesión.
 *
 * Del servidor salen las modalidades de envío con plazo y, si están configurados
 * (`BANK_TRANSFER_HOLDER` y `BANK_TRANSFER_IBAN`), el titular y el IBAN de la transferencia; sin
 * ellos esa pestaña no se ofrece. Se pasan ya serializados (solo los campos que usa el cliente).
 */
export default async function PaymentPage() {
    const options = deliveryOptions(await getShippingTypes()).map(
        ({ id, name, cost, minDeliveryDays, maxDeliveryDays }) => ({
            id,
            name,
            cost,
            minDeliveryDays,
            maxDeliveryDays,
        }),
    );

    return (
        <main>
            <CatalogHero titleAs="p" />
            <div className="px-6 py-16 lg:py-40">
                <div className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40">
                    <PaymentView shippingOptions={options} transfer={getTransferDetails()} />
                    <Suspense fallback={<ProductRelatedSkeleton />}>
                        <CartSuggestions />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
