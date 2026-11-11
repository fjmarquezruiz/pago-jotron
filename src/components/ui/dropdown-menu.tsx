'use client';

import * as React from 'react';
import { DropdownMenu as MenuPrimitive } from 'radix-ui';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Menú de acciones (Figma: DropdownMenu). Ejecuta acciones; para guardar un valor usa `Select`.
 *
 * @example
 * <DropdownMenu>
 *     <DropdownMenuTrigger asChild><IconButton aria-label="Acciones" variant="ghost"><MoreVertical /></IconButton></DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *         <DropdownMenuItem>Editar</DropdownMenuItem>
 *         <DropdownMenuItem variant="destructive">Borrar</DropdownMenuItem>
 *     </DropdownMenuContent>
 * </DropdownMenu>
 */
const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;
const DropdownMenuGroup = MenuPrimitive.Group;
const DropdownMenuSub = MenuPrimitive.Sub;
const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

const surface =
    'z-50 min-w-48 overflow-hidden rounded-sm border bg-popover p-inset-2xs text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0';

const itemBase =
    "relative flex min-h-control-sm cursor-pointer items-center gap-gap-xs rounded-sm px-inset-sm py-inset-xs text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:text-muted-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

/** Panel del menú. */
const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <MenuPrimitive.Portal>
        <MenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(surface, className)}
            {...props}
        />
    </MenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

/** Acción del menú (Figma: MenuItem). `variant="destructive"` para borrar o anular. */
const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & {
        variant?: 'default' | 'destructive';
        /** Opción elegida (Figma: selected): fondo de marca suave y check a la derecha. */
        selected?: boolean;
    }
>(({ className, variant = 'default', selected, children, ...props }, ref) => (
    <MenuPrimitive.Item
        ref={ref}
        aria-current={selected || undefined}
        className={cn(
            itemBase,
            selected && 'bg-brand-subtle pr-8 data-highlighted:bg-brand-subtle',
            variant === 'destructive' &&
                'text-destructive data-highlighted:bg-destructive-subtle data-highlighted:text-destructive',
            className,
        )}
        {...props}
    >
        {children}
        {selected && <Check aria-hidden="true" className="absolute right-inset-sm text-brand" />}
    </MenuPrimitive.Item>
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

/** Opción marcable con check. */
const DropdownMenuCheckboxItem = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
    <MenuPrimitive.CheckboxItem ref={ref} className={cn(itemBase, 'pr-8', className)} {...props}>
        {children}
        <MenuPrimitive.ItemIndicator className="absolute right-inset-sm text-brand">
            <Check aria-hidden="true" />
        </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

/** Opción de un grupo exclusivo. */
const DropdownMenuRadioItem = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <MenuPrimitive.RadioItem ref={ref} className={cn(itemBase, 'pr-8', className)} {...props}>
        {children}
        <MenuPrimitive.ItemIndicator className="absolute right-inset-sm text-brand">
            <Check aria-hidden="true" />
        </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

/** Título de una sección del menú. */
const DropdownMenuLabel = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.Label>
>(({ className, ...props }, ref) => (
    <MenuPrimitive.Label
        ref={ref}
        className={cn(
            'px-inset-sm py-inset-2xs text-xs font-medium text-muted-foreground',
            className,
        )}
        {...props}
    />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

/** Separador entre secciones. */
const DropdownMenuSeparator = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <MenuPrimitive.Separator
        ref={ref}
        className={cn('-mx-inset-2xs my-1 h-px bg-border', className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/** Disparador de un submenú. */
const DropdownMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
    <MenuPrimitive.SubTrigger
        ref={ref}
        className={cn(itemBase, 'data-[state=open]:bg-accent', className)}
        {...props}
    >
        {children}
        <ChevronRight className="ml-auto" aria-hidden="true" />
    </MenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

/** Panel de un submenú. */
const DropdownMenuSubContent = React.forwardRef<
    React.ElementRef<typeof MenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <MenuPrimitive.Portal>
        <MenuPrimitive.SubContent ref={ref} className={cn(surface, className)} {...props} />
    </MenuPrimitive.Portal>
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuRadioGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
};
