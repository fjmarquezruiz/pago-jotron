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
    ADMIN_TYPOLOGIES_PATH,
    adminTypologiesHref,
    adminTypologyFilterLabels,
    PRODUCT_TYPES,
    type AdminTypologyFilters,
} from '@/lib/admin/typologies';

/** Valor del select para «sin filtro»: Radix no admite `''` como valor de una opción. */
const ALL = 'todos';

/**
 * Barra de filtros del listado de tipologías (Figma: FilterBar de typologies-list): «Tipo de
 * producto: todos», «Limpiar todo», «Filtrar» (tipo de producto), la búsqueda por nombre y «Nueva
 * tipología», que abre el modal de alta. Todo viaja en la URL.
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminTypologyParams`).
 * @param props.onCreate - Abre el modal de alta.
 */
export function TypologyFilters({
    filters,
    onCreate,
}: {
    filters: AdminTypologyFilters;
    onCreate: () => void;
}) {
    const router = useRouter();
    const id = useId();
    const [productType, setProductType] = useState<string>(filters.productType ?? ALL);
    const labels = adminTypologyFilterLabels(filters);

    return (
        <AdminListFilters
            chips={[
                { label: labels.productType },
                ...(labels.search ? [{ label: labels.search, variant: 'outline' as const }] : []),
            ]}
            clearHref={ADMIN_TYPOLOGIES_PATH}
            query={filters.q}
            onSearch={(q) => router.push(adminTypologiesHref({ ...filters, q: q || undefined }))}
            searchLabel="Buscar tipologías"
            onFilterOpen={() => setProductType(filters.productType ?? ALL)}
            filterPanel={(close) => (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        close();
                        router.push(
                            adminTypologiesHref({
                                productType:
                                    productType === ALL
                                        ? undefined
                                        : (productType as AdminTypologyFilters['productType']),
                                q: filters.q,
                            }),
                        );
                    }}
                    className="flex flex-col gap-gap-md"
                >
                    <div className="flex flex-col gap-gap-xs">
                        <Label htmlFor={`${id}-tipo`} size="sm">
                            Tipo de producto
                        </Label>
                        <Select value={productType} onValueChange={setProductType}>
                            <SelectTrigger id={`${id}-tipo`} size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todos</SelectItem>
                                {PRODUCT_TYPES.map((name) => (
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
                    Nueva tipología
                </Button>
            )}
        />
    );
}
