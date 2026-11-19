import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';
import { NumberInput } from '@/components/ui/number-input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCents, lineTotalCents } from '@/lib/cart/totals';
import { formatPresentation } from '@/lib/catalog/presentation';
import type { CartLine } from '@/lib/db/queries';
import { formatEuros } from '@/lib/utils';

/** Una línea de la tabla: el producto tal como lo da el servidor y las unidades que hay en el carrito. */
export interface CartRow {
    line: CartLine;
    quantity: number;
}

interface CartItemsTableProps {
    rows: readonly CartRow[];
    /** Cambia las unidades de una presentación (ya limitadas al stock por `NumberInput`). */
    onQuantityChange: (line: CartLine, quantity: number) => void;
    onRemove: (line: CartLine) => void;
}

/**
 * Líneas del carrito (Figma: cart-items): producto, cantidad, precio y papelera, con la cabecera
 * Producto / Cant. / Precio. Es una tabla de verdad (`Table` del sistema de diseño), sin el marco
 * exterior: solo la línea bajo cada fila.
 *
 * - Producto: foto de 80 px, nombre (enlace a la ficha), presentación y D.O. en una línea
 *   ("Botella 75 cl · Sierras de Málaga", la presentación no sale en el diseño pero sin ella dos
 *   líneas del mismo vino parecen repetidas) y la añada.
 * - Cantidad: `NumberInput` de 1 al stock de esa presentación.
 * - Precio: el total de la línea y debajo "unidades × precio unitario".
 *
 * Por debajo de 1280 px (el diseño de escritorio necesita ese ancho: con menos, el nombre del producto se parte palabra a palabra) la cabecera se oculta y cada fila pasa a ser una tarjeta con el producto y
 * la papelera arriba, y la cantidad y el precio debajo. El diseño solo existe para escritorio.
 *
 * @example
 * <CartItemsTable rows={rows} onQuantityChange={setQuantity} onRemove={remove} />
 */
export function CartItemsTable({ rows, onQuantityChange, onRemove }: CartItemsTableProps) {
    return (
        <Table role="table" bordered={false} className="max-xl:block">
            <TableHeader role="rowgroup" className="max-xl:sr-only">
                <TableRow role="row" className="hover:bg-transparent">
                    <TableHead role="columnheader" className="px-inset-2xl py-inset-sm">
                        Producto
                    </TableHead>
                    <TableHead role="columnheader" className="w-50 px-inset-2xl py-inset-sm">
                        Cant.
                    </TableHead>
                    <TableHead
                        role="columnheader"
                        align="right"
                        className="w-35 px-inset-2xl py-inset-sm"
                    >
                        Precio
                    </TableHead>
                    <TableHead role="columnheader" className="w-28 px-inset-2xl py-inset-sm">
                        <span className="sr-only">Eliminar</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody role="rowgroup" className="max-xl:block [&_tr:last-child]:border-b">
                {rows.map(({ line, quantity }) => {
                    const presentation = formatPresentation(line);
                    const href = `/productos/${line.slug}`;
                    return (
                        <TableRow
                            role="row"
                            key={line.variantId}
                            className="max-xl:grid max-xl:grid-cols-[1fr_auto] max-xl:gap-x-4 max-xl:gap-y-4 max-xl:p-4"
                        >
                            <TableCell
                                role="cell"
                                className="h-auto p-8 max-xl:col-start-1 max-xl:row-start-1 max-xl:p-0"
                            >
                                <div className="flex items-center gap-8 max-xl:gap-4">
                                    <Link
                                        href={href}
                                        tabIndex={-1}
                                        aria-hidden="true"
                                        className="relative size-20 shrink-0 overflow-hidden rounded-sm"
                                    >
                                        {line.image && (
                                            <CloudinaryImage
                                                src={line.image}
                                                alt=""
                                                fill
                                                sizes="80px"
                                                className="object-contain"
                                            />
                                        )}
                                    </Link>
                                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                                        <Link
                                            href={href}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {line.name}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            {presentation} · {line.originName}
                                        </p>
                                        {line.vintage !== null && <Badge>{line.vintage}</Badge>}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell
                                role="cell"
                                className="h-auto p-8 max-xl:col-start-1 max-xl:row-start-2 max-xl:p-0"
                            >
                                <NumberInput
                                    fluid
                                    size="lg"
                                    aria-label={`Cantidad de ${line.name} (${presentation})`}
                                    value={quantity}
                                    onValueChange={(next) => onQuantityChange(line, next)}
                                    min={1}
                                    max={line.stock}
                                    className="w-34"
                                />
                            </TableCell>
                            <TableCell
                                role="cell"
                                numeric
                                className="h-auto p-inset-2xl max-xl:col-start-2 max-xl:row-start-2 max-xl:p-0"
                            >
                                <div className="flex flex-col items-end gap-1">
                                    <p className="font-medium">
                                        {formatCents(lineTotalCents(line.price, quantity))}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {quantity} × {formatEuros(line.price)}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell
                                role="cell"
                                className="h-auto p-8 max-xl:col-start-2 max-xl:row-start-1 max-xl:self-start max-xl:p-0"
                            >
                                <IconButton
                                    variant="outline"
                                    size="lg"
                                    aria-label={`Eliminar ${line.name} (${presentation})`}
                                    onClick={() => onRemove(line)}
                                    className="[&_svg]:size-5"
                                >
                                    <Trash2 />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
