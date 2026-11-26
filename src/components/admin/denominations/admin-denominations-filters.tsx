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
    ADMIN_DENOMINATIONS_PATH,
    ADMIN_DENOMINATION_NEW_PATH,
    adminDenominationsHref,
    adminDenominationFilterLabels,
    type AdminDenominationFilters,
} from '@/lib/admin/denominations';

/** Valor del select para «sin filtro»: Radix no admite `''` como valor de una opción. */
const ALL = 'todas';

/**
 * Barra de filtros del listado de denominaciones (Figma: FilterBar de
 * denominations-list): «Filtros activos:» con el chip de región y la búsqueda, «Limpiar
 * todo», «Filtrar» (popover con la región), la búsqueda por nombre y «Nueva denominación». Todo viaja en
 * la URL y al aplicar se vuelve a la página 1. Sobre `AdminListFilters`.
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminDenominationParams`).
 * @param props.regions - Regiones que tiene alguna denominación, para el desplegable.
 */
export function AdminDenominationsFilters({
    filters,
    regions,
}: {
    filters: AdminDenominationFilters;
    regions: readonly string[];
}) {
    const router = useRouter();
    const id = useId();
    const [region, setRegion] = useState<string>(filters.region ?? ALL);
    const labels = adminDenominationFilterLabels(filters);
    // La región de la URL puede no estar ya entre las regiones: se ofrece igualmente.
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
            clearHref={ADMIN_DENOMINATIONS_PATH}
            query={filters.q}
            onSearch={(q) => router.push(adminDenominationsHref({ ...filters, q: q || undefined }))}
            searchLabel="Buscar denominaciones"
            onFilterOpen={() => setRegion(filters.region ?? ALL)}
            filterPanel={(close) => (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        close();
                        router.push(
                            adminDenominationsHref({
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
                    <Link href={ADMIN_DENOMINATION_NEW_PATH}>Nueva denominación</Link>
                </Button>
            )}
        />
    );
}
