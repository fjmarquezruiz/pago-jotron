import { CatalogLink } from '@/components/shop/catalog-pending';
import { Tag } from '@/components/ui/tag';
import { TextLink } from '@/components/ui/link';
import type { ActiveFilter, FilterKey } from '@/lib/catalog/active-filters';

interface CatalogActiveFiltersProps {
    /** Filtros activos, uno por chip (`activeFilters`). */
    filters: ActiveFilter[];
    /** Quita un filtro. */
    onRemove: (key: FilterKey) => void;
    /** Enlace de "Borrar todo": el listado sin búsqueda ni filtros. */
    clearAllHref: string;
}

/**
 * Chips de los filtros activos con su × y el enlace "Borrar todo" (Figma: Tag cerrable + Link). Es
 * un enlace, no un botón: lleva al listado sin filtros y se puede abrir en otra pestaña.
 *
 * @example
 * <CatalogActiveFilters filters={active} onRemove={remove} clearAllHref="/productos" />
 */
export function CatalogActiveFilters({
    filters,
    onRemove,
    clearAllHref,
}: CatalogActiveFiltersProps) {
    return (
        <ul aria-label="Filtros activos" className="flex flex-wrap items-center gap-4">
            {filters.map(({ key, label }) => (
                <li key={key} className="flex">
                    <Tag onRemove={() => onRemove(key)}>{label}</Tag>
                </li>
            ))}
            <li className="flex">
                <TextLink asChild size="sm" className="min-h-control-xxs">
                    <CatalogLink href={clearAllHref} scroll={false}>
                        Borrar todo
                    </CatalogLink>
                </TextLink>
            </li>
        </ul>
    );
}
