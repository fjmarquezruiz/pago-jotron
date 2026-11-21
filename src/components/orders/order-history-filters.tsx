'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    historyFilterLabels,
    ORDER_HISTORY_PATH,
    orderHistoryHref,
    type HistoryFilters,
} from '@/lib/orders/history-view';
import { ORDER_STATUS } from '@/lib/orders/status';

/** Valor del select para "sin filtro de estado": Radix no admite `''` como valor de una opción. */
const ALL = 'todos';

/**
 * Barra de filtros del historial (Figma: FilterBar de account-order-history): "Filtros activos:" con
 * un chip por filtro (`Estado: Todos`, `Fecha: Todas`) y "Borrar todo" a la izquierda, y a la
 * derecha el botón "Filtrar", que abre un popover con el estado y el rango de fechas. Solo estado y
 * fecha: es lo que guarda un pedido. Todo viaja en la URL (`estado`, `desde`, `hasta`); al aplicar
 * se vuelve a la página 1. La lupa del diseño no se implementa: no tiene función definida.
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseOrderHistoryParams`).
 *
 * @example
 * <OrderHistoryFilters filters={{ status: 'Enviado', from: '2026-01-01' }} />
 */
export function OrderHistoryFilters({ filters }: { filters: HistoryFilters }) {
    const router = useRouter();
    const id = useId();
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(filters.status ?? ALL);
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const labels = historyFilterLabels(filters);
    const invertedRange = from !== '' && to !== '' && from > to;

    const apply = (event: React.FormEvent) => {
        event.preventDefault();
        if (invertedRange) return;
        setOpen(false);
        router.push(
            orderHistoryHref({
                status: status === ALL ? undefined : status,
                from: from || undefined,
                to: to || undefined,
            }),
        );
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

    return (
        <div className="flex flex-wrap items-center justify-between gap-x-gap-md gap-y-gap-xs">
            <div className="flex flex-wrap items-center gap-gap-sm">
                <p className="text-xs text-muted-foreground">Filtros activos:</p>
                <Badge variant="solid" className="max-w-none">
                    {labels.status}
                </Badge>
                <Badge variant="solid" className="max-w-none">
                    {labels.date}
                </Badge>
                <Link
                    href={ORDER_HISTORY_PATH}
                    className="inline-flex min-h-6 items-center border-b border-foreground text-xs font-medium"
                >
                    Borrar todo
                </Link>
            </div>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="xs">
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
                        <Button type="submit" variant="brand" size="sm" disabled={invertedRange}>
                            Aplicar
                        </Button>
                    </form>
                </PopoverContent>
            </Popover>
        </div>
    );
}
