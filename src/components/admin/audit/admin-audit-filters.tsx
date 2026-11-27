'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminListFilters } from '@/components/admin/admin-list-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ADMIN_AUDIT_PATH,
    AUDIT_KIND_NAMES,
    adminAuditFilterLabels,
    adminAuditHref,
    type AdminAuditFilters,
    type AuditKind,
} from '@/lib/admin/audit';
import { userFullName } from '@/lib/admin/users';
import type { AuditUser } from '@/lib/db/admin-audit';

/** Valor del select para "sin filtro": Radix no admite `''` como valor de una opción. */
const ALL = 'todos';

/**
 * Barra de filtros del registro de actividad (Figma: FilterBar de admin-activity-log): «Filtros
 * activos:» con los chips de fechas y usuarios y «Limpiar todo», y a la derecha «Filtrar» (popover
 * con fechas, usuario y tipo) y la lupa, que busca en la acción y en el detalle. Todo viaja en la
 * URL y al aplicar se vuelve a la página 1. Sin «Exportar CSV»: fuera del MVP1.
 *
 * @param props.filters - Filtros vigentes, ya saneados (`parseAdminAuditParams`).
 * @param props.users - Cuentas con asientos, para el filtro de usuario.
 */
export function AdminAuditFilters({
    filters,
    users,
}: {
    filters: AdminAuditFilters;
    users: AuditUser[];
}) {
    const router = useRouter();
    const id = useId();
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [user, setUser] = useState(filters.userId ? String(filters.userId) : ALL);
    const [kind, setKind] = useState<string>(filters.kind ?? ALL);
    const invertedRange = from !== '' && to !== '' && from > to;

    const userName = users.find((item) => item.id === filters.userId);
    const labels = adminAuditFilterLabels(filters, userName ? userFullName(userName) : undefined);

    const reset = () => {
        setFrom(filters.from ?? '');
        setTo(filters.to ?? '');
        setUser(filters.userId ? String(filters.userId) : ALL);
        setKind(filters.kind ?? ALL);
    };

    return (
        <AdminListFilters
            chips={[
                { label: labels.date },
                { label: labels.user },
                { label: labels.kind },
                ...(labels.search ? [{ label: labels.search, variant: 'outline' as const }] : []),
            ]}
            clearHref={ADMIN_AUDIT_PATH}
            query={filters.q}
            onSearch={(text) => router.push(adminAuditHref({ ...filters, q: text || undefined }))}
            searchLabel="Buscar en el registro de actividad"
            onFilterOpen={reset}
            filterPanel={(close) => (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (invertedRange) return;
                        close();
                        router.push(
                            adminAuditHref({
                                from: from || undefined,
                                to: to || undefined,
                                userId: user === ALL ? undefined : Number(user),
                                kind: kind === ALL ? undefined : (kind as AuditKind),
                                q: filters.q,
                            }),
                        );
                    }}
                    className="flex flex-col gap-gap-md"
                >
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
                    <div className="flex flex-col gap-gap-xs">
                        <Label htmlFor={`${id}-usuario`} size="sm">
                            Usuario
                        </Label>
                        <Select value={user} onValueChange={setUser}>
                            <SelectTrigger id={`${id}-usuario`} size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todos</SelectItem>
                                {users.map((item) => (
                                    <SelectItem key={item.id} value={String(item.id)}>
                                        {userFullName(item)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-gap-xs">
                        <Label htmlFor={`${id}-tipo`} size="sm">
                            Tipo
                        </Label>
                        <Select value={kind} onValueChange={setKind}>
                            <SelectTrigger id={`${id}-tipo`} size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todos</SelectItem>
                                {AUDIT_KIND_NAMES.map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" variant="brand" size="sm" disabled={invertedRange}>
                        Aplicar
                    </Button>
                </form>
            )}
        />
    );
}
