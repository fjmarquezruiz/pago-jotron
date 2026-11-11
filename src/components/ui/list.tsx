import * as React from 'react';
import { Slot } from 'radix-ui';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
    /** Añade una línea entre elementos. */
    divided?: boolean;
    /** Marco con borde y radio, como una tarjeta. */
    bordered?: boolean;
}

/**
 * Lista de elementos (Figma: List). Úsala con `ListItem`.
 *
 * @example
 * <List divided bordered><ListItem title="Dirección" description="Calle Real 3" /></List>
 */
const List = React.forwardRef<HTMLUListElement, ListProps>(
    ({ className, divided, bordered, ...props }, ref) => (
        <ul
            ref={ref}
            className={cn(
                'flex flex-col',
                divided && 'divide-y divide-border',
                bordered && 'overflow-hidden rounded-xl border border-border bg-card',
                className,
            )}
            {...props}
        />
    ),
);
List.displayName = 'List';

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'title'> {
    /** Texto principal. */
    title?: React.ReactNode;
    /** Texto secundario. */
    description?: React.ReactNode;
    /** Icono, avatar o imagen a la izquierda. */
    leading?: React.ReactNode;
    /** Acción, badge o valor a la derecha. */
    trailing?: React.ReactNode;
    /** Hace el elemento interactivo: pasa un `<a>` o `<button>` como hijo único. */
    asChild?: boolean;
    /** Elemento elegido (Figma: state=selected): fondo de marca suave. */
    selected?: boolean;
    /** Flecha a la derecha para indicar que lleva a otra pantalla (Figma: showChevron). */
    chevron?: boolean;
}

/**
 * Elemento de lista con zonas `leading`, texto y `trailing` (Figma: ListItem).
 * Con `asChild`, el contenido va dentro del enlace o botón para que sea clicable entero.
 */
const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
    (
        {
            className,
            title,
            description,
            leading,
            trailing,
            asChild,
            selected,
            chevron,
            children,
            ...props
        },
        ref,
    ) => {
        const Inner = asChild ? Slot.Root : 'div';
        const body = (
            <>
                {leading && (
                    <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-5">
                        {leading}
                    </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                    {title && <span className="truncate text-sm font-medium">{title}</span>}
                    {description && (
                        <span className="truncate text-sm text-muted-foreground">
                            {description}
                        </span>
                    )}
                </span>
                {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
                {chevron && (
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                    />
                )}
            </>
        );
        return (
            <li
                ref={ref}
                aria-current={selected || undefined}
                className={cn(selected && 'bg-brand-subtle', className)}
                {...props}
            >
                <Inner
                    className={cn(
                        'flex min-h-control-lg items-center gap-gap-sm px-inset-md py-inset-xs text-left',
                        asChild &&
                            'w-full cursor-pointer transition-colors hover:bg-accent focus-visible:-outline-offset-2',
                    )}
                >
                    {asChild && React.isValidElement(children)
                        ? React.cloneElement(
                              children as React.ReactElement<{ children?: React.ReactNode }>,
                              {},
                              body,
                          )
                        : body}
                </Inner>
            </li>
        );
    },
);
ListItem.displayName = 'ListItem';

/**
 * Estado vacío de una lista (Figma: List state=empty).
 *
 * @example
 * <ListEmpty title="No tienes direcciones" description="Añade una para agilizar tus compras." />
 */
function ListEmpty({ title, description }: { title: string; description?: string }) {
    return (
        <li className="flex flex-col gap-gap-2xs px-inset-md py-inset-lg text-center text-sm">
            <span className="font-medium">{title}</span>
            {description && <span className="text-muted-foreground">{description}</span>}
        </li>
    );
}

/**
 * Filas de carga de una lista (Figma: List state=loading).
 *
 * @example
 * <List divided bordered aria-busy="true"><ListSkeleton rows={3} /></List>
 */
function ListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }, (_, i) => (
                <li
                    key={i}
                    aria-hidden="true"
                    className="flex min-h-control-lg items-center gap-gap-sm px-inset-md py-inset-sm"
                >
                    <Skeleton variant="circle" className="size-5" />
                    <span className="flex flex-1 flex-col gap-gap-xs">
                        <Skeleton variant="text" className="h-3 w-40" />
                        <Skeleton variant="text" className="h-3 w-60 max-w-full" />
                    </span>
                </li>
            ))}
        </>
    );
}

export { List, ListItem, ListEmpty, ListSkeleton };
