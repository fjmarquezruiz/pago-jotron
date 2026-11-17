'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogActiveFilters } from '@/components/shop/catalog-active-filters';
import { CatalogFilterSelect } from '@/components/shop/catalog-filter-select';
import { CatalogFiltersDrawer } from '@/components/shop/catalog-filters-drawer';
import { useCatalogPending } from '@/components/shop/catalog-pending';
import { CatalogSearch } from '@/components/shop/catalog-search';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    activeFilters,
    countSelectFilters,
    filterChoices,
    filterValue,
    setFilter,
    type FilterKey,
} from '@/lib/catalog/active-filters';
import { catalogPageHref } from '@/lib/catalog/catalog-url';
import {
    CATALOG_SORTS,
    SELECT_FILTER_KEYS,
    type CatalogSort,
    type SelectFilterKey,
} from '@/lib/catalog/filter-constants';
import {
    CATALOG_SORT_LABELS,
    SELECT_FILTER_LABELS,
    resultsSummary,
} from '@/lib/catalog/filter-labels';
import type { CatalogFilterOptions } from '@/lib/catalog/filter-options';
import type { CatalogFilters as CatalogFiltersState } from '@/lib/validations/catalog';

/**
 * Ancho mínimo de cada select en la barra (Figma: WinesFilter, 130-180 px según el texto del
 * filtro). Es el ancho exacto del diseño mientras el select enseña su placeholder; con un valor
 * elegido más largo, el select crece hasta `max-w-64` en vez de cortar el texto.
 */
const SELECT_WIDTHS: Record<SelectFilterKey, string> = {
    tipologia: 'min-w-40 max-w-64',
    do: 'min-w-45 max-w-64',
    bodega: 'min-w-40 max-w-64',
    uva: 'min-w-35 max-w-64',
    anada: 'min-w-32.5 max-w-64',
    precio: 'min-w-32.5 max-w-64',
};

interface CatalogFiltersProps {
    /** Opciones de los selects (`getCatalogFilterOptions`). */
    options: CatalogFilterOptions;
    /** Búsqueda y filtros activos, ya saneados (`sanitizeFilters`). */
    filters: CatalogFiltersState;
    orden: CatalogSort;
    /** Productos que cumplen la búsqueda y los filtros. */
    total: number;
}

/**
 * Barra de búsqueda, filtros y orden del listado (Figma: WinesFilter): "Filtrar por" con los 6
 * selects, los chips de los filtros activos con "Borrar todo", el buscador y "Ordenar por" a la
 * derecha, y "Mostrando N productos".
 *
 * El estado vive en la URL: cada cambio navega a la URL nueva, sin `page` (al filtrar se vuelve a
 * la primera página) y sin saltar al principio de la página. Los selects, los chips y el orden son
 * decisiones y añaden una entrada al historial (`router.push`); el buscador solo la reescribe
 * mientras se afina una búsqueda (`router.replace`, ver `CatalogSearch`).
 *
 * La navegación va dentro de la transición de `CatalogPendingProvider`: mientras llega la página
 * nueva, "Mostrando N productos" pasa a "Cargando…". Desde `lg` los 6 selects están en la barra;
 * por debajo, los sustituye el botón "Filtros (n)" con su Drawer.
 *
 * @example
 * <CatalogFilters options={options} filters={filters} orden={orden} total={total} />
 */
export function CatalogFilters({ options, filters, orden, total }: CatalogFiltersProps) {
    const router = useRouter();
    const { slow, start } = useCatalogPending();
    const filterLabelId = useId();

    const go = (
        next: { filters?: CatalogFiltersState; orden?: CatalogSort },
        mode: 'push' | 'replace' = 'push',
    ) =>
        start(() =>
            router[mode](
                catalogPageHref(1, {
                    filters: next.filters ?? filters,
                    orden: next.orden ?? orden,
                }),
                { scroll: false },
            ),
        );
    const change = (key: FilterKey, value: string | undefined) =>
        go({ filters: setFilter(filters, key, value) });

    const active = activeFilters(filters, options);
    const clearAllHref = catalogPageHref(1, { orden });

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="order-2 flex min-w-0 flex-col lg:order-1">
                    <div
                        role="group"
                        aria-labelledby={filterLabelId}
                        className="hidden flex-col gap-gap-xs lg:flex"
                    >
                        <span
                            id={filterLabelId}
                            className="text-sm font-medium text-muted-foreground"
                        >
                            Filtrar por
                        </span>
                        <div className="flex flex-wrap gap-4">
                            {SELECT_FILTER_KEYS.map((key) => (
                                <CatalogFilterSelect
                                    key={key}
                                    label={SELECT_FILTER_LABELS[key]}
                                    value={filterValue(filters, key)}
                                    choices={filterChoices(key, options)}
                                    onChange={(value) => change(key, value)}
                                    className={SELECT_WIDTHS[key]}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="lg:hidden">
                        <CatalogFiltersDrawer
                            options={options}
                            filters={filters}
                            count={countSelectFilters(filters)}
                            total={total}
                            onChange={change}
                            clearAllHref={active.length > 0 ? clearAllHref : undefined}
                        />
                    </div>

                    {active.length > 0 && (
                        <div className="mt-4 lg:mt-1.5 lg:pt-2.5">
                            <CatalogActiveFilters
                                filters={active}
                                onRemove={(key) => change(key, undefined)}
                                clearAllHref={clearAllHref}
                            />
                        </div>
                    )}
                </div>

                <div className="order-1 lg:order-2">
                    <CatalogSearch
                        q={filters.q}
                        onSearch={(q, mode) => go({ filters: setFilter(filters, 'q', q) }, mode)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 items-end gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <p
                    role="status"
                    className="order-2 flex h-10 items-center text-sm text-muted-foreground lg:order-1"
                >
                    {slow ? 'Cargando…' : resultsSummary(total)}
                </p>
                <Field className="order-1 lg:order-2">
                    <FieldLabel className="text-muted-foreground">Ordenar por</FieldLabel>
                    <Select
                        value={orden}
                        onValueChange={(value) => go({ orden: value as CatalogSort })}
                    >
                        <FieldControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                        </FieldControl>
                        <SelectContent>
                            {CATALOG_SORTS.map((sort) => (
                                <SelectItem key={sort} value={sort}>
                                    {CATALOG_SORT_LABELS[sort]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>
        </div>
    );
}
