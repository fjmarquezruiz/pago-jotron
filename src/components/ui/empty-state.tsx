import * as React from 'react';
import { Wine } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Icono de Lucide. Por defecto, una copa de vino. */
    icon?: React.ReactNode;
    title: React.ReactNode;
    /** Etiqueta del título. `p` por defecto; usa `h1` o `h2` si es el título de la página o de una sección. */
    titleAs?: 'p' | 'h1' | 'h2' | 'h3';
    description?: React.ReactNode;
    /** Acciones para salir del vacío, por ejemplo `<Button>Ver catálogo</Button>`. Varios botones van en fila. */
    action?: React.ReactNode;
    /** Dibuja el borde de 1 px del diseño. Quítalo si el estado vacío ya está dentro de una tarjeta, tabla o panel. */
    bordered?: boolean;
}

/**
 * Estado vacío (Figma: EmptyState): explica por qué no hay datos y ofrece una salida.
 * Caja con borde, icono en un círculo de 80 px, título en la fuente de titulares (3xl), texto de
 * apoyo y una fila de acciones, todo centrado en un ancho máximo de 640 px.
 *
 * @example
 * <EmptyState
 *     title="Sin resultados con: “Pago de Martinez”"
 *     description="Prueba con otros términos o explora nuestras colecciones"
 *     action={<Button asChild variant="brand"><Link href="/productos">Explora nuestros vinos</Link></Button>}
 * />
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    (
        {
            className,
            icon,
            title,
            titleAs: Title = 'p',
            description,
            action,
            bordered = true,
            ...props
        },
        ref,
    ) => (
        <div
            ref={ref}
            className={cn(
                'flex flex-col items-center justify-center gap-6 rounded-sm p-6 text-center',
                bordered && 'border border-border',
                className,
            )}
            {...props}
        >
            <div className="flex w-full max-w-160 flex-col items-center gap-8">
                <div
                    aria-hidden="true"
                    className="flex size-20 items-center justify-center rounded-full bg-muted text-foreground [&_svg]:size-8"
                >
                    {icon ?? <Wine />}
                </div>
                <Title className="w-full font-display text-3xl font-medium">{title}</Title>
                {description && (
                    <p className="w-full text-sm text-muted-foreground">{description}</p>
                )}
                {action && (
                    <div className="flex w-full flex-wrap items-center justify-center gap-4">
                        {action}
                    </div>
                )}
            </div>
        </div>
    ),
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
