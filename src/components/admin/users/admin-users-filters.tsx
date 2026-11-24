'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
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
    ADMIN_USERS_PATH,
    adminUserFilterLabels,
    adminUsersHref,
    ROLES,
    USER_STATUSES,
    type AdminUserFilters,
} from '@/lib/admin/users';
import type { Role } from '@/types/auth';

/** Valor del select para "sin filtro": Radix no admite `''` como valor de una opción. */
const ALL = 'todos';

/**
 * Barra de filtros del listado de usuarios (Figma: FilterBar de users-list): "Filtros activos:" con
 * un chip por filtro y "Limpiar todo" a la izquierda; a la derecha, "Filtrar" (popover con rol y
 * estado) y la lupa, que se cambia por un campo "Nombre o correo" en el mismo hueco, como en pedidos.
 * Todo viaja en la URL y al aplicar se vuelve a la página 1. Sin "Nuevo usuario": crear usuarios
 * queda fuera del MVP1 (el cliente se registra solo).
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminUserParams`).
 */
export function AdminUsersFilters({ filters }: { filters: AdminUserFilters }) {
    const router = useRouter();
    const id = useId();
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState<string>(filters.role ?? ALL);
    const [status, setStatus] = useState<string>(filters.status ?? ALL);
    const [searching, setSearching] = useState(Boolean(filters.q));
    const [query, setQuery] = useState(filters.q ?? '');
    const labels = adminUserFilterLabels(filters);
    // Con la búsqueda abierta toda la barra pasa a la escala `sm` (Figma: wineries-list-search-open).
    const size = searching ? 'sm' : 'xs';
    const textSize = searching ? 'text-sm' : 'text-xs';

    const apply = (event: React.FormEvent) => {
        event.preventDefault();
        setOpen(false);
        router.push(
            adminUsersHref({
                role: role === ALL ? undefined : (role as Role),
                status: status === ALL ? undefined : (status as AdminUserFilters['status']),
                q: filters.q,
            }),
        );
    };

    const search = (text: string) => {
        const q = text.trim();
        router.push(adminUsersHref({ ...filters, q: q || undefined }));
    };

    // Al abrir se parte de lo que dice la URL, no de lo que se eligió y no se aplicó.
    const onOpenChange = (next: boolean) => {
        if (next) {
            setRole(filters.role ?? ALL);
            setStatus(filters.status ?? ALL);
        }
        setOpen(next);
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-x-gap-md gap-y-gap-xs">
            <div className="flex flex-wrap items-center gap-gap-sm">
                <p className={`${textSize} text-muted-foreground`}>Filtros activos:</p>
                <Badge variant="solid" className="max-w-none">
                    {labels.role}
                </Badge>
                <Badge variant="solid" className="max-w-none">
                    {labels.status}
                </Badge>
                {labels.search && (
                    <Badge variant="outline" tone="neutral" className="max-w-none">
                        {labels.search}
                    </Badge>
                )}
                <Link
                    href={ADMIN_USERS_PATH}
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
                                <Label htmlFor={`${id}-rol`} size="sm">
                                    Rol
                                </Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger id={`${id}-rol`} size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>Todos</SelectItem>
                                        {ROLES.map((name) => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                        {USER_STATUSES.map((name) => (
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
                            aria-label="Buscar por nombre o correo"
                            placeholder="Nombre o correo"
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
                        aria-label="Buscar usuarios"
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
