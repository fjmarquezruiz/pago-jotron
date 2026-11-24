'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchInput } from '@/components/ui/search-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ADMIN_ORDERS_PATH,
    adminFilterLabels,
    adminOrdersHref,
    type AdminOrderFilters,
} from '@/lib/admin/orders';
import { ORDER_STATUS } from '@/lib/orders/status';

/** Valor del select para "sin filtro de estado": Radix no admite `''` como valor de una opción. */
const ALL = 'todos';

/**
 * Barra de filtros del listado de pedidos (Figma: FilterBar de orders-list): "Filtros activos:" con
 * un chip por filtro y "Limpiar todo" a la izquierda; a la derecha, "Filtrar" (popover con estado y
 * fechas) y la lupa. Como en la lista de bodegas (wineries-list-search-open), la lupa se cambia por
 * un campo "Número o correo" de 176 px en el mismo hueco, y lo buscado sale como un chip con el texto. Se
 * busca por número de pedido o por correo del cliente. Todo viaja en la URL y al aplicar se vuelve
 * a la página 1. Sin "Exportar CSV": fuera del MVP1.
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminOrderParams`).
 */
export function AdminOrdersFilters({ filters }: { filters: AdminOrderFilters }) {
    const router = useRouter();
    const id = useId();
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(filters.status ?? ALL);
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [searching, setSearching] = useState(Boolean(filters.q));
    const [query, setQuery] = useState(filters.q ?? '');
    const labels = adminFilterLabels(filters);
    const invertedRange = from !== '' && to !== '' && from > to;
    // Con la búsqueda abierta toda la barra pasa a la escala `sm` (Figma: wineries-list-search-open).
    const size = searching ? 'sm' : 'xs';

    const apply = (event: React.FormEvent) => {
        event.preventDefault();
        if (invertedRange) return;
        setOpen(false);
        router.push(
            adminOrdersHref({
                status: status === ALL ? undefined : status,
                from: from || undefined,
                to: to || undefined,
                q: filters.q,
            }),
        );
    };

    const search = (text: string) => {
        const q = text.trim();
        router.push(adminOrdersHref({ ...filters, q: q || undefined }));
    };

    // Al abrir se parte de lo que dice la URL, no de lo que se tecleó y no se aplicó.
    const onOpenChange = (next: boolean) => {
        if (next) {
            setStatus(filters.status ?? ALL);
            setFrom(filters.from ?? '');
            setTo(filters.to ?? '');
        }
        setOpen(next);
    };

    const textSize = searching ? 'text-sm' : 'text-xs';
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-gap-md gap-y-gap-xs">
            <div className="flex flex-wrap items-center gap-gap-sm">
                <p className={`${textSize} text-muted-foreground`}>Filtros activos:</p>
                <Badge variant="solid" className="max-w-none">
                    {labels.status}
                </Badge>
                <Badge variant="solid" className="max-w-none">
                    {labels.date}
                </Badge>
                {labels.search && (
                    <Badge variant="outline" tone="neutral" className="max-w-none">
                        {labels.search}
                    </Badge>
                )}
                <Link
                    href={ADMIN_ORDERS_PATH}
                    className={`inline-flex min-h-6 items-center border-b border-foreground ${textSize} font-medium`}
                >
                    Limpiar todo
                </Link>
            </div>
            <div className="flex items-center gap-gap-sm">
                <Popover open={open} onOpenChange={onOpenChange}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size={size}>
                            Filtrar
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-90">
                        <form onSubmit={apply} className="flex flex-col gap-gap-md">
                            <div className="flex flex-col gap-gap-xs">
                                <Label htmlFor={`${id}-estado`} size="sm">
                                    Estado
                                </Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id={`${id}-estado`} size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>Todos</SelectItem>
                                        {Object.values(ORDER_STATUS).map((name) => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-gap-sm">
                                <div className="flex flex-col gap-gap-xs">
                                    <Label htmlFor={`${id}-desde`} size="sm">
                                        Desde
                                    </Label>
                                    <Input
                                        id={`${id}-desde`}
                                        type="date"
                                        size="sm"
                                        value={from}
                                        max={to || undefined}
                                        onChange={(event) => setFrom(event.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-gap-xs">
                                    <Label htmlFor={`${id}-hasta`} size="sm">
                                        Hasta
                                    </Label>
                                    <Input
                                        id={`${id}-hasta`}
                                        type="date"
                                        size="sm"
                                        value={to}
                                        min={from || undefined}
                                        onChange={(event) => setTo(event.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                variant="brand"
                                size="sm"
                                disabled={invertedRange}
                            >
                                Aplicar
                            </Button>
                        </form>
                    </PopoverContent>
                </Popover>
                {searching ? (
                    <form
                        role="search"
                        className="w-44"
                        onSubmit={(event) => {
                            event.preventDefault();
                            search(query);
                        }}
                    >
                        <SearchInput
                            aria-label="Buscar por número de pedido o correo"
                            placeholder="Número o correo"
                            size="sm"
                            autoFocus={!filters.q}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onClear={() => {
                                setQuery('');
                                if (filters.q) search('');
                            }}
                        />
                    </form>
                ) : (
                    <IconButton
                        aria-label="Buscar pedidos"
                        variant="outline"
                        size="xs"
                        onClick={() => setSearching(true)}
                    >
                        <Search className="size-3.5" />
                    </IconButton>
                )}
            </div>
        </div>
    );
}
