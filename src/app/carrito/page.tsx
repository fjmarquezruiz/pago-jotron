import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CartSuggestions } from '@/components/shop/cart-suggestions';
import { CartView } from '@/components/shop/cart-view';
import { CatalogHero } from '@/components/shop/catalog-hero';
import { ProductRelatedSkeleton } from '@/components/shop/product-skeleton';
import { cheapestDelivery } from '@/lib/catalog/shipping';
import { getShippingTypes } from '@/lib/db/queries';

/** Las modalidades de envío cambian desde el panel de administración, y las sugerencias son al azar: no se cachea. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Tu carrito | Pago de Jotrón' };

/**
 * Carrito (RF6, Figma: checkout-1-carrito y carrito-vacio): cabecera de la tienda, el carrito
 * (`CartView`, de cliente porque el carrito vive en el navegador) y "También te puede gustar".
 *
 * Es pública: se puede ver y llenar sin sesión, pero con la verificación de edad como el resto de
 * la tienda. Para continuar hace falta sesión: "Continuar" lleva a `/checkout` y el middleware
 * manda a `/auth/login?callbackUrl=/checkout` a quien no la tiene.
 *
 * Del servidor solo sale el envío más barato con plazo, para el resumen ("Envío desde…" y la
 * entrega estimada). "También te puede gustar" va en un `Suspense`: carga aparte.
 */
export default async function CartPage() {
    const delivery = cheapestDelivery(await getShippingTypes());

    return (
        <main>
            <CatalogHero titleAs="p" />
            <div className="px-6 py-16 lg:py-40">
                <div className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40">
                    <CartView delivery={delivery} />
                    <Suspense fallback={<ProductRelatedSkeleton />}>
                        <CartSuggestions />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
