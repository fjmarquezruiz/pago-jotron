import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCents, lineTotalCents, priceToCents } from '@/lib/cart/totals';
import { formatPresentation } from '@/lib/catalog/presentation';
import type { OrderDetailLine } from '@/lib/orders/detail';
import { AdminOrderBox } from './admin-order-box';

/**
 * Artículos del pedido en el panel (Figma: admin-order-detail): tabla Formato / Producto / Cantidad
 * / Precio / Total con columnas de 120 / resto / 120 / 140 / 140 px. No hay SKU en la BD: la primera
 * columna es la presentación (`Botella 75 cl`). El precio es el guardado en el pedido.
 *
 * @param props.lines - Las líneas del pedido.
 */
export function AdminOrderLines({ lines }: { lines: OrderDetailLine[] }) {
    return (
        <AdminOrderBox
            title={`Artículos del pedido (${lines.length})`}
            titleId="admin-order-lines-title"
        >
            <Table size="xs" className="table-fixed">
                <colgroup>
                    <col className="w-30" />
                    <col />
                    <col className="w-30" />
                    <col className="w-35" />
                    <col className="w-35" />
                </colgroup>
                <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="h-auto py-inset-sm">Formato</TableHead>
                        <TableHead className="h-auto py-inset-sm">Producto</TableHead>
                        <TableHead className="h-auto py-inset-sm">Cantidad</TableHead>
                        <TableHead align="right" className="h-auto py-inset-sm">
                            Precio
                        </TableHead>
                        <TableHead align="right" className="h-auto py-inset-sm">
                            Total
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lines.map((line) => (
                        <TableRow key={line.variantId}>
                            <TableCell className="truncate font-semibold">
                                {formatPresentation(line)}
                            </TableCell>
                            <TableCell className="truncate font-medium">
                                {line.name}
                                {line.vintage !== null && ` ${line.vintage}`}
                            </TableCell>
                            <TableCell>{line.quantity}</TableCell>
                            <TableCell numeric>
                                {formatCents(priceToCents(line.unitPrice))}
                            </TableCell>
                            <TableCell numeric>
                                {formatCents(lineTotalCents(line.unitPrice, line.quantity))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AdminOrderBox>
    );
}
