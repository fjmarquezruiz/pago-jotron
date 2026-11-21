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
import { formatShortDate } from '@/lib/orders/dates';
import { orderNumber } from '@/lib/orders/format';
import type { OrderStatus } from '@/lib/orders/status';
import { formatEuros } from '@/lib/utils';
import { OrderStatusBadge } from './order-status-badge';

/** Un pedido del historial, como lo devuelve `getUserOrdersPage`. */
export interface OrderHistoryRow {
    id: number;
    /** `datetime` de la BD (UTC). */
    createdAt: string;
    /** Importe decimal (`'189.00'`). */
    total: string;
    status: string;
}

/**
 * Tabla del historial de pedidos (Figma: account-order-history): ID del pedido (`#PJ-4501`), Fecha,
 * Total, Estado con su `OrderStatusBadge` y Acciones (el ojo lleva al detalle). Cinco columnas del
 * mismo ancho, con la cabecera en `muted` y solo el borde de arriba y de abajo, como en el diseño.
 *
 * @param props.rows - Los pedidos de la página, del más reciente al más antiguo.
 *
 * @example
 * <OrderHistoryTable rows={[{ id: 4501, createdAt: '2025-07-10 08:00:00', total: '189.00', status: 'Entregado' }]} />
 */
export function OrderHistoryTable({ rows }: { rows: readonly OrderHistoryRow[] }) {
    return (
        <>
            <ul className="flex flex-col border-y md:hidden">
                {rows.map(({ id, createdAt, total, status }) => (
                    <li key={id} className="border-b last:border-b-0">
                        <Link
                            href={`/pedidos/${id}`}
                            aria-label={`Ver pedido ${orderNumber(id)}`}
                            className="flex flex-col gap-gap-xs py-inset-md text-sm transition-colors hover:bg-muted/50"
                        >
                            <span className="flex items-center justify-between gap-gap-sm">
                                <span className="font-medium">#{orderNumber(id)}</span>
                                <OrderStatusBadge status={status as OrderStatus} />
                            </span>
                            <span className="flex items-center justify-between gap-gap-sm text-muted-foreground">
                                <span>{formatShortDate(createdAt)}</span>
                                <span className="font-medium text-foreground">
                                    {formatEuros(total)}
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="hidden border-y md:block">
                <Table bordered={false} className="table-fixed">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="h-control-xs">ID del pedido</TableHead>
                            <TableHead className="h-control-xs">Fecha</TableHead>
                            <TableHead className="h-control-xs" align="right">
                                Total
                            </TableHead>
                            <TableHead className="h-control-xs" align="center">
                                Estado
                            </TableHead>
                            <TableHead className="h-control-xs" align="right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map(({ id, createdAt, total, status }) => (
                            <TableRow key={id}>
                                <TableCell>#{orderNumber(id)}</TableCell>
                                <TableCell>{formatShortDate(createdAt)}</TableCell>
                                <TableCell numeric>{formatEuros(total)}</TableCell>
                                <TableCell align="center">
                                    <OrderStatusBadge status={status as OrderStatus} />
                                </TableCell>
                                <TableCell align="right">
                                    <Button asChild variant="ghost" size="icon-xxs">
                                        <Link
                                            href={`/pedidos/${id}`}
                                            aria-label={`Ver pedido ${orderNumber(id)}`}
                                        >
                                            <Eye />
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
