'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Ventana modal (Figma: Dialog, type=default). Para confirmar acciones usa `AlertDialog`.
 *
 * @example
 * <Dialog>
 *     <DialogTrigger asChild><Button>Editar dirección</Button></DialogTrigger>
 *     <DialogContent>
 *         <DialogHeader><DialogTitle>Editar dirección</DialogTitle></DialogHeader>
 *         ...
 *     </DialogContent>
 * </Dialog>
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

/** Capa oscura que cubre la página (token `overlay`). */
const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
            className,
        )}
        {...props}
    />
));
DialogOverlay.displayName = 'DialogOverlay';

/** Clases de la superficie modal, compartidas con `AlertDialog`. */
const dialogContentVariants = cva(
    'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-gap-md overflow-y-auto rounded-lg border bg-popover p-inset-xl text-popover-foreground shadow-xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    {
        variants: {
            size: { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' },
        },
        defaultVariants: { size: 'md' },
    },
);

export interface DialogContentProps
    extends
        React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
        VariantProps<typeof dialogContentVariants> {
    /** Oculta el botón de cerrar de la esquina. */
    hideClose?: boolean;
}

/** Contenido del modal. Incluye overlay, portal y botón de cerrar. */
const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    DialogContentProps
>(({ className, size, hideClose = false, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(dialogContentVariants({ size }), className)}
            {...props}
        >
            {children}
            {!hideClose && (
                <DialogPrimitive.Close
                    aria-label="Cerrar"
                    className="absolute top-inset-md right-inset-md inline-flex size-control-xs cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                    <X className="size-5" aria-hidden="true" />
                </DialogPrimitive.Close>
            )}
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

/** Cabecera con título y descripción. */
function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col gap-gap-xs pr-8', className)} {...props} />;
}

/** Pie con las acciones, alineadas a la derecha en escritorio. */
function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col-reverse gap-gap-xs sm:flex-row sm:justify-end', className)}
            {...props}
        />
    );
}

/** Título accesible del modal (obligatorio). */
const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold', className)}
        {...props}
    />
));
DialogTitle.displayName = 'DialogTitle';

/** Descripción del modal. */
const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
DialogDescription.displayName = 'DialogDescription';

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    dialogContentVariants,
};
