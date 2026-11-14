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

/**
 * Convierte un texto en un slug en kebab-case, apto para URLs y `public_id` de Cloudinary:
 * minúsculas, sin tildes (la ñ pasa a n) y con guiones en lugar de espacios y símbolos.
 *
 * @param text - Texto de origen, por ejemplo el nombre de un archivo sin extensión.
 * @returns El slug, o una cadena vacía si el texto no tiene ninguna letra ni número.
 *
 * @example
 * slugify('Tinto Roble 2022'); // 'tinto-roble-2022'
 */
export function slugify(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
