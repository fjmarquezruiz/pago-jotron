import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { userFullName, userNumber } from '@/lib/admin/users';
import type { AdminUsersPage } from '@/lib/db/admin-users';
import { formatShortDate } from '@/lib/orders/dates';
import { UserRoleBadge, UserStatusBadge } from './user-badges';

/**
 * Tabla de usuarios del panel (Figma: users-list): ID, Nombre, Correo electrónico, Rol, Registrado,
 * Estado y Acciones, con las columnas de 110 / resto / 280 / 150 / 130 / 110 / 140 px. El ojo lleva
 * a la ficha, donde se cambia el rol y se desactiva (el lápiz de editar y la papelera del diseño no
 * existen: el perfil lo edita cada cliente y las cuentas se desactivan, no se borran). En pantallas
 * pequeñas cada usuario es una fila de lista.
 *
 * @param props.rows - Los usuarios de la página (`getAdminUsersPage`).
 */
export function AdminUsersTable({ rows }: { rows: AdminUsersPage['items'] }) {
    return (
        <>
            <ul className="flex flex-col rounded-sm border md:hidden">
                {rows.map((row) => (
                    <li key={row.id} className="border-b last:border-b-0">
                        <Link
                            href={`/admin/usuarios/${row.id}`}
                            aria-label={`Ver usuario ${userNumber(row.id)}`}
                            className="flex flex-col gap-gap-xs p-inset-md text-xs transition-colors hover:bg-muted/50"
                        >
                            <span className="flex items-center justify-between gap-gap-sm">
                                <span className="font-semibold">{userNumber(row.id)}</span>
                                <UserStatusBadge isActive={row.isActive} />
                            </span>
                            <span className="font-medium">{userFullName(row)}</span>
                            <span className="truncate text-muted-foreground">{row.email}</span>
                            <span className="flex items-center justify-between gap-gap-sm text-muted-foreground">
                                <UserRoleBadge role={row.role} />
                                <span>{formatShortDate(row.registrationDate)}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="hidden md:block">
                <Table size="xs" className="table-fixed">
                    <colgroup>
                        <col className="w-27.5" />
                        <col />
                        <col className="w-70" />
                        <col className="w-37.5" />
                        <col className="w-32.5" />
                        <col className="w-27.5" />
                        <col className="w-35" />
                    </colgroup>
                    <TableHeader>
                        <TableRow className="bg-transparent hover:bg-transparent">
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Correo electrónico</TableHead>
                            <TableHead align="center">Rol</TableHead>
                            <TableHead>Registrado</TableHead>
                            <TableHead align="center">Estado</TableHead>
                            <TableHead align="right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-semibold">
                                    {userNumber(row.id)}
                                </TableCell>
                                <TableCell className="truncate">{userFullName(row)}</TableCell>
                                <TableCell className="truncate">{row.email}</TableCell>
                                <TableCell align="center">
                                    <UserRoleBadge role={row.role} />
                                </TableCell>
                                <TableCell>{formatShortDate(row.registrationDate)}</TableCell>
                                <TableCell align="center">
                                    <UserStatusBadge isActive={row.isActive} />
                                </TableCell>
                                <TableCell align="right">
                                    <Button asChild variant="ghost" size="icon-xxs">
                                        <Link
                                            href={`/admin/usuarios/${row.id}`}
                                            aria-label={`Ver usuario ${userNumber(row.id)}`}
                                        >
                                            <Eye className="size-3.5" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
