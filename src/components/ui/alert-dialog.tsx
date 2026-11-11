'use client';

import * as React from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { dialogContentVariants } from '@/components/ui/dialog';

/**
 * Confirmación de acciones (Figma: Dialog, type=alert). Es la única forma de confirmar
 * una acción destructiva (borrar un vino, anular un pedido). No se cierra al pulsar fuera.
 *
 * @example
 * <AlertDialog>
 *     <AlertDialogTrigger asChild><Button variant="destructive">Anular pedido</Button></AlertDialogTrigger>
 *     <AlertDialogContent>
 *         <AlertDialogHeader>
 *             <AlertDialogTitle>¿Anular el pedido #1024?</AlertDialogTitle>
 *             <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
 *         </AlertDialogHeader>
 *         <AlertDialogFooter>
 *             <AlertDialogCancel>Cancelar</AlertDialogCancel>
 *             <AlertDialogAction tone="danger" onClick={anular}>Anular pedido</AlertDialogAction>
 *         </AlertDialogFooter>
 *     </AlertDialogContent>
 * </AlertDialog>
 */
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

/** Contenido de la confirmación, con overlay. */
const AlertDialogContent = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
        size?: 'sm' | 'md' | 'lg';
    }
>(({ className, size = 'sm', ...props }, ref) => (
    <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
            ref={ref}
            className={cn(dialogContentVariants({ size }), className)}
            {...props}
        />
    </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

/** Cabecera con título y descripción. */
function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col gap-gap-xs', className)} {...props} />;
}

/** Pie con Cancelar y la acción. */
function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col-reverse gap-gap-xs sm:flex-row sm:justify-end', className)}
            {...props}
        />
    );
}

/** Pregunta de la confirmación. */
const AlertDialogTitle = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold', className)}
        {...props}
    />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

/** Consecuencias de la acción. */
const AlertDialogDescription = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

/** Botón que confirma. `tone="danger"` lo pinta en rojo sólido. */
const AlertDialogAction = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Action>,
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
        tone?: 'default' | 'danger';
    }
>(({ className, tone = 'default', ...props }, ref) => (
    <AlertDialogPrimitive.Action
        ref={ref}
        className={cn(
            buttonVariants({ variant: 'default' }),
            tone === 'danger' &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
            className,
        )}
        {...props}
    />
));
AlertDialogAction.displayName = 'AlertDialogAction';

/** Botón que cancela y cierra. Recibe el foco al abrir. */
const AlertDialogCancel = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Cancel
        ref={ref}
        className={cn(buttonVariants({ variant: 'outline' }), className)}
        {...props}
    />
));
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
