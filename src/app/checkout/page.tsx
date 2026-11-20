import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CartSuggestions } from '@/components/shop/cart-suggestions';
import { CatalogHero } from '@/components/shop/catalog-hero';
import { CheckoutDataView } from '@/components/shop/checkout-data-view';
import { ProductRelatedSkeleton } from '@/components/shop/product-skeleton';
import { deliveryOptions } from '@/lib/catalog/shipping';
import { getShippingTypes } from '@/lib/db/queries';

/** Las modalidades de envío cambian desde el panel de administración, y las sugerencias son al azar: no se cachea. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Datos | Pago de Jotrón' };

/**
 * Checkout, paso 2: Datos (RF7, Figma: checkout-2-datos, -v2 y -error). Cabecera de la tienda, el
 * formulario de contacto y dirección con el resumen del pedido (`CheckoutDataView`, de cliente
 * porque el carrito y las elecciones viven en el navegador) y "También te puede gustar".
 *
 * Es privada: el middleware manda a `/auth/login?callbackUrl=/checkout` a quien no tiene sesión.
 * Del servidor salen las modalidades de envío con plazo; el resto lo carga el cliente (cuenta,
 * direcciones y líneas del carrito). "También te puede gustar" va en un `Suspense`: carga aparte.
 */
export default async function CheckoutPage() {
    const shippingOptions = deliveryOptions(await getShippingTypes());

    return (
        <main>
            <CatalogHero titleAs="p" />
            <div className="px-6 py-16 lg:py-40">
                <div className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40">
                    <CheckoutDataView shippingOptions={shippingOptions} />
                    <Suspense fallback={<ProductRelatedSkeleton />}>
                        <CartSuggestions />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
