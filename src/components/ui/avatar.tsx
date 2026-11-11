'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
    'relative flex shrink-0 overflow-hidden border-2 border-border bg-muted text-muted-foreground',
    {
        variants: {
            size: {
                xs: 'size-6 text-2xs',
                sm: 'size-8 text-xs',
                md: 'size-10 text-xs',
                lg: 'size-12 text-sm',
                xl: 'size-16 text-base',
            },
            shape: { circle: 'rounded-full', square: 'rounded-md' },
        },
        defaultVariants: { size: 'md', shape: 'circle' },
    },
);

const statusColors = {
    online: 'bg-success',
    away: 'bg-warning',
    busy: 'bg-destructive',
    offline: 'bg-muted-foreground',
} as const;

const statusLabels = {
    online: 'En línea',
    away: 'Ausente',
    busy: 'Ocupado',
    offline: 'Desconectado',
} as const;

const statusSizes = { xs: 'size-1.5', sm: 'size-2', md: 'size-2.5', lg: 'size-3', xl: 'size-4' };

export interface AvatarProps
    extends
        React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
        VariantProps<typeof avatarVariants> {
    /** Punto de estado en la esquina (Figma: status). */
    status?: keyof typeof statusColors;
}

/**
 * Imagen o iniciales de un usuario (Figma: Avatar). Si la imagen falla, muestra el fallback.
 * Para el tipo icono, pasa un icono de Lucide dentro de `AvatarFallback`. `status` añade el punto de estado.
 *
 * @example
 * <Avatar><AvatarImage src={user.image} alt={user.name} /><AvatarFallback>JM</AvatarFallback></Avatar>
 */
const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
    ({ className, size, shape, status, children, ...props }, ref) => {
        const root = (
            <AvatarPrimitive.Root
                ref={ref}
                className={cn(avatarVariants({ size, shape }), !status && className)}
                {...props}
            >
                {children}
            </AvatarPrimitive.Root>
        );
        if (!status) return root;
        return (
            <span className={cn('relative inline-flex shrink-0', className)}>
                {root}
                <span
                    role="img"
                    aria-label={statusLabels[status]}
                    className={cn(
                        'absolute right-0 bottom-0 rounded-full ring-2 ring-background',
                        statusColors[status],
                        statusSizes[size ?? 'md'],
                    )}
                />
            </span>
        );
    },
);
Avatar.displayName = 'Avatar';

/** Imagen del avatar. Necesita `alt` con el nombre. */
const AvatarImage = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn('aspect-square size-full object-cover', className)}
        {...props}
    />
));
AvatarImage.displayName = 'AvatarImage';

/** Iniciales o icono cuando no hay imagen. */
const AvatarFallback = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            'flex size-full items-center justify-center font-medium uppercase',
            className,
        )}
        {...props}
    />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };

const overlap = {
    xs: '-space-x-2',
    sm: '-space-x-2',
    md: '-space-x-2.5',
    lg: '-space-x-3',
    xl: '-space-x-3',
};

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Tamaño de los avatares; también fija el solapamiento. */
    size?: NonNullable<AvatarProps['size']>;
    /** Máximo de avatares visibles. El resto se resume en "+N". */
    max?: number;
}

/**
 * Grupo de avatares solapados (Figma: AvatarGroup). Si hay más de `max`, añade un avatar "+N".
 *
 * @example
 * <AvatarGroup max={3}>{users.map((u) => <Avatar key={u.id}>...</Avatar>)}</AvatarGroup>
 */
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
    ({ className, size = 'md', max, children, ...props }, ref) => {
        const items = React.Children.toArray(children).filter(React.isValidElement);
        const visible = max ? items.slice(0, max) : items;
        const rest = items.length - visible.length;
        return (
            <div
                ref={ref}
                role="group"
                className={cn('flex items-center', overlap[size], className)}
                {...props}
            >
                {visible.map((child) =>
                    React.cloneElement(child as React.ReactElement<AvatarProps>, {
                        size,
                        className: cn('border-background', (child.props as AvatarProps).className),
                    }),
                )}
                {rest > 0 && (
                    <Avatar size={size} className="border-background" aria-label={`${rest} más`}>
                        <AvatarFallback>+{rest}</AvatarFallback>
                    </Avatar>
                )}
            </div>
        );
    },
);
AvatarGroup.displayName = 'AvatarGroup';

export { AvatarGroup };
