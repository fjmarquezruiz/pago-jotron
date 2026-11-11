import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textLinkVariants = cva(
    "inline-flex items-center gap-gap-2xs rounded-xs font-medium underline underline-offset-4 transition-colors hover:decoration-2 aria-disabled:pointer-events-none aria-disabled:text-muted-foreground aria-disabled:no-underline [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1em]",
    {
        variants: {
            variant: {
                default: 'text-foreground',
                brand: 'text-link',
                danger: 'text-destructive',
            },
            size: {
                xxs: 'text-2xs',
                xs: 'text-xs',
                sm: 'text-sm',
                md: 'text-base',
                lg: 'text-lg',
                xl: 'text-xl',
            },
            showVisited: {
                true: 'visited:text-link-visited',
                false: '',
            },
        },
        defaultVariants: { variant: 'default', size: 'sm', showVisited: false },
    },
);

export interface TextLinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof textLinkVariants> {
    /** Aplica los estilos a su hijo, por ejemplo un `Link` de `next/link`. */
    asChild?: boolean;
}

/**
 * Enlace de texto (Figma: Link). Variantes default, brand (terracota) y danger.
 * Para navegar dentro de la app, envuelve un `Link` de Next con `asChild`.
 *
 * @example
 * <TextLink asChild variant="brand"><Link href="/productos">Ver catálogo</Link></TextLink>
 */
const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
    ({ className, variant, size, showVisited, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot.Root : 'a';
        return (
            <Comp
                ref={ref}
                className={cn(textLinkVariants({ variant, size, showVisited }), className)}
                {...props}
            />
        );
    },
);
TextLink.displayName = 'TextLink';

export { TextLink, textLinkVariants };
