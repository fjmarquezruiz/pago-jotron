import Link from 'next/link';
import { Eye, ReceiptText } from 'lucide-react';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { customerLabel } from '@/lib/admin/dashboard';
import type { AdminOrdersPage } from '@/lib/db/admin-orders';
import { formatShortDate } from '@/lib/orders/dates';
import { orderNumber } from '@/lib/orders/format';
import { ORDER_STATUS, type OrderStatus } from '@/lib/orders/status';
import { formatEuros } from '@/lib/utils';

/**
 * Tabla de pedidos del panel (Figma: orders-list): ID, Cliente, Fecha, Total, Estado y Acciones, con
 * las columnas de 120 / resto / 160 / 140 / 200 / 100 px. El ojo lleva al detalle; el icono de
 * factura solo sale en un pedido Entregado con factura (la papelera del diseño no existe: un pedido
 * nunca se borra). En pantallas pequeñas cada pedido es una fila de lista.
 *
 * @param props.rows - Los pedidos de la página (`getAdminOrdersPage`).
 */
export function AdminOrdersTable({ rows }: { rows: AdminOrdersPage['items'] }) {
    const customer = (row: AdminOrdersPage['items'][number]) =>
        customerLabel(row.customerName, row.customerLastName, row.customerEmail);
    const hasInvoice = (row: AdminOrdersPage['items'][number]) =>
        row.status === ORDER_STATUS.DELIVERED && row.invoiceNumber !== null;
    return (
        <>
            <ul className="flex flex-col rounded-sm border md:hidden">
                {rows.map((row) => (
                    <li key={row.id} className="border-b last:border-b-0">
                        <Link
                            href={`/admin/pedidos/${row.id}`}
                            aria-label={`Ver pedido ${orderNumber(row.id)}`}
                            className="flex flex-col gap-gap-xs p-inset-md text-xs transition-colors hover:bg-muted/50"
                        >
                            <span className="flex items-center justify-between gap-gap-sm">
                                <span className="font-semibold">#{orderNumber(row.id)}</span>
                                <OrderStatusBadge
                                    status={row.status as OrderStatus}
                                    variant="subtle"
                                />
                            </span>
                            <span className="text-muted-foreground">{customer(row)}</span>
                            <span className="flex items-center justify-between gap-gap-sm text-muted-foreground">
                                <span>{formatShortDate(row.createdAt)}</span>
                                <span className="font-medium text-foreground">
                                    {formatEuros(row.total)}
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="hidden md:block">
                <Table size="xs" className="table-fixed">
                    <colgroup>
                        <col className="w-30" />
                        <col />
                        <col className="w-40" />
                        <col className="w-35" />
                        <col className="w-50" />
                        <col className="w-25" />
                    </colgroup>
                    <TableHeader>
                        <TableRow className="bg-transparent hover:bg-transparent">
                            <TableHead>ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead align="right">Total</TableHead>
                            <TableHead align="center">Estado</TableHead>
                            <TableHead align="right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-semibold">
                                    #{orderNumber(row.id)}
                                </TableCell>
                                <TableCell className="truncate">{customer(row)}</TableCell>
                                <TableCell>{formatShortDate(row.createdAt)}</TableCell>
                                <TableCell align="right">{formatEuros(row.total)}</TableCell>
                                <TableCell align="center">
                                    <OrderStatusBadge
                                        status={row.status as OrderStatus}
                                        variant="subtle"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <div className="flex items-center justify-end gap-gap-2xs">
                                        <Button asChild variant="ghost" size="icon-xs">
                                            <Link
                                                href={`/admin/pedidos/${row.id}`}
                                                aria-label={`Ver pedido ${orderNumber(row.id)}`}
                                            >
                                                <Eye className="size-3.5" />
                                            </Link>
                                        </Button>
                                        {hasInvoice(row) && (
                                            <Button asChild variant="ghost" size="icon-xs">
                                                <a
                                                    href={`/api/admin/pedidos/${row.id}/factura`}
                                                    aria-label={`Factura del pedido ${orderNumber(row.id)}`}
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
            </div>
        </>
    );
}
