import { ProductCardSkeleton } from '@/components/shop/product-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/** Anchos de los 6 selects de la barra, los mismos que `CatalogFilters` (Figma: WinesFilter). */
const SELECT_WIDTHS = ['w-40', 'w-45', 'w-40', 'w-35', 'w-32.5', 'w-32.5'];

/** Etiqueta de un campo: texto fijo, se pinta de verdad con el mismo estilo que la real. */
function FieldLabelText({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-medium text-muted-foreground">{children}</span>;
}

/**
 * Esqueleto de la barra de búsqueda, filtros y orden (`CatalogFilters`) mientras carga el
 * listado. Misma rejilla y mismas medidas: "Filtrar por" con los 6 selects desde `lg` (por debajo,
 * un botón "Filtros"), el buscador y "Ordenar por" a la derecha y la línea de "Mostrando…". Las
 * etiquetas son texto fijo, así que se pintan de verdad; solo los controles son esqueleto.
 *
 * @example
 * <CatalogFiltersSkeleton />
 */
export function CatalogFiltersSkeleton() {
    return (
        <div aria-hidden="true" className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="order-2 flex min-w-0 flex-col lg:order-1">
                    <div className="hidden flex-col gap-gap-xs lg:flex">
                        <FieldLabelText>Filtrar por</FieldLabelText>
                        <div className="flex flex-wrap gap-4">
                            {SELECT_WIDTHS.map((width, index) => (
                                <Skeleton
                                    key={index}
                                    className={`h-control-md rounded-sm ${width}`}
                                />
                            ))}
                        </div>
                    </div>
                    <Skeleton className="h-control-md w-full rounded-sm lg:hidden" />
                </div>
                <div className="order-1 flex flex-col gap-gap-xs lg:order-2">
                    <FieldLabelText>Buscar</FieldLabelText>
                    <Skeleton className="h-control-md w-full rounded-sm" />
                </div>
            </div>
            <div className="grid grid-cols-1 items-end gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="order-2 flex h-10 items-center lg:order-1">
                    <Skeleton variant="text" className="w-40" />
                </div>
                <div className="order-1 flex flex-col gap-gap-xs lg:order-2">
                    <FieldLabelText>Ordenar por</FieldLabelText>
                    <Skeleton className="h-control-md w-full rounded-sm" />
                </div>
            </div>
        </div>
    );
}

/**
 * Esqueleto de la rejilla de productos del listado: 12 tarjetas con las mismas columnas y huecos
 * que la real (1 columna bajo 640 px, 2 hasta 1023, 3 hasta 1279 y 4 desde 1280).
 *
 * @example
 * <CatalogGridSkeleton />
 */
export function CatalogGridSkeleton() {
    return (
        <ul
            aria-hidden="true"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8"
        >
            {Array.from({ length: 12 }, (_, index) => (
                <li key={index} className="grid min-w-0">
                    <ProductCardSkeleton />
                </li>
            ))}
        </ul>
    );
}
