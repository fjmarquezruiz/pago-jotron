'use client';

import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';
import { AlertTriangle, CircleCheck, CircleX, Info } from 'lucide-react';

/**
 * Contenedor de toasts (Figma: Toast) sobre `sonner`. Se monta una vez en el layout raíz.
 * Para lanzar uno: `toast.success('Pedido guardado')`, `toast.error(...)`, `toast.info(...)`
 * o `toast.warning(...)`.
 */
function Toaster(props: ToasterProps) {
    return (
        <Sonner
            position="bottom-right"
            closeButton
            icons={{
                success: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
                info: <Info className="size-5 text-info" aria-hidden="true" />,
                warning: <AlertTriangle className="size-5 text-warning" aria-hidden="true" />,
                error: <CircleX className="size-5 text-destructive" aria-hidden="true" />,
            }}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'group relative flex w-(--width) min-h-control-xl items-center gap-gap-sm rounded-sm border bg-popover px-inset-md py-inset-sm pr-10 text-sm text-popover-foreground shadow-lg',
                    title: 'font-medium',
                    description: 'text-muted-foreground',
                    closeButton:
                        'absolute! top-1/2! right-inset-sm! left-auto! flex size-control-xxs -translate-y-1/2! transform-none! items-center justify-center rounded-sm border-0! bg-transparent! text-muted-foreground hover:bg-accent! [&_svg]:size-4',
                    actionButton:
                        'ml-auto h-control-xxs rounded-sm bg-primary px-inset-xs text-xs font-medium text-primary-foreground',
                },
            }}
            {...props}
        />
    );
}

export { Toaster, toast };
