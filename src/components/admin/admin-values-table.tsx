import Link from 'next/link';
import { SquarePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** Una columna de `AdminValuesTable`. */
export interface AdminValuesColumn<Row> {
    /** Clave única de la columna. */
    key: string;
    /** Cabecera. */
    header: string;
    /** Ancho de escritorio como clase de Tailwind (`w-27.5`); sin él, la columna ocupa el resto. */
    width?: string;
    align?: 'left' | 'center' | 'right';
    /** Celda de la fila. */
    cell: (row: Row) => React.ReactNode;
    /** Texto de la celda en negrita (el ID, en Figma). */
    strong?: boolean;
}

export interface AdminValuesTableProps<Row> {
    rows: readonly Row[];
    columns: readonly AdminValuesColumn<Row>[];
    /** Clave única de la fila (su id). */
    getRowKey: (row: Row) => string | number;
    /** Nombre de la fila para los `aria-label` de los botones («Editar Bodegas Lustau»). */
    getRowName: (row: Row) => string;
    /** Adónde lleva el lápiz; sin él no hay botón de editar (los valores con modal usan `onEdit`). */
    editHref?: (row: Row) => string;
    /** Abre el modal de edición (uvas y tipologías), en vez de ir a una página. */
    onEdit?: (row: Row) => void;
    /** Pide borrar la fila (papelera). Solo para valores sin uso; sin esto no hay papelera. */
    onDelete?: (row: Row) => void;
    /** Para ocultar la papelera de una fila concreta (el valor está en uso): no se borra. */
    canDelete?: (row: Row) => boolean;
}

/**
 * Tabla genérica de los listados del catálogo: bodegas, denominaciones de origen, variedades de
 * uva y tipologías (Figma: wineries-table de wineries-list). Cabecera de 12 px sobre fondo
 * `muted`, filas de 40 px, ID en negrita, y una última columna «Acciones» de 100 px, a la derecha,
 * con el lápiz (`SquarePen`) y, si procede, la papelera (`Trash2`), botones de 32 px con icono de
 * 14 px. Cada listado pone sus columnas (el `Badge` de Estado, la cuenta de vinos…) y su
 * `columns` suma el ancho a las del diseño: 110 / resto / 240 / 140 / 120 / 100 px en bodegas.
 *
 * En móvil cada fila pasa a una ficha de lista: la primera columna en negrita y las demás debajo
 * con su cabecera.
 *
 * @example
 * <AdminValuesTable rows={wineries} getRowKey={(w) => w.id} getRowName={(w) => w.name}
 *     editHref={(w) => `/admin/bodegas/${w.id}`}
 *     columns={[
 *         { key: 'id', header: 'ID', width: 'w-27.5', strong: true, cell: (w) => entityNumber('WIN', w.id) },
 *         { key: 'name', header: 'Bodega', cell: (w) => w.name },
 *     ]} />
 */
export function AdminValuesTable<Row>({
    rows,
    columns,
    getRowKey,
    getRowName,
    editHref,
    onEdit,
    onDelete,
    canDelete = () => true,
}: AdminValuesTableProps<Row>) {
    const hasActions = Boolean(editHref || onEdit || onDelete);

    const actions = (row: Row) => {
        const name = getRowName(row);
        return (
            <>
                {editHref && (
                    <Button asChild variant="ghost" size="icon-xxs">
                        <Link href={editHref(row)} aria-label={`Editar ${name}`}>
                            <SquarePen className="size-3.5" />
                        </Link>
                    </Button>
                )}
                {onEdit && !editHref && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xxs"
                        aria-label={`Editar ${name}`}
                        onClick={() => onEdit(row)}
                    >
                        <SquarePen className="size-3.5" />
                    </Button>
                )}
                {onDelete && canDelete(row) && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xxs"
                        aria-label={`Eliminar ${name}`}
                        onClick={() => onDelete(row)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                )}
            </>
        );
    };

    const [first, ...others] = columns;
    return (
        <>
            <ul className="flex flex-col rounded-sm border md:hidden">
                {rows.map((row) => (
                    <li
                        key={getRowKey(row)}
                        className="flex flex-col gap-gap-xs border-b p-inset-md text-xs last:border-b-0"
                    >
                        <span className="flex items-center justify-between gap-gap-sm">
                            <span className="font-semibold">{first.cell(row)}</span>
                            {hasActions && (
                                <span className="flex items-center">{actions(row)}</span>
                            )}
                        </span>
                        {others.map((column) => (
                            <span
                                key={column.key}
                                className="flex items-center justify-between gap-gap-sm"
                            >
                                <span className="text-muted-foreground">{column.header}</span>
                                <span>{column.cell(row)}</span>
                            </span>
                        ))}
                    </li>
                ))}
            </ul>
            <div className="hidden md:block">
                <Table size="xs" className="table-fixed">
                    <colgroup>
                        {columns.map((column) => (
                            <col key={column.key} className={column.width} />
                        ))}
                        {hasActions && <col className="w-25" />}
                    </colgroup>
                    <TableHeader>
                        <TableRow className="bg-transparent hover:bg-transparent">
                            {columns.map((column) => (
                                <TableHead key={column.key} align={column.align}>
                                    {column.header}
                                </TableHead>
                            ))}
                            {hasActions && <TableHead align="right">Acciones</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={getRowKey(row)}>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.key}
                                        align={column.align}
                                        className={cn('truncate', column.strong && 'font-semibold')}
                                    >
                                        {column.cell(row)}
                                    </TableCell>
                                ))}
                                {hasActions && (
                                    <TableCell align="right">
                                        <div className="flex items-center justify-end gap-gap-2xs">
                                            {actions(row)}
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
