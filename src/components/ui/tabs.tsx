'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Pestañas (Figma: Tabs). `variant="line"` con línea base; `contained` sobre fondo gris.
 * Con `orientation="vertical"` en `Tabs`, la lista pasa a columna con la línea a la derecha.
 * `size` en `TabsList` (sm 32, md 40, lg 48, xl 56 px) se aplica a todas las pestañas.
 * `scrollable` deja desplazar la lista en horizontal cuando no caben (Figma: overflow).
 *
 * @example
 * <Tabs defaultValue="descripcion">
 *     <TabsList>
 *         <TabsTrigger value="descripcion">Descripción</TabsTrigger>
 *         <TabsTrigger value="cata">Nota de cata</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="descripcion">...</TabsContent>
 * </Tabs>
 */
const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center', {
    variants: {
        variant: {
            line: 'w-full border-b data-[orientation=vertical]:w-auto data-[orientation=vertical]:border-r data-[orientation=vertical]:border-b-0',
            contained: 'rounded-md bg-muted p-inset-2xs',
        },
        fullWidth: { true: 'flex w-full [&>button]:flex-1', false: '' },
        size: { sm: '', md: '', lg: '', xl: '' },
        scrollable: {
            true: 'max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            false: '',
        },
    },
    defaultVariants: { variant: 'line', fullWidth: false, size: 'md', scrollable: false },
});

export interface TabsListProps
    extends
        React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
        VariantProps<typeof tabsListVariants> {}

/** Lista de pestañas (`role="tablist"`). */
const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
    ({ className, variant, fullWidth, size, scrollable, ...props }, ref) => (
        <TabsPrimitive.List
            ref={ref}
            data-variant={variant ?? 'line'}
            data-size={size ?? 'md'}
            className={cn(
                tabsListVariants({ variant, fullWidth, size, scrollable }),
                'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
                className,
            )}
            {...props}
        />
    ),
);
TabsList.displayName = 'TabsList';

/**
 * Pestaña (Figma: TabItem). La activa lleva línea inferior de 2 px y texto medium,
 * así no depende solo del color.
 */
const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            "-mb-px inline-flex h-control-md cursor-pointer items-center justify-center gap-gap-xs border-b-2 border-transparent px-inset-md text-sm whitespace-nowrap text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50 in-data-[size=lg]:h-control-lg in-data-[size=lg]:px-inset-lg in-data-[size=lg]:text-base in-data-[size=sm]:h-control-sm in-data-[size=sm]:px-inset-sm in-data-[size=sm]:text-xs in-data-[size=xl]:h-control-xl in-data-[size=xl]:px-inset-xl in-data-[size=xl]:text-xl in-data-[variant=contained]:mb-0 in-data-[variant=contained]:rounded-sm data-[orientation=vertical]:-mr-px data-[orientation=vertical]:mb-0 data-[orientation=vertical]:justify-start data-[orientation=vertical]:border-r-2 data-[orientation=vertical]:border-b-0 data-[state=active]:border-foreground data-[state=active]:font-medium in-data-[variant=contained]:data-[state=active]:bg-background [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        {...props}
    />
));
TabsTrigger.displayName = 'TabsTrigger';

/** Panel asociado a una pestaña. */
const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            'pt-inset-md data-[orientation=vertical]:pt-0 data-[orientation=vertical]:pl-inset-md',
            className,
        )}
        {...props}
    />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
