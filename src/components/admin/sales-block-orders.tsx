'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Strong } from '@/components/admin/admin-dialog-frame';
import { fetchAffectedOrders } from '@/components/admin/sales-block-request';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    affectedOrdersNotice,
    type AffectedOrder,
    type SalesBlockScope,
} from '@/lib/admin/sales-block';

export interface SalesBlockOrdersProps {
    /** `GET` que devuelve `{ orders }`: la ruta de ventas o de estado de lo que se bloquea. */
    url: string;
    /** Qué se bloquea: decide la frase del aviso. */
    scope: SalesBlockScope;
}

/**
 * Aviso y tabla de pedidos en curso del modal de bloqueo (Figma: admin-modal-block-sales-bodega y
 * -do, `wines-table`): «Hay N pedidos en curso con productos de esta bodega…» y una tabla con
 * Pedido, Estado y un enlace al pedido. Bloquear NO toca esos pedidos, y el texto lo dice (el
 * diseño decía «pasarán a Bloqueado»: no es lo que pasa, ver A10). Se pide al montarse, es decir,
 * al abrir el modal; sin pedidos no pinta nada, y si la consulta falla avisa sin impedir el bloqueo.
 *
 * @param props - La ruta que devuelve los pedidos y lo que se bloquea.
 *
 * @example
 * <SalesBlockOrders url="/api/admin/bodegas/3/ventas" scope="winery" />
 */
export function SalesBlockOrders({ url, scope }: SalesBlockOrdersProps) {
    const [state, setState] = useState<
        { kind: 'loading' } | { kind: 'error' } | { kind: 'ok'; orders: AffectedOrder[] }
    >({ kind: 'loading' });

    useEffect(() => {
        let current = true;
        void fetchAffectedOrders(url).then((outcome) => {
            if (current) setState(outcome);
        });
        return () => {
            current = false;
        };
    }, [url]);

    if (state.kind === 'loading')
        return <Skeleton className="h-10 w-full" aria-label="Buscando pedidos en curso" />;
    if (state.kind === 'error')
        return (
            <p className="text-sm text-foreground">
                No se han podido comprobar los pedidos en curso. Puedes bloquear igualmente: no se
                modifica ningún pedido.
            </p>
        );
    const notice = affectedOrdersNotice(state.orders.length, scope);
    if (!notice) return null;

    return (
        <>
            <p className="text-sm text-foreground">
                {notice.before}
                <Strong>{notice.strong}</Strong>
                {notice.after}
            </p>
            <Table size="xs" aria-label="Pedidos en curso afectados">
                <TableHeader className="bg-muted">
                    <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead align="center">Estado</TableHead>
                        <TableHead align="right" className="w-25">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {state.orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-semibold">#{order.number}</TableCell>
                            <TableCell align="center">
                                <OrderStatusBadge status={order.status} variant="subtle" />
                            </TableCell>
                            <TableCell align="right">
                                <Button asChild variant="ghost" size="icon-xxs">
                                    <Link
                                        href={`/admin/pedidos/${order.id}`}
                                        aria-label={`Ver pedido ${order.number}`}
                                    >
                                        <ArrowUpRight className="size-3.5" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
}
