import Link from 'next/link';
import { Eye, ReceiptText, ShoppingBag } from 'lucide-react';
import { AdminOrderBox } from '@/components/admin/orders/admin-order-box';
import { AdminPage } from '@/components/admin/admin-page';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatBirthDate, registrationText, userFullName } from '@/lib/admin/users';
import type { AdminUser } from '@/lib/db/admin-users';
import { formatShortDate } from '@/lib/orders/dates';
import { orderNumber } from '@/lib/orders/format';
import { ORDER_STATUS, type OrderStatus } from '@/lib/orders/status';
import { formatEuros } from '@/lib/utils';
import { AdminUserActions } from './admin-user-actions';
import { UserRoleBadge } from './user-badges';

/** Una fila de "Información personal": etiqueta a la izquierda y valor a la derecha. */
function Field({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex items-baseline justify-between gap-gap-md">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-medium text-foreground">{value ?? '—'}</dd>
        </div>
    );
}

/** Una línea de totales del bloque de gasto. */
function Total({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-end justify-between gap-gap-md">
            <dt className="text-base">{label}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
        </div>
    );
}

/** Calle y número de una dirección: `Calle de la Encina 12, 4B`. */
function streetLine(a: AdminUser['addresses'][number]): string {
    return [`${a.streetType} ${a.streetName}`, a.number, a.floor].filter(Boolean).join(', ');
}

/**
 * Ficha de un usuario en el panel (Figma: user-detail y user-detail (2); CU12), en solo lectura:
 * migas, nombre con su rol y los botones de cambiar rol y desactivar o reactivar; debajo, la
 * información personal (con el total de pedidos y el gasto si los hay), las direcciones guardadas y
 * el historial de pedidos. Sin "Editar", "Eliminar" ni "Añadir nuevo": el perfil y las direcciones
 * los edita cada cliente y las cuentas no se borran.
 *
 * @param props.data - La ficha (`getAdminUser`).
 * @param props.now - Reloj, para "hace N días".
 * @param props.currentUserId - Cuenta de quien mira, para avisarle si se cambia a sí misma.
 */
export function AdminUserDetail({
    data,
    now,
    currentUserId,
}: {
    data: AdminUser;
    now: Date;
    /** Cuenta de quien mira la ficha (`getSessionUser`). */
    currentUserId: number;
}) {
    const { user, orders, addresses, orderCount, spent, isLastAdmin } = data;
    const name = userFullName(user);
    return (
        <AdminPage
            breadcrumb={[{ label: 'Usuarios', href: '/admin/usuarios' }, { label: name }]}
            title={name}
            titleBadges={
                <>
                    <UserRoleBadge role={user.role} />
                    {!user.isActive && (
                        <Badge tone="neutral" variant="subtle">
                            Desactivado
                        </Badge>
                    )}
                </>
            }
            actions={
                <AdminUserActions
                    userId={user.id}
                    name={name}
                    role={user.role}
                    isActive={user.isActive}
                    isLastAdmin={isLastAdmin}
                    isSelf={user.id === currentUserId}
                />
            }
        >
            <div className="grid items-start gap-12 lg:grid-cols-2">
                <AdminOrderBox title="Información personal" titleId="admin-user-info-title">
                    <dl className="flex flex-col gap-gap-md">
                        <Field label="Nombre" value={user.name} />
                        <Field label="Apellidos" value={user.lastName} />
                        <Field label="Dirección de correo electrónico" value={user.email} />
                        <Field label="Número de teléfono" value={user.phone} />
                        <Field
                            label="Fecha de nacimiento"
                            value={formatBirthDate(user.birthDate)}
                        />
                        <Field
                            label="Fecha de registro"
                            value={registrationText(user.registrationDate, now)}
                        />
                        {user.idCard && <Field label="DNI" value={user.idCard} />}
                    </dl>
                    {orderCount > 0 && (
                        <dl className="flex flex-col gap-gap-md border-t pt-gap-md">
                            <Total
                                label="Total de pedidos"
                                value={`${orderCount} ${orderCount === 1 ? 'pedido' : 'pedidos'}`}
                            />
                            <Total label="Gasto total" value={formatEuros(spent)} />
                        </dl>
                    )}
                </AdminOrderBox>

                <AdminOrderBox
                    title="Direcciones de envío guardadas"
                    titleId="admin-user-addresses-title"
                >
                    {addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Este usuario no tiene direcciones guardadas.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-gap-md">
                            {addresses.map((address) => (
                                <section
                                    key={address.id}
                                    aria-label={`Dirección de ${address.type === 'Envío' ? 'envío' : 'facturación'}`}
                                    className="flex flex-col gap-gap-md rounded-sm bg-muted p-inset-lg"
                                >
                                    <h3 className="text-sm font-medium">
                                        {address.type === 'Envío'
                                            ? 'Dirección de envío'
                                            : 'Dirección de facturación'}
                                    </h3>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-base font-medium">
                                            {address.recipientName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {streetLine(address)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {address.postalCode} {address.city}, {address.country}
                                        </p>
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </AdminOrderBox>

                <AdminOrderBox
                    title="Historial de pedidos"
                    titleId="admin-user-orders-title"
                    className="lg:col-span-2"
                >
                    {orders.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-gap-lg rounded-sm border p-inset-xl text-center">
                            <div
                                aria-hidden="true"
                                className="flex size-12 items-center justify-center rounded-full bg-muted [&_svg]:size-5"
                            >
                                <ShoppingBag />
                            </div>
                            <div className="flex max-w-160 flex-col gap-gap-2xs">
                                <p className="text-sm font-medium">Todavía no hay pedidos</p>
                                <p className="text-xs text-muted-foreground">
                                    Este usuario todavía no ha realizado ningún pedido.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <Table size="xs" className="table-fixed">
                            <colgroup>
                                <col className="w-40" />
                                <col />
                                <col className="w-40" />
                                <col className="w-40" />
                                <col className="w-30" />
                            </colgroup>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent">
                                    <TableHead>ID</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead align="right">Total</TableHead>
                                    <TableHead align="center">Estado</TableHead>
                                    <TableHead align="right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-semibold">
                                            #{orderNumber(order.id)}
                                        </TableCell>
                                        <TableCell>{formatShortDate(order.createdAt)}</TableCell>
                                        <TableCell align="right">
                                            {formatEuros(order.total)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <OrderStatusBadge
                                                status={order.status as OrderStatus}
                                                variant="subtle"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <div className="flex items-center justify-end gap-gap-2xs">
                                                <Button asChild variant="ghost" size="icon-xs">
                                                    <Link
                                                        href={`/admin/pedidos/${order.id}`}
                                                        aria-label={`Ver pedido ${orderNumber(order.id)}`}
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>
                                                </Button>
                                                {order.status === ORDER_STATUS.DELIVERED && (
                                                    <Button asChild variant="ghost" size="icon-xs">
                                                        <a
                                                            href={`/api/admin/pedidos/${order.id}/factura`}
                                                            aria-label={`Factura del pedido ${orderNumber(order.id)}`}
                                                        >
                                                            <ReceiptText className="size-3.5" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </AdminOrderBox>
            </div>
        </AdminPage>
    );
}
