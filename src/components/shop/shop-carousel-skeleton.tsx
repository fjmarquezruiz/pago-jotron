import { ProductCardSkeleton } from '@/components/shop/product-card-skeleton';
import {
    CAROUSEL_GAP_CLASS,
    CAROUSEL_HEADER_CLASS,
    CAROUSEL_ITEM_CLASS,
    CAROUSEL_SECTION_CLASS,
    CAROUSEL_TITLE_CLASS,
} from '@/components/shop/carousel-layout';
import { cn } from '@/lib/utils';

interface ShopCarouselSkeletonProps {
    /** Título de la sección: es texto fijo, así que se pinta de verdad y no solo su hueco. */
    title: string;
    /** Cuántas tarjetas de relleno (por defecto 4, las que bastan para llenar la fila). */
    count?: number;
    /** Las mismas clases que se le pasan a `ShopCarousel` para cambiar el ancho de cada tarjeta. */
    itemClassName?: string;
}

/**
 * Esqueleto de un `ShopCarousel` de productos mientras carga su consulta ("Nuestros favoritos",
 * "También te puede gustar"). Usa las mismas clases de tamaño que el carrusel real
 * (`carousel-layout.ts`), con el título ya escrito y sin flechas: sin datos no hay nada que
 * desplazar, y el carrusel las pinta solo cuando hay desbordamiento.
 *
 * @example
 * <Suspense fallback={<ShopCarouselSkeleton title="Nuestros favoritos" />}>
 *     <FavoritesSection />
 * </Suspense>
 */
export function ShopCarouselSkeleton({
    title,
    count = 4,
    itemClassName,
}: ShopCarouselSkeletonProps) {
    return (
        <section aria-busy="true" className={CAROUSEL_SECTION_CLASS}>
            <div className={CAROUSEL_HEADER_CLASS}>
                <h2 className={CAROUSEL_TITLE_CLASS}>{title}</h2>
            </div>
            <ul aria-hidden="true" className={cn('flex overflow-hidden', CAROUSEL_GAP_CLASS)}>
                {Array.from({ length: count }, (_, index) => (
                    <li key={index} className={cn(CAROUSEL_ITEM_CLASS, itemClassName)}>
                        <ProductCardSkeleton />
                    </li>
                ))}
            </ul>
        </section>
    );
}
