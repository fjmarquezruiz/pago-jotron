'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminListFilters } from '@/components/admin/admin-list-filters';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ADMIN_WINERIES_PATH,
    ADMIN_WINERY_NEW_PATH,
    adminWineriesHref,
    adminWineryFilterLabels,
    type AdminWineryFilters,
} from '@/lib/admin/wineries';

/** Valor del select para «sin filtro»: Radix no admite `''` como valor de una opción. */
const ALL = 'todas';

/**
 * Barra de filtros del listado de bodegas (Figma: FilterBar de wineries-list y
 * wineries-list-search-open): «Filtros activos:» con el chip de región y la búsqueda, «Limpiar
 * todo», «Filtrar» (popover con la región), la búsqueda por nombre y «Nueva bodega». Todo viaja en
 * la URL y al aplicar se vuelve a la página 1. Sobre `AdminListFilters`.
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminWineryParams`).
 * @param props.regions - Ciudades que tienen alguna bodega, para el desplegable.
 */
export function AdminWineriesFilters({
    filters,
    regions,
}: {
    filters: AdminWineryFilters;
    regions: readonly string[];
}) {
    const router = useRouter();
    const id = useId();
    const [region, setRegion] = useState<string>(filters.region ?? ALL);
    const labels = adminWineryFilterLabels(filters);
    // La región de la URL puede no estar ya entre las ciudades: se ofrece igualmente.
    const options =
        filters.region && !regions.includes(filters.region)
            ? [filters.region, ...regions]
            : regions;

    return (
        <AdminListFilters
            chips={[
                { label: labels.region },
                ...(labels.search ? [{ label: labels.search, variant: 'outline' as const }] : []),
            ]}
            clearHref={ADMIN_WINERIES_PATH}
            query={filters.q}
            onSearch={(q) => router.push(adminWineriesHref({ ...filters, q: q || undefined }))}
            searchLabel="Buscar bodegas"
            onFilterOpen={() => setRegion(filters.region ?? ALL)}
            filterPanel={(close) => (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        close();
                        router.push(
                            adminWineriesHref({
                                region: region === ALL ? undefined : region,
                                q: filters.q,
                            }),
                        );
                    }}
                    className="flex flex-col gap-gap-md"
                >
                    <div className="flex flex-col gap-gap-xs">
                        <Label htmlFor={`${id}-region`} size="sm">
                            Región
                        </Label>
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger id={`${id}-region`} size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todas</SelectItem>
                                {options.map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" variant="brand" size="sm">
                        Aplicar
                    </Button>
                </form>
            )}
            action={(size) => (
                <Button asChild variant="default" size={size}>
                    <Link href={ADMIN_WINERY_NEW_PATH}>Nueva bodega</Link>
                </Button>
            )}
        />
    );
}
