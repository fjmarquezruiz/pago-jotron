'use client';

import { useId, useState } from 'react';
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
    ADMIN_GRAPES_PATH,
    adminGrapeFilterLabels,
    adminGrapesHref,
    GRAPE_COLORS,
    type AdminGrapeFilters,
} from '@/lib/admin/grapes';

/** Valor del select para «sin filtro»: Radix no admite `''` como valor de una opción. */
const ALL = 'todas';

/**
 * Barra de filtros del listado de uvas (Figma: FilterBar de grape-varieties-list): «Color: todas»,
 * «Limpiar todo», «Filtrar» (color), la búsqueda por nombre y «Nueva variedad», que abre el modal de
 * alta. Todo viaja en la URL y al aplicar se vuelve a la página 1.
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminGrapeParams`).
 * @param props.onCreate - Abre el modal de alta.
 */
export function GrapeFilters({
    filters,
    onCreate,
}: {
    filters: AdminGrapeFilters;
    onCreate: () => void;
}) {
    const router = useRouter();
    const id = useId();
    const [color, setColor] = useState<string>(filters.color ?? ALL);
    const labels = adminGrapeFilterLabels(filters);

    return (
        <AdminListFilters
            chips={[
                { label: labels.color },
                ...(labels.search ? [{ label: labels.search, variant: 'outline' as const }] : []),
            ]}
            clearHref={ADMIN_GRAPES_PATH}
            query={filters.q}
            onSearch={(q) => router.push(adminGrapesHref({ ...filters, q: q || undefined }))}
            searchLabel="Buscar variedades de uva"
            onFilterOpen={() => setColor(filters.color ?? ALL)}
            filterPanel={(close) => (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        close();
                        router.push(
                            adminGrapesHref({
                                color:
                                    color === ALL
                                        ? undefined
                                        : (color as AdminGrapeFilters['color']),
                                q: filters.q,
                            }),
                        );
                    }}
                    className="flex flex-col gap-gap-md"
                >
                    <div className="flex flex-col gap-gap-xs">
                        <Label htmlFor={`${id}-color`} size="sm">
                            Color
                        </Label>
                        <Select value={color} onValueChange={setColor}>
                            <SelectTrigger id={`${id}-color`} size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todas</SelectItem>
                                {GRAPE_COLORS.map((name) => (
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
                <Button variant="default" size={size} onClick={onCreate}>
                    Nueva variedad
                </Button>
            )}
        />
    );
}
