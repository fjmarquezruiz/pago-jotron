import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Estilos compartidos por Input, Textarea y el trigger de Select. */
const controlBase =
    'w-full min-w-0 rounded-sm border border-input bg-card text-foreground transition-colors placeholder:text-muted-foreground hover:border-foreground/50 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive';

const inputVariants = cva(controlBase, {
    variants: {
        size: {
            xs: 'h-control-xs px-inset-sm text-xs',
            sm: 'h-control-sm px-inset-md text-sm',
            md: 'h-control-md px-inset-lg text-sm',
            lg: 'h-control-lg px-inset-xl text-base',
        },
    },
    defaultVariants: { size: 'md' },
});

const iconPadding = {
    xs: { start: 'pl-8', end: 'pr-8' },
    sm: { start: 'pl-9', end: 'pr-9' },
    md: { start: 'pl-11', end: 'pr-11' },
    lg: { start: 'pl-13', end: 'pr-13' },
} as const;

export interface InputProps
    extends
        Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
        VariantProps<typeof inputVariants> {
    /** Icono decorativo al inicio (por ejemplo, `<Mail />`). */
    startIcon?: React.ReactNode;
    /** Icono o botón al final (por ejemplo, mostrar contraseña). */
    endIcon?: React.ReactNode;
}

/**
 * Campo de texto de una línea (Figma: InputField). Compatible con `register()` de
 * React Hook Form gracias a `forwardRef` (React 18).
 *
 * @example
 * <Input type="email" startIcon={<Mail />} placeholder="tu@correo.es" {...register('email')} />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, size, type = 'text', startIcon, endIcon, ...props }, ref) => {
        const s = size ?? 'md';
        const input = (
            <input
                ref={ref}
                type={type}
                data-slot="input"
                className={cn(
                    inputVariants({ size }),
                    startIcon && iconPadding[s].start,
                    endIcon && iconPadding[s].end,
                    'file:mr-gap-xs file:border-0 file:bg-transparent file:font-medium file:text-foreground',
                    !startIcon && !endIcon && className,
                )}
                {...props}
            />
        );
        if (!startIcon && !endIcon) return input;
        const side = s === 'xs' ? 'px-inset-xs' : 'px-inset-sm';
        return (
            <div className={cn('relative w-full', className)}>
                {startIcon && (
                    <span
                        aria-hidden="true"
                        className={cn(
                            'pointer-events-none absolute inset-y-0 left-0 flex items-center text-muted-foreground [&_svg]:size-5',
                            side,
                            s === 'xs' && '[&_svg]:size-4',
                        )}
                    >
                        {startIcon}
                    </span>
                )}
                {input}
                {endIcon && (
                    <span
                        className={cn(
                            'absolute inset-y-0 right-0 flex items-center text-muted-foreground [&_svg]:size-5',
                            side,
                            s === 'xs' && '[&_svg]:size-4',
                        )}
                    >
                        {endIcon}
                    </span>
                )}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input, inputVariants, controlBase };
