import { ShopCarouselSkeleton } from '@/components/shop/shop-carousel-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Esqueleto de "También te puede gustar" para el `Suspense` de la ficha: el mismo carrusel de
 * relleno con las mismas clases de ancho que usa `ProductRelated` (las 4 tarjetas se reparten el
 * ancho desde 1280 px).
 *
 * @example
 * <Suspense fallback={<ProductRelatedSkeleton />}><ProductRelated product={product} /></Suspense>
 */
export function ProductRelatedSkeleton() {
    return (
        <ShopCarouselSkeleton
            title="También te puede gustar"
            itemClassName="xl:w-[calc((100%-6rem)/4)]"
        />
    );
}

/**
 * Líneas de texto de relleno. `extra` añade líneas solo por debajo de `lg`, donde el texto ocupa
 * una columna más estrecha y se parte en más líneas. La última línea visible es más corta.
 */
function TextLines({ lines, extra = 0 }: { lines: number; extra?: number }) {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: lines + extra }, (_, index) => {
                const isLast = index === lines + extra - 1;
                const isLastOnDesktop = index === lines - 1;
                return (
                    <Skeleton
                        key={index}
                        variant="text"
                        className={cn(
                            index >= lines && 'lg:hidden',
                            isLast ? 'w-2/3' : 'w-full',
                            isLastOnDesktop && extra > 0 && 'lg:w-2/3',
                        )}
                    />
                );
            })}
        </div>
    );
}

/**
 * Esqueleto del contenido de la ficha de producto (`/productos/[slug]`) mientras se carga el
 * producto: la imagen a la izquierda, y a la derecha la cabecera (ruta, título, D.O. y etiquetas),
 * el bloque de compra, el envío, las notas de cata y la ficha técnica y las recomendaciones.
 * Sigue el mismo marco y las mismas columnas que la página (`max-w-9xl` y `max-w-6xl`, dos
 * columnas desde `lg`).
 *
 * No incluye la cabecera del sitio (la pinta la página de carga). Se anuncia como una carga con
 * `role="status"`; los bloques son decorativos.
 *
 * @example
 * <ProductPageSkeleton />
 */
export function ProductPageSkeleton() {
    return (
        <main aria-busy="true" className="px-6 py-16 lg:py-40">
            <span role="status" className="sr-only">
                Cargando el producto
            </span>
            <div
                aria-hidden="true"
                className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40"
            >
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 lg:flex-row lg:items-start">
                    <div className="min-w-0 lg:flex-1">
                        {/* Misma caja que `ProductImage`: relleno en móvil y alto fijo desde lg. */}
                        <Skeleton className="flex w-full items-center justify-center rounded-sm px-18 py-10 lg:h-180 lg:px-0 lg:py-0">
                            <div className="aspect-[2/3] min-w-0 flex-1 lg:w-100 lg:flex-none" />
                        </Skeleton>
                    </div>
                    <div className="flex min-w-0 flex-col gap-12 lg:flex-1">
                        {/* Cabecera: ruta, título (dos líneas), D.O. y etiquetas. */}
                        <div className="flex flex-col gap-4">
                            <Skeleton variant="text" className="h-6 w-48" />
                            <div className="flex flex-col gap-2 lg:gap-4">
                                <Skeleton className="h-11 w-4/5 lg:h-16" />
                                <Skeleton className="h-11 w-3/5 lg:h-16" />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <Skeleton className="h-8 w-44" />
                                <Skeleton className="h-control-xxs w-20 rounded-full" />
                            </div>
                        </div>
                        {/* Descripción y precio. */}
                        <div className="flex flex-col gap-6">
                            <TextLines lines={4} extra={2} />
                            <Skeleton className="h-12 w-40" />
                        </div>
                        {/* Presentación, cantidad y botón. */}
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                                <div className="flex flex-col gap-2 lg:flex-1">
                                    <Skeleton variant="text" className="h-5 w-24" />
                                    <div className="flex gap-3">
                                        <Skeleton className="h-control-md w-28 rounded-sm" />
                                        <Skeleton className="h-control-md w-28 rounded-sm" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 lg:w-40 lg:shrink-0">
                                    <Skeleton variant="text" className="h-5 w-20" />
                                    <Skeleton className="h-control-md w-full rounded-sm" />
                                </div>
                            </div>
                            <Skeleton className="h-control-lg w-full rounded-sm" />
                        </div>
                        {/* Envío y devoluciones. */}
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-9 w-48" />
                            <TextLines lines={2} />
                        </div>
                    </div>
                </div>
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 flex-col gap-6 lg:flex-1">
                        <Skeleton className="h-9 w-48" />
                        <TextLines lines={5} />
                    </div>
                    <div className="flex min-w-0 flex-col gap-6 lg:flex-1">
                        <Skeleton className="h-9 w-48" />
                        <TextLines lines={6} />
                    </div>
                </div>
                <ProductRelatedSkeleton />
            </div>
        </main>
    );
}
