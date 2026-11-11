import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-gap-xs rounded-sm font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
                brand: 'bg-brand text-brand-foreground hover:bg-brand/90 active:bg-brand/80',
                outline:
                    'border border-input bg-transparent text-foreground hover:bg-accent active:bg-accent/70 disabled:border-transparent',
                ghost: 'bg-transparent text-foreground hover:bg-accent active:bg-accent/70 disabled:bg-transparent',
                destructive:
                    'bg-destructive-subtle text-destructive hover:bg-destructive/15 active:bg-destructive/25',
                link: 'h-auto! px-0! text-foreground underline underline-offset-4 hover:decoration-2 disabled:bg-transparent',
            },
            size: {
                xxs: 'h-control-xxs px-inset-xs text-xs',
                xs: 'h-control-xs px-inset-sm text-xs',
                sm: 'h-control-sm px-inset-md text-sm',
                md: 'h-control-md px-inset-lg text-sm',
                lg: "h-control-lg px-inset-xl text-base [&_svg:not([class*='size-'])]:size-5",
                'icon-xxs': "size-control-xxs [&_svg:not([class*='size-'])]:size-3.5",
                'icon-xs': 'size-control-xs',
                'icon-sm': 'size-control-sm',
                icon: "size-control-md [&_svg:not([class*='size-'])]:size-5",
                'icon-lg': "size-control-lg [&_svg:not([class*='size-'])]:size-6",
            },
        },
        defaultVariants: { variant: 'default', size: 'md' },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    /** Renderiza el hijo (por ejemplo, un `Link` de Next) con los estilos del botón. */
    asChild?: boolean;
    /** Muestra un spinner, desactiva el botón y marca `aria-busy`. */
    loading?: boolean;
}

/**
 * Botón de acción (Figma: Button / IconButton).
 *
 * - `variant`: default (primario), brand (terracota), outline, ghost, destructive y link.
 * - `size`: xxs (24 px), xs (32), sm (36), md (40, por defecto) y lg (48); `icon-*` para botones solo icono.
 * - Los botones solo icono necesitan `aria-label`.
 *
 * @example
 * <Button variant="brand" loading={isSubmitting}>Finalizar compra</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            loading = false,
            disabled,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot.Root : 'button';
        return (
            <Comp
                ref={ref}
                data-slot="button"
                className={cn(buttonVariants({ variant, size }), className)}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                {...props}
            >
                {asChild ? (
                    children
                ) : (
                    <>
                        {loading && <Spinner size="sm" variant="current" label="Procesando" />}
                        {children}
                    </>
                )}
            </Comp>
        );
    },
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
    /** Texto accesible obligatorio: el botón no tiene etiqueta visible. */
    'aria-label': string;
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
    /** Botón de alternar activo (Figma: selected): fondo `accent` y `aria-pressed`. */
    selected?: boolean;
}

const iconSizes = {
    xxs: 'icon-xxs',
    xs: 'icon-xs',
    sm: 'icon-sm',
    md: 'icon',
    lg: 'icon-lg',
} as const;

/**
 * Botón solo icono (Figma: IconButton). Obliga a pasar `aria-label`.
 *
 * @example
 * <IconButton aria-label="Cerrar" variant="ghost" size="xs"><X /></IconButton>
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ size = 'md', selected, className, ...props }, ref) => (
        <Button
            ref={ref}
            size={iconSizes[size]}
            aria-pressed={selected}
            className={cn(selected && 'bg-accent text-accent-foreground', className)}
            {...props}
        />
    ),
);
IconButton.displayName = 'IconButton';

export { Button, IconButton, buttonVariants };
