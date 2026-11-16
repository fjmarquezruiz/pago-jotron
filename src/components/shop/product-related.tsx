import { ProductCard } from '@/components/shop/product-card';
import { getRelatedProducts, type ProductDetail } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

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
 * Cuatro tarjetas desde `lg` (1024 px) y dos por debajo, como el diseño móvil: a 1024 px cada
 * tarjeta mide unos 220 px, justo para que los nombres largos pasen a tres líneas sin romperse.
 * Es `w-full`: la página la coloca en un contenedor de 1440 px como máximo.
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
        <section aria-labelledby="related-title" className="flex w-full flex-col gap-8 lg:gap-12">
            <div className="flex min-h-9 items-center lg:min-h-12 lg:items-baseline">
                <h2
                    id="related-title"
                    className="font-display text-3xl font-medium lg:text-4xl lg:font-normal"
                >
                    También te puede gustar
                </h2>
            </div>
            <ul className="flex items-stretch gap-6 lg:gap-8">
                {related.map((item, index) => (
                    <li
                        key={item.id}
                        className={cn('min-w-0 flex-1', index >= 2 ? 'hidden lg:flex' : 'flex')}
                    >
                        <ProductCard product={item} className="w-full" />
                    </li>
                ))}
            </ul>
        </section>
    );
}
