import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CircleCheck, CircleX, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
    'relative grid w-full grid-cols-[auto_1fr_auto] items-start gap-x-gap-sm gap-y-gap-2xs rounded-sm border text-foreground',
    {
        variants: {
            type: {
                info: 'border-info bg-info-subtle [&_[data-slot=alert-title]]:text-info [&>svg]:text-info',
                success:
                    'border-success bg-success-subtle [&_[data-slot=alert-title]]:text-success [&>svg]:text-success',
                warning:
                    'border-warning bg-warning-subtle [&_[data-slot=alert-title]]:text-warning [&>svg]:text-warning',
                error: 'border-destructive bg-destructive-subtle [&_[data-slot=alert-title]]:text-destructive [&>svg]:text-destructive',
            },
            size: {
                sm: 'p-inset-sm text-xs [&>svg]:size-4',
                md: 'p-inset-md text-sm [&>svg]:size-5',
                lg: 'p-inset-lg text-base [&>svg]:size-6',
            },
        },
        defaultVariants: { type: 'info', size: 'md' },
    },
);

const icons = { info: Info, success: CircleCheck, warning: AlertTriangle, error: CircleX };

export interface AlertProps
    extends
        Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
        VariantProps<typeof alertVariants> {
    /** Título en negrita, del color del tipo. */
    title?: React.ReactNode;
    /** Acción a la derecha (por ejemplo, un botón "Reintentar"). */
    action?: React.ReactNode;
    /** Si se pasa, muestra el botón de cerrar (Figma: hasClose). */
    onClose?: () => void;
}

/**
 * Aviso persistente dentro de la página (Figma: Alert). El icono depende del tipo,
 * así el significado no va solo en el color. `error` y `warning` usan `role="alert"`.
 *
 * @example
 * <Alert type="warning" title="Stock bajo">Quedan 3 botellas de este formato.</Alert>
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, type, size, title, action, onClose, children, ...props }, ref) => {
        const t = type ?? 'info';
        const Icon = icons[t];
        return (
            <div
                ref={ref}
                role={t === 'error' || t === 'warning' ? 'alert' : 'status'}
                className={cn(alertVariants({ type, size }), className)}
                {...props}
            >
                <Icon aria-hidden="true" className="mt-0.5" />
                <div className="flex flex-col gap-gap-2xs">
                    {title && (
                        <p data-slot="alert-title" className="font-semibold">
                            {title}
                        </p>
                    )}
                    {children && <div data-slot="alert-description">{children}</div>}
                </div>
                {action || onClose ? (
                    <div className="-my-1 flex items-center gap-gap-2xs">
                        {action}
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Cerrar aviso"
                                className="inline-flex size-control-xs cursor-pointer items-center justify-center rounded-sm text-foreground hover:bg-foreground/10 [&_svg]:size-4"
                            >
                                <X aria-hidden="true" />
                            </button>
                        )}
                    </div>
                ) : (
                    <span />
                )}
            </div>
        );
    },
);
Alert.displayName = 'Alert';

export { Alert, alertVariants };
