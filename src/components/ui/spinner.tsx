import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('inline-block shrink-0 animate-spin rounded-full border-solid', {
    variants: {
        variant: {
            brand: 'border-brand/20 border-t-brand',
            neutral: 'border-muted border-t-foreground',
            inverse: 'border-primary-foreground/30 border-t-primary-foreground',
            current: 'border-current/25 border-t-current',
        },
        size: {
            sm: 'size-4 border-[1.5px]',
            md: 'size-6 border-2',
            lg: 'size-12 border-3',
        },
    },
    defaultVariants: { variant: 'brand', size: 'md' },
});

export interface SpinnerProps
    extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof spinnerVariants> {
    /** Texto para lectores de pantalla. Por defecto, "Cargando". */
    label?: string;
}

/**
 * Indicador de carga circular (Figma: Spinner).
 * Para esperas cortas de duración desconocida. Lleva `role="status"` y un texto oculto.
 *
 * @example
 * <Spinner size="lg" />
 */
const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
    ({ className, variant, size, label = 'Cargando', ...props }, ref) => (
        <span ref={ref} role="status" className={cn('inline-flex', className)} {...props}>
            <span aria-hidden="true" className={spinnerVariants({ variant, size })} />
            <span className="sr-only">{label}</span>
        </span>
    ),
);
Spinner.displayName = 'Spinner';

export { Spinner, spinnerVariants };
