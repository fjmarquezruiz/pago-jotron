import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const sizes = ['3xs', '2xs', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

/**
 * `tailwind-merge` con los tokens propios de Jotron DS. Sin esto no sabría que
 * `px-inset-lg` y `px-0` chocan, y dejaría las dos clases.
 */
const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: ['2xs'],
            spacing: [
                ...sizes.map((s) => `control-${s}`),
                ...sizes.map((s) => `inset-${s}`),
                ...sizes.map((s) => `gap-${s}`),
            ],
            breakpoint: ['2xs', 'xs', '3xl', '4xl'],
        },
    },
});

/**
 * Combina clases de Tailwind y resuelve los conflictos (la última gana).
 *
 * @param inputs - Clases, objetos condicionales o arrays de clases.
 * @returns Cadena de clases lista para `className`.
 *
 * @example
 * cn('px-inset-lg', isCompact && 'px-inset-sm', className);
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
