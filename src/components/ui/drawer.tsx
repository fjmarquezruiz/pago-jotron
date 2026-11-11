'use client';

import * as React from 'react';
import { Dialog as DrawerPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogOverlay } from '@/components/ui/dialog';

/**
 * Panel lateral superpuesto (Figma: Drawer). Para el carrito, filtros en móvil o detalles.
 * Usa `DrawerTitle` siempre (los lectores de pantalla lo anuncian).
 *
 * @example
 * <Drawer>
 *     <DrawerTrigger asChild><IconButton aria-label="Abrir carrito"><ShoppingBag /></IconButton></DrawerTrigger>
 *     <DrawerContent position="right"><DrawerHeader><DrawerTitle>Tu carrito</DrawerTitle></DrawerHeader></DrawerContent>
 * </Drawer>
 */
const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerClose = DrawerPrimitive.Close;

const drawerVariants = cva(
    'fixed inset-y-0 z-50 flex h-full w-full flex-col bg-popover text-popover-foreground shadow-xl transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-300',
    {
        variants: {
            position: {
                left: 'left-0 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
                right: 'right-0 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            },
            size: { sm: 'sm:max-w-xs', md: 'sm:max-w-md', lg: 'sm:max-w-xl' },
        },
        defaultVariants: { position: 'right', size: 'md' },
    },
);

export interface DrawerContentProps
    extends
        React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
        VariantProps<typeof drawerVariants> {}

/** Contenido del panel, con overlay y botón de cerrar. */
const DrawerContent = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Content>,
    DrawerContentProps
>(({ className, position, size, children, ...props }, ref) => (
    <DrawerPrimitive.Portal>
        <DialogOverlay />
        <DrawerPrimitive.Content
            ref={ref}
            className={cn(drawerVariants({ position, size }), className)}
            {...props}
        >
            {children}
            <DrawerPrimitive.Close
                aria-label="Cerrar"
                className="absolute top-inset-md right-inset-md inline-flex size-control-xs cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
                <X className="size-5" aria-hidden="true" />
            </DrawerPrimitive.Close>
        </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
));
DrawerContent.displayName = 'DrawerContent';

/** Cabecera fija del panel. */
function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex flex-col gap-gap-2xs border-b px-inset-xl py-inset-md pr-14',
                className,
            )}
            {...props}
        />
    );
}

/** Zona con scroll para el contenido. */
function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex-1 overflow-y-auto px-inset-xl py-inset-md', className)}
            {...props}
        />
    );
}

/** Pie fijo con las acciones. */
function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col gap-gap-xs border-t px-inset-xl py-inset-md', className)}
            {...props}
        />
    );
}

/** Título del panel. */
const DrawerTitle = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold', className)}
        {...props}
    />
));
DrawerTitle.displayName = 'DrawerTitle';

/** Descripción del panel. */
const DrawerDescription = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Description
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
DrawerDescription.displayName = 'DrawerDescription';

export {
    Drawer,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
};
