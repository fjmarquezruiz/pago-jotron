import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
    'flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground transition-shadow',
    {
        variants: {
            variant: {
                default: 'border shadow-xs',
                outlined: 'border',
                elevated: 'border shadow-md',
            },
            orientation: {
                vertical: 'flex-col',
                horizontal: 'flex-col sm:flex-row',
            },
            selected: {
                true: 'border-ring ring-1 ring-ring shadow-md',
                false: '',
            },
            interactive: {
                true: 'cursor-pointer hover:shadow-md has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            orientation: 'vertical',
            interactive: false,
            selected: false,
        },
    },
);

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

/**
 * Tarjeta (Figma: Card). Se compone con `CardMedia`, `CardHeader`, `CardTitle`,
 * `CardDescription`, `CardContent` y `CardFooter`.
 * `interactive` añade hover y muestra el foco del enlace interno en toda la tarjeta.
 * `selected` marca la tarjeta elegida (por ejemplo, un formato o una dirección) con borde de 2 px.
 *
 * @example
 * <Card interactive>
 *     <CardMedia><Image src={url} alt={nombre} fill /></CardMedia>
 *     <CardHeader><CardTitle>Jotrón Tinto 2021</CardTitle></CardHeader>
 * </Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, orientation, interactive, selected, ...props }, ref) => (
        <div
            ref={ref}
            data-slot="card"
            data-orientation={orientation ?? 'vertical'}
            data-selected={selected || undefined}
            className={cn(cardVariants({ variant, orientation, interactive, selected }), className)}
            {...props}
        />
    ),
);
Card.displayName = 'Card';

/** Zona de imagen: 160 px de alto en vertical y 160 px de ancho en horizontal. */
const CardMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'relative h-40 w-full shrink-0 overflow-hidden bg-muted sm:in-data-[orientation=horizontal]:h-auto sm:in-data-[orientation=horizontal]:w-40',
                className,
            )}
            {...props}
        />
    ),
);
CardMedia.displayName = 'CardMedia';

/** Cabecera con título y descripción. */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('flex flex-col gap-gap-xs px-inset-lg pt-inset-lg', className)}
            {...props}
        />
    ),
);
CardHeader.displayName = 'CardHeader';

/** Título de la tarjeta. Por defecto es un `h3`. */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('text-base font-medium', className)} {...props} />
    ),
);
CardTitle.displayName = 'CardTitle';

/** Texto de apoyo bajo el título. */
const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

/** Cuerpo de la tarjeta. */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex-1 px-inset-lg py-inset-lg', className)} {...props} />
    ),
);
CardContent.displayName = 'CardContent';

/** Pie con acciones, separado por un borde superior. */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'flex items-center gap-gap-xs border-t px-inset-lg py-inset-md',
                className,
            )}
            {...props}
        />
    ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardMedia, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
