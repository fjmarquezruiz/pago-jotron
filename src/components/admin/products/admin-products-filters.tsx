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
    ADMIN_PRODUCTS_PATH,
    adminProductFilterChips,
    adminProductsHref,
    PRODUCT_STATUSES,
    type AdminProductFilters,
} from '@/lib/admin/products';
import type { AdminProductOptions } from '@/lib/db/admin-products';

/** Valor del select para «sin filtro»: Radix no admite `''` como valor de una opción. */
const ALL = 'todos';

/**
 * Barra de filtros del listado de productos (Figma: FilterBar de admin-list-template y
 * catalogue-list-filtered): «Filtros activos» con un chip por filtro (`Tipo: tinto`, `D.O.: Sierras
 * de Málaga`) y «Limpiar todo», «Filtrar» (popover con tipo de producto, denominación, bodega y
 * estado), la búsqueda por nombre y «Nuevo producto». Todo viaja en la URL y al aplicar se vuelve
 * a la página 1. Sobre `AdminListFilters`. Sin categoría, rango de precios ni de existencias del
 * diseño (la categoría es del punto 3b).
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminProductParams`).
 * @param props.options - Bodegas, D.O. y tipologías entre las que se elige.
 */
export function AdminProductsFilters({
    filters,
    options,
}: {
    filters: AdminProductFilters;
    options: Pick<AdminProductOptions, 'wineries' | 'guarantees' | 'typologies'>;
}) {
    const router = useRouter();
    const id = useId();
    const [typology, setTypology] = useState(String(filters.typologyId ?? ALL));
    const [guarantee, setGuarantee] = useState(String(filters.guaranteeOfOriginId ?? ALL));
    const [winery, setWinery] = useState(String(filters.wineryId ?? ALL));
    const [status, setStatus] = useState<string>(filters.status ?? ALL);

    const resetFromUrl = () => {
        setTypology(String(filters.typologyId ?? ALL));
        setGuarantee(String(filters.guaranteeOfOriginId ?? ALL));
        setWinery(String(filters.wineryId ?? ALL));
        setStatus(filters.status ?? ALL);
    };

    const field = (
        key: string,
        label: string,
        value: string,
        onChange: (value: string) => void,
        items: readonly { value: string; label: string }[],
    ) => (
        <div className="flex flex-col gap-gap-xs">
            <Label htmlFor={`${id}-${key}`} size="sm">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={`${id}-${key}`} size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <AdminListFilters
            chips={adminProductFilterChips(filters, {
                typologies: options.typologies,
                guarantees: options.guarantees,
                wineries: options.wineries,
            })}
            clearHref={ADMIN_PRODUCTS_PATH}
            query={filters.q}
            onSearch={(q) => router.push(adminProductsHref({ ...filters, q: q || undefined }))}
            searchLabel="Buscar productos"
            onFilterOpen={resetFromUrl}
            filterPanel={(close) => (
                <form
                    className="flex flex-col gap-gap-md"
                    onSubmit={(event) => {
                        event.preventDefault();
                        close();
                        router.push(
                            adminProductsHref({
                                typologyId: typology === ALL ? undefined : Number(typology),
                                guaranteeOfOriginId:
                                    guarantee === ALL ? undefined : Number(guarantee),
                                wineryId: winery === ALL ? undefined : Number(winery),
                                status:
                                    status === ALL
                                        ? undefined
                                        : (status as AdminProductFilters['status']),
                                q: filters.q,
                            }),
                        );
                    }}
                >
                    {field(
                        'tipo',
                        'Tipo de producto',
                        typology,
                        setTypology,
                        options.typologies.map((item) => ({
                            value: String(item.id),
                            label: item.name,
                        })),
                    )}
                    {field(
                        'denominacion',
                        'Denominación',
                        guarantee,
                        setGuarantee,
                        options.guarantees.map((item) => ({
                            value: String(item.id),
                            label: item.name,
                        })),
                    )}
                    {field(
                        'bodega',
                        'Bodega',
                        winery,
                        setWinery,
                        options.wineries.map((item) => ({
                            value: String(item.id),
                            label: item.name,
                        })),
                    )}
                    {field(
                        'estado',
                        'Estado',
                        status,
                        setStatus,
                        PRODUCT_STATUSES.map((name) => ({ value: name, label: name })),
                    )}
                    <Button type="submit" variant="brand" size="sm">
                        Aplicar
                    </Button>
                </form>
            )}
            action={(size) => (
                <Button asChild variant="default" size={size}>
                    <Link href={`${ADMIN_PRODUCTS_PATH}/nuevo`}>Nuevo producto</Link>
                </Button>
            )}
        />
    );
}
