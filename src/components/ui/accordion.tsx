'use client';

import * as React from 'react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Secciones desplegables (Figma: Accordion / AccordionGroup). Para FAQ o ajustes.
 * `variant="contained"` pinta cada item como caja con borde; `flush` los separa con una línea.
 *
 * @example
 * <Accordion type="single" collapsible variant="flush">
 *     <AccordionItem value="envio">
 *         <AccordionTrigger>¿Cuánto tarda el envío?</AccordionTrigger>
 *         <AccordionContent>De 24 a 72 horas en península.</AccordionContent>
 *     </AccordionItem>
 * </Accordion>
 */
const Accordion = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
        variant?: 'flush' | 'contained';
        /** Tamaño del texto y del padding: sm 12, md 14, lg 16 px. */
        size?: 'sm' | 'md' | 'lg';
    }
>(({ className, variant = 'flush', size = 'md', ...props }, ref) => (
    <AccordionPrimitive.Root
        ref={ref}
        data-variant={variant}
        data-size={size}
        className={cn(
            'group/accordion flex flex-col',
            variant === 'contained' && 'gap-gap-sm',
            className,
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>)}
    />
));
Accordion.displayName = 'Accordion';

/** Item del acordeón. */
const AccordionItem = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
    <AccordionPrimitive.Item
        ref={ref}
        className={cn(
            'border-b group-data-[variant=contained]/accordion:rounded-sm group-data-[variant=contained]/accordion:border group-data-[variant=contained]/accordion:border-input group-data-[variant=contained]/accordion:bg-card',
            className,
        )}
        {...props}
    />
));
AccordionItem.displayName = 'AccordionItem';

/** Botón del título (lleva `aria-expanded`). `description` añade una línea de apoyo. */
const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
        description?: React.ReactNode;
    }
>(({ className, children, description, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
                'flex flex-1 cursor-pointer items-start justify-between gap-gap-md rounded-sm py-inset-md text-left text-sm font-medium transition-colors group-data-[size=lg]/accordion:py-inset-lg group-data-[size=lg]/accordion:text-base group-data-[size=sm]/accordion:py-inset-sm group-data-[size=sm]/accordion:text-xs group-data-[variant=contained]/accordion:px-inset-md hover:bg-accent disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
                className,
            )}
            {...props}
        >
            {description ? (
                <span className="flex flex-col gap-gap-2xs">
                    {children}
                    <span className="font-normal text-muted-foreground">{description}</span>
                </span>
            ) : (
                children
            )}
            <ChevronDown
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200"
            />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

/** Contenido desplegable, con animación de altura. */
const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className="overflow-hidden text-sm group-data-[size=lg]/accordion:text-base group-data-[size=sm]/accordion:text-xs data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
        <div
            className={cn(
                'pb-inset-md group-data-[variant=contained]/accordion:px-inset-md',
                className,
            )}
        >
            {children}
        </div>
    </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
