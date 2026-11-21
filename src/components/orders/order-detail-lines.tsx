import { Badge } from '@/components/ui/badge';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCents, lineTotalCents, priceToCents } from '@/lib/cart/totals';
import type { OrderDetailLine } from '@/lib/orders/detail';

/**
 * Artículos del pedido (Figma: Order Items Section): título con el número de líneas y tabla
 * Producto / Cant. / Precio / Total, con la foto, el nombre, la D.O. y la añada. El precio es el
 * guardado en el pedido, no el vigente.
 *
 * @param props.lines - Las líneas del pedido.
 *
 * @example
 * <OrderDetailLines lines={detail.lines} />
 */
export function OrderDetailLines({ lines }: { lines: OrderDetailLine[] }) {
    return (
        <section aria-labelledby="order-lines-title" className="flex flex-col gap-gap-md">
            <h2 id="order-lines-title" className="text-base font-medium">
                Artículos del pedido ({lines.length})
            </h2>
            <ul className="flex flex-col border-y md:hidden">
                {lines.map((line) => (
                    <li
                        key={line.variantId}
                        className="flex items-center gap-4 border-b py-inset-md last:border-b-0"
                    >
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                            {line.image && (
                                <CloudinaryImage
                                    src={line.image}
                                    alt=""
                                    fill
                                    sizes="64px"
                                    className="object-contain"
                                />
                            )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-sm font-medium">{line.name}</p>
                            <p className="text-sm text-muted-foreground">{line.originName}</p>
                            <div className="flex items-center justify-between gap-gap-sm">
                                <span className="text-xs text-muted-foreground">
                                    {line.quantity} × {formatCents(priceToCents(line.unitPrice))}
                                </span>
                                <span className="text-sm font-medium">
                                    {formatCents(lineTotalCents(line.unitPrice, line.quantity))}
                                </span>
                            </div>
                            {line.vintage !== null && (
                                <Badge tone="neutral" className="self-start">
                                    {line.vintage}
                                </Badge>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            <Table bordered={false} className="hidden border-y md:table">
                <TableHeader>
                    <TableRow>
                        <TableHead className="h-auto py-inset-sm">Producto</TableHead>
                        <TableHead align="right" className="h-auto py-inset-sm">
                            Cant.
                        </TableHead>
                        <TableHead align="right" className="h-auto w-25 py-inset-sm">
                            Precio
                        </TableHead>
                        <TableHead align="right" className="h-auto w-25 py-inset-sm">
                            Total
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lines.map((line) => (
                        <TableRow key={line.variantId}>
                            <TableCell className="h-26 px-4 py-3">
                                <div className="flex items-center gap-4">
                                    <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-muted">
                                        {line.image && (
                                            <CloudinaryImage
                                                src={line.image}
                                                alt=""
                                                fill
                                                sizes="80px"
                                                className="object-contain"
                                            />
                                        )}
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <p className="text-sm font-medium">{line.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {line.originName}
                                        </p>
                                        {line.vintage !== null && (
                                            <Badge tone="neutral">{line.vintage}</Badge>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell numeric>{line.quantity}</TableCell>
                            <TableCell numeric>
                                {formatCents(priceToCents(line.unitPrice))}
                            </TableCell>
                            <TableCell numeric emphasis>
                                {formatCents(lineTotalCents(line.unitPrice, line.quantity))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
}
