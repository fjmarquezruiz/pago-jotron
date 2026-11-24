import Link from 'next/link';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { getPageWindow } from '@/lib/catalog/pagination';
import { orderHistoryHref, type HistoryFilters } from '@/lib/orders/history-view';

interface OrderHistoryPaginationProps {
    /** Texto del pie: `Mostrando 1–10 de 142` (`historyRangeText`). */
    summary: string;
    /** Página actual, ya ajustada al rango. */
    page: number;
    totalPages: number;
    /** Filtros que se conservan en cada enlace. */
    filters: HistoryFilters;
    /** Enlace a una página; por defecto el del historial del cliente. El panel pasa el suyo. */
    hrefFor?: (page: number) => string;
    /** Deja Anterior y Siguiente a la vista (sin enlace) aunque solo haya una página (Figma: orders-list-filtered). */
    alwaysShowPager?: boolean;
}

/**
 * Pie de la tabla del historial (Figma: AdminPagination): el rango mostrado a la izquierda y, a la
 * derecha, Anterior, las páginas (con `…`) y Siguiente. Cada página es un enlace `?pagina=N` que
 * conserva los filtros; en la primera y la última, Anterior y Siguiente quedan sin enlace. Con una
 * sola página solo se ve el rango, salvo con `alwaysShowPager`.
 *
 * @example
 * <OrderHistoryPagination summary="Mostrando 1–10 de 142" page={1} totalPages={15} filters={{}} />
 */
export function OrderHistoryPagination({
    summary,
    page,
    totalPages,
    filters,
    hrefFor,
    alwaysShowPager = false,
}: OrderHistoryPaginationProps) {
    const href = hrefFor ?? ((target: number) => orderHistoryHref({ ...filters, page: target }));
    return (
        <div className="flex min-h-control-xs flex-wrap items-center justify-between gap-x-gap-md gap-y-gap-xs">
            <p className="text-xs text-muted-foreground">{summary}</p>
            {(totalPages > 1 || alwaysShowPager) && (
                <Pagination className="mx-0 w-auto">
                    <PaginationContent className="gap-gap-xs">
                        <PaginationItem>
                            <PaginationPrevious variant="ghost" disabled={page <= 1} asChild>
                                <Link href={href(page - 1)} rel="prev" />
                            </PaginationPrevious>
                        </PaginationItem>
                        {getPageWindow(page, totalPages).map((item, index) =>
                            item === 'ellipsis' ? (
                                <PaginationItem key={`ellipsis-${index}`}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            ) : (
                                <PaginationItem key={item}>
                                    <PaginationLink
                                        asChild
                                        isActive={item === page}
                                        aria-label={`Página ${item}`}
                                    >
                                        <Link href={href(item)}>{item}</Link>
                                    </PaginationLink>
                                </PaginationItem>
                            ),
                        )}
                        <PaginationItem>
                            <PaginationNext variant="ghost" disabled={page >= totalPages} asChild>
                                <Link href={href(page + 1)} rel="next" />
                            </PaginationNext>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
