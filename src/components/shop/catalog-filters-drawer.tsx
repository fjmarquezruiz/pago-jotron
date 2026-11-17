'use client';

import { CatalogFilterSelect } from '@/components/shop/catalog-filter-select';
import { CatalogLink } from '@/components/shop/catalog-pending';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { filterChoices, filterValue } from '@/lib/catalog/active-filters';
import { SELECT_FILTER_KEYS, type SelectFilterKey } from '@/lib/catalog/filter-constants';
import { SELECT_FILTER_LABELS, viewResultsLabel } from '@/lib/catalog/filter-labels';
import type { CatalogFilterOptions } from '@/lib/catalog/filter-options';
import type { CatalogFilters } from '@/lib/validations/catalog';

interface CatalogFiltersDrawerProps {
    options: CatalogFilterOptions;
    filters: CatalogFilters;
    /** Cuántos filtros de los selects hay activos: el "(n)" del botón. */
    count: number;
    /** Productos que cumplen los filtros: el "Ver N productos" del pie. */
    total: number;
    onChange: (key: SelectFilterKey, value: string) => void;
    /** Enlace de "Borrar todo". Si no hay filtros activos, el botón no sale. */
    clearAllHref: string | undefined;
}

/**
 * "Filtros (n)" y el panel lateral con los 6 selects, para pantallas por debajo de `lg` (no hay
 * diseño móvil: se compone con el Drawer del sistema). Cada cambio se aplica al momento, sin botón
 * de aplicar, y el pie enseña cuántos productos quedan ("Ver N productos" cierra el panel).
 *
 * @example
 * <CatalogFiltersDrawer options={options} filters={filters} count={2} total={6} onChange={change} clearAllHref="/productos" />
 */
export function CatalogFiltersDrawer({
    options,
    filters,
    count,
    total,
    onChange,
    clearAllHref,
}: CatalogFiltersDrawerProps) {
    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline" className="w-full">
                    Filtros ({count})
                </Button>
            </DrawerTrigger>
            <DrawerContent position="right" aria-describedby={undefined}>
                <DrawerHeader>
                    <DrawerTitle>Filtros</DrawerTitle>
                </DrawerHeader>
                <DrawerBody className="flex flex-col gap-gap-md">
                    {SELECT_FILTER_KEYS.map((key) => (
                        <CatalogFilterSelect
                            key={key}
                            labelled
                            label={SELECT_FILTER_LABELS[key]}
                            value={filterValue(filters, key)}
                            choices={filterChoices(key, options)}
                            onChange={(value) => onChange(key, value)}
                        />
                    ))}
                </DrawerBody>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="brand">{viewResultsLabel(total)}</Button>
                    </DrawerClose>
                    {clearAllHref && (
                        <Button asChild variant="outline">
                            <CatalogLink href={clearAllHref} scroll={false}>
                                Borrar todo
                            </CatalogLink>
                        </Button>
                    )}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
