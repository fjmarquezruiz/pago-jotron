import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const containerVariants = cva('mx-auto w-full px-4 md:px-8', {
    variants: {
        maxWidth: {
            sm: 'max-w-screen-sm',
            md: 'max-w-screen-md',
            lg: 'max-w-screen-lg',
            xl: 'max-w-screen-xl',
            full: 'max-w-none',
        },
    },
    defaultVariants: { maxWidth: 'xl' },
});

export interface ContainerProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {
    /** Renderiza el hijo (por ejemplo `<main>`) en lugar de un `div`. */
    asChild?: boolean;
}

/**
 * Contenedor centrado con ancho máximo (Figma: Container). Anchos: sm 640, md 768,
 * lg 1024, xl 1280 px y full. Para la tienda basta con la clase `container-main`.
 *
 * @example
 * <Container maxWidth="md" asChild><main>...</main></Container>
 */
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
    ({ className, maxWidth, asChild, ...props }, ref) => {
        const Comp = asChild ? Slot.Root : 'div';
        return (
            <Comp ref={ref} className={cn(containerVariants({ maxWidth }), className)} {...props} />
        );
    },
);
Container.displayName = 'Container';

export { Container, containerVariants };
