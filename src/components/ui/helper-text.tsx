import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CircleCheck, CircleX, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const helperTextVariants = cva(
    'flex items-start gap-gap-2xs [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            type: {
                default: 'text-muted-foreground',
                info: 'text-info',
                success: 'text-success',
                warning: 'text-warning',
                error: 'text-destructive',
            },
            size: {
                xs: 'text-xs [&_svg]:size-3.5',
                sm: 'text-xs',
                md: 'text-sm',
                lg: 'text-base',
            },
        },
        defaultVariants: { type: 'default', size: 'md' },
    },
);

const icons = { info: Info, success: CircleCheck, warning: AlertTriangle, error: CircleX };

export interface HelperTextProps
    extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof helperTextVariants> {
    /** Muestra el icono del tipo (no aplica a `default`). */
    showIcon?: boolean;
}

/**
 * Texto de ayuda o de validación bajo un campo (Figma: HelperText).
 * Vincúlalo al control con `aria-describedby` (lo hace `Field` automáticamente).
 *
 * @example
 * <HelperText type="error" showIcon>La contraseña es demasiado corta.</HelperText>
 */
const HelperText = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
    ({ className, type, size, showIcon = false, children, ...props }, ref) => {
        const Icon = type && type !== 'default' ? icons[type] : null;
        return (
            <p ref={ref} className={cn(helperTextVariants({ type, size }), className)} {...props}>
                {showIcon && Icon && <Icon aria-hidden="true" />}
                <span>{children}</span>
            </p>
        );
    },
);
HelperText.displayName = 'HelperText';

export { HelperText, helperTextVariants };
