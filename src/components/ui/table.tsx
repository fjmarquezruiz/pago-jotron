import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Tabla de datos (Figma: Table). Envuelve el `<table>` en un contenedor con scroll horizontal.
 * Las cifras llevan `tabular-nums` en `TableCell` con `numeric`.
 *
 * @example
 * <Table>
 *     <TableHeader><TableRow><TableHead>Pedido</TableHead></TableRow></TableHeader>
 *     <TableBody><TableRow><TableCell>#1024</TableCell></TableRow></TableBody>
 * </Table>
 */
const Table = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement> & {
        /** Densidad de las filas (Figma: Data Cell size): `sm` 48 px y 14 px, `xs` 40 px y 12 px. */
        size?: 'xs' | 'sm';
    }
>(({ className, size = 'sm', ...props }, ref) => (
    <div className="relative w-full overflow-x-auto rounded-sm border">
        <table
            ref={ref}
            data-size={size}
            className={cn(
                'group/table w-full caption-bottom text-sm data-[size=xs]:text-xs',
                className,
            )}
            {...props}
        />
    </div>
));
Table.displayName = 'Table';

/** Cabecera (`thead`). */
const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-muted [&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

/** Cuerpo (`tbody`). `striped` alterna el fondo de las filas pares. */
const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement> & { striped?: boolean }
>(({ className, striped = false, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn(
            '[&_tr:last-child]:border-0',
            striped && '[&_tr:nth-child(even)]:bg-muted/50',
            className,
        )}
        {...props}
    />
));
TableBody.displayName = 'TableBody';

/** Pie (`tfoot`) para totales. */
const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('border-t bg-muted font-medium', className)} {...props} />
));
TableFooter.displayName = 'TableFooter';

/**
 * Fila. Con `aria-selected` se marca con fondo y un borde izquierdo de marca
 * (el estado no depende solo del color).
 */
const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                'border-b bg-background transition-colors hover:bg-muted/50 aria-selected:bg-brand-subtle aria-selected:shadow-[inset_3px_0_0_var(--brand)]',
                className,
            )}
            {...props}
        />
    ),
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    /**
     * Orden de la columna (Figma: sort). Con `none` la columna es ordenable pero no está
     * ordenada. Sin `sort`, la cabecera es texto normal.
     */
    sort?: 'none' | 'ascending' | 'descending';
    /** Se llama al pulsar una cabecera ordenable. */
    onSort?: () => void;
    /** Alineación del texto (Figma: align). */
    align?: 'left' | 'center' | 'right';
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

/**
 * Celda de cabecera (`th`). Con `sort` y `onSort` se convierte en un botón que ordena
 * y pone `aria-sort` en la celda.
 */
const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, sort, onSort, align = 'left', children, ...props }, ref) => {
        const SortIcon =
            sort === 'ascending' ? ArrowUp : sort === 'descending' ? ArrowDown : ChevronsUpDown;
        return (
            <th
                ref={ref}
                scope="col"
                aria-sort={sort && sort !== 'none' ? sort : undefined}
                className={cn(
                    'h-control-md px-inset-md align-middle text-xs font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:w-10',
                    alignClass[align],
                    className,
                )}
                {...props}
            >
                {sort ? (
                    <button
                        type="button"
                        onClick={onSort}
                        className="-mx-1 inline-flex cursor-pointer items-center gap-gap-2xs rounded-xs px-1 hover:bg-accent"
                    >
                        {children}
                        <SortIcon
                            aria-hidden="true"
                            className={cn(
                                'size-4',
                                sort === 'none' ? 'text-muted-foreground' : 'text-foreground',
                            )}
                        />
                    </button>
                ) : (
                    children
                )}
            </th>
        );
    },
);
TableHead.displayName = 'TableHead';

/**
 * Celda de datos (`td`). `numeric` alinea a la derecha con cifras tabulares,
 * `align` cambia la alineación y `emphasis` pone el texto en medium (Figma: emphasis).
 */
const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement> & {
        numeric?: boolean;
        align?: 'left' | 'center' | 'right';
        emphasis?: boolean;
    }
>(({ className, numeric = false, align, emphasis, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            'h-12 px-inset-md py-inset-sm align-middle group-data-[size=xs]/table:h-10 group-data-[size=xs]/table:py-inset-xs',
            numeric && 'text-right tabular-nums',
            align && alignClass[align],
            emphasis && 'font-medium',
            className,
        )}
        {...props}
    />
));
TableCell.displayName = 'TableCell';

/**
 * Fila de estado vacío (Figma: Table state=empty). Ocupa todas las columnas.
 *
 * @example
 * <TableBody><TableEmpty colSpan={4}><EmptyState title="Sin pedidos" /></TableEmpty></TableBody>
 */
function TableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-inset-md py-inset-2xl text-center">
                {children}
            </td>
        </tr>
    );
}

/**
 * Filas de carga (Figma: Table state=loading): esqueletos con la misma altura que los datos.
 *
 * @example
 * <TableBody><TableSkeleton rows={5} columns={4} /></TableBody>
 */
function TableSkeleton({ rows = 5, columns }: { rows?: number; columns: number }) {
    return (
        <>
            {Array.from({ length: rows }, (_, r) => (
                <tr key={r} aria-hidden="true" className="border-b last:border-0">
                    {Array.from({ length: columns }, (_, c) => (
                        <td key={c} className="h-12 px-inset-md group-data-[size=xs]/table:h-10">
                            <Skeleton variant="text" className="h-3 w-3/4" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/** Título accesible de la tabla. */
const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn('mt-gap-md text-sm text-muted-foreground', className)}
        {...props}
    />
));
TableCaption.displayName = 'TableCaption';

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
    TableEmpty,
    TableSkeleton,
};
