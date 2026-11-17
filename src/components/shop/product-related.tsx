import { ProductCard } from '@/components/shop/product-card';
import { ShopCarousel } from '@/components/shop/shop-carousel';
import { getRelatedProducts, type ProductDetail } from '@/lib/db/queries';

/** Cuántos productos recomienda la ficha. */
const RELATED_COUNT = 4;

interface ProductRelatedProps {
    /** Producto de la ficha: de él salen su id, su bodega y su tipología. */
    product: Pick<ProductDetail, 'id' | 'wineryId' | 'typologyId'>;
}

/**
 * Sección "También te puede gustar": título y una fila de tarjetas con 4 productos al azar,
 * primero de la misma bodega y, si no hay suficientes, de la misma tipología y después del resto
 * del catálogo (`getRelatedProducts`). Nunca incluye el producto de la ficha. Si no hay ningún
 * otro producto a la venta, no pinta nada.
 *
 * Es el mismo carrusel que "Nuestros favoritos" (`ShopCarousel`): cuántas tarjetas se ven a la
 * vez depende del ancho (1 por debajo de 640 px, 2 hasta 1023, 3 hasta 1279 y las 4 repartiéndose
 * el ancho desde 1280). Las flechas solo salen cuando no caben las 4, así que en escritorio no
 * hay flechas. Ocupa todo el ancho de su contenedor, de 1440 px como máximo.
 *
 * @example
 * <ProductRelated product={product} />
 */
export async function ProductRelated({ product }: ProductRelatedProps) {
    const related = await getRelatedProducts({
        productId: product.id,
        wineryId: product.wineryId,
        typologyId: product.typologyId,
        limit: RELATED_COUNT,
    });
    if (related.length === 0) return null;

    return (
        <ShopCarousel title="También te puede gustar" itemClassName="xl:w-[calc((100%-6rem)/4)]">
            {related.map((item) => (
                <ProductCard key={item.id} product={item} className="w-full" />
            ))}
        </ShopCarousel>
    );
}
