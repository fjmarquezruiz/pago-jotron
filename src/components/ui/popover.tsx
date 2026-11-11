'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * Contenido flotante anclado a un elemento (Figma: Popover). Esc lo cierra.
 *
 * @example
 * <Popover>
 *     <PopoverTrigger asChild><Button variant="outline">Ver maridaje</Button></PopoverTrigger>
 *     <PopoverContent>Carnes rojas y quesos curados.</PopoverContent>
 * </Popover>
 */
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

/** Panel del popover (200 a 360 px de ancho). */
const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 6, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                'z-50 w-72 max-w-90 min-w-50 rounded-sm border bg-popover p-inset-md text-sm text-popover-foreground shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
                className,
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

/**
 * Cabecera del popover con título y descripción (Figma: Popover con title y description).
 * Separa la cabecera del cuerpo con una línea.
 *
 * @example
 * <PopoverHeader title="Maridaje" description="Sugerencias del enólogo" />
 */
function PopoverHeader({
    title,
    description,
    className,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                '-mx-inset-md -mt-inset-md mb-inset-md flex flex-col gap-gap-2xs border-b px-inset-md py-inset-md',
                className,
            )}
        >
            <p className="font-medium">{title}</p>
            {description && <p className="text-muted-foreground">{description}</p>}
        </div>
    );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverHeader };
