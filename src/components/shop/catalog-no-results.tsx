import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { catalogPageHref } from '@/lib/catalog/catalog-url';
import type { CatalogSort } from '@/lib/catalog/filter-constants';
import { emptyResultsCopy } from '@/lib/catalog/filter-labels';

interface CatalogNoResultsProps {
    /** Texto del buscador, si lo hay: cambia el título (`emptyResultsCopy`). */
    q: string | undefined;
    /** Orden activo: se conserva al quitar los filtros, porque no es un filtro. */
    orden: CatalogSort;
}

/**
 * Estado vacío cuando la búsqueda o los filtros no dejan ningún producto (Figma:
 * shop-search-no-results). Ofrece una salida: "Quitar filtros" lleva al listado sin búsqueda ni
 * filtros (manteniendo el orden).
 *
 * @example
 * <CatalogNoResults q={filters.q} orden={orden} />
 */
export function CatalogNoResults({ q, orden }: CatalogNoResultsProps) {
    const { title, description } = emptyResultsCopy(q);
    return (
        <EmptyState
            titleAs="h2"
            title={title}
            description={description}
            action={
                <Button asChild variant="outline">
                    <Link href={catalogPageHref(1, { orden })}>Quitar filtros</Link>
                </Button>
            }
        />
    );
}
