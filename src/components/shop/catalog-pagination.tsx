import { CatalogLink } from '@/components/shop/catalog-pending';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationSummary,
} from '@/components/ui/pagination';
import { catalogResultsHref, type CatalogUrlState } from '@/lib/catalog/catalog-url';
import { getPageWindow } from '@/lib/catalog/pagination';

interface CatalogPaginationProps extends CatalogUrlState {
    /** Página actual, ya ajustada al rango (`getPagination`). */
    page: number;
    /** Número total de páginas. */
    totalPages: number;
}

/**
 * Paginación del listado (Figma: Pagination, talla lg de 48 px). Cada página es un enlace
 * `?page=N`, no un botón: se abre en otra pestaña, los buscadores la recorren y el botón
 * Atrás funciona. Desde `md` es la variante `full` (Anterior, números con `…` y Siguiente); por
 * debajo, la `mobile` (Anterior, "Página X de Y" y Siguiente, solo con las flechas). En la primera
 * y la última página, Anterior y Siguiente quedan deshabilitados, sin enlace. No pinta nada si
 * hay una sola página.
 *
 * Los enlaces conservan la búsqueda, los filtros y el orden (`filters` y `orden`): pasar de página
 * no los pierde, y llevan el ancla `#resultados`: al cambiar de página se baja a los resultados
 * en vez de volver al inicio de la página, por encima del hero. Son `CatalogLink`: al pulsarlos, el listado se marca como cargando mientras llega
 * la página nueva (hay que usarla dentro de `CatalogPendingProvider`).
 *
 * @example
 * <CatalogPagination page={3} totalPages={10} filters={{ tipologia: 1 }} orden="nombre" />
 */
export function CatalogPagination({ page, totalPages, filters, orden }: CatalogPaginationProps) {
    if (totalPages <= 1) return null;

    const href = (target: number) => catalogResultsHref(target, { filters, orden });

    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    const previous = (
        <PaginationPrevious size="lg" variant="ghost" disabled={!hasPrevious} asChild>
            <CatalogLink href={href(page - 1)} rel="prev" />
        </PaginationPrevious>
    );
    const next = (
        <PaginationNext size="lg" variant="ghost" disabled={!hasNext} asChild>
            <CatalogLink href={href(page + 1)} rel="next" />
        </PaginationNext>
    );

    return (
        <>
            <Pagination className="hidden md:flex">
                <PaginationContent className="gap-gap-xs">
                    <PaginationItem>{previous}</PaginationItem>
                    {getPageWindow(page, totalPages).map((item, index) =>
                        item === 'ellipsis' ? (
                            <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis size="lg" />
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={item}>
                                <PaginationLink
                                    asChild
                                    size="lg"
                                    isActive={item === page}
                                    aria-label={`Página ${item}`}
                                >
                                    <CatalogLink href={href(item)}>{item}</CatalogLink>
                                </PaginationLink>
                            </PaginationItem>
                        ),
                    )}
                    <PaginationItem>{next}</PaginationItem>
                </PaginationContent>
            </Pagination>

            <Pagination className="md:hidden">
                <PaginationContent className="gap-gap-xs">
                    <PaginationItem>{previous}</PaginationItem>
                    <PaginationItem>
                        <PaginationSummary page={page} total={totalPages} />
                    </PaginationItem>
                    <PaginationItem>{next}</PaginationItem>
                </PaginationContent>
            </Pagination>
        </>
    );
}
