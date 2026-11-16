import { ProductCard } from '@/components/shop/product-card';
import { ShopCarousel } from '@/components/shop/shop-carousel';
import { getFeaturedProducts } from '@/lib/db/queries';

/** Cuántos productos enseña "Nuestros favoritos". */
const FAVORITES_COUNT = 8;

/**
 * "Nuestros favoritos": una selección al azar de hasta 8 productos del catálogo, entre los nuevos
 * y, si no llegan, completada con el resto (`getFeaturedProducts`). Cambia en cada carga. Si el
 * catálogo no tiene ningún producto visible, no se pinta la sección.
 *
 * Es un Server Component: lee de la BD y entrega las tarjetas al carrusel, que es el único trozo
 * con estado.
 *
 * @example
 * <FavoritesSection />
 */
export async function FavoritesSection() {
    const items = await getFeaturedProducts({ limit: FAVORITES_COUNT });
    if (items.length === 0) return null;

    return (
        <ShopCarousel title="Nuestros favoritos">
            {items.map((item) => (
                <ProductCard key={item.id} product={item} className="w-full" />
            ))}
        </ShopCarousel>
    );
}
