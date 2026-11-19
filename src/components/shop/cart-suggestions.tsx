import { ProductCard } from '@/components/shop/product-card';
import { ShopCarousel } from '@/components/shop/shop-carousel';
import { getFeaturedProducts } from '@/lib/db/queries';

/** Cuántos productos enseña "También te puede gustar" (4 en el diseño). */
const SUGGESTIONS_COUNT = 4;

/**
 * "También te puede gustar" del carrito: 4 productos al azar, primero entre los nuevos y, si no
 * llegan, del resto del catálogo (`getFeaturedProducts`). El servidor no conoce el carrito (vive en
 * el navegador), así que no se pueden elegir según lo que hay en él. Si el catálogo no tiene
 * productos, no se pinta la sección.
 *
 * Es el mismo carrusel que en la ficha (`ProductRelated`), con las 4 tarjetas repartiéndose el
 * ancho desde 1280 px.
 *
 * @example
 * <Suspense fallback={<ProductRelatedSkeleton />}><CartSuggestions /></Suspense>
 */
export async function CartSuggestions() {
    const items = await getFeaturedProducts({ limit: SUGGESTIONS_COUNT });
    if (items.length === 0) return null;

    return (
        <ShopCarousel title="También te puede gustar" itemClassName="xl:w-[calc((100%-6rem)/4)]">
            {items.map((item) => (
                <ProductCard key={item.id} product={item} className="w-full" />
            ))}
        </ShopCarousel>
    );
}
