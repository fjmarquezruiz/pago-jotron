import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CategoryCardProps {
    /** Nombre de la categoría: lo que se pinta abajo a la izquierda. */
    name: string;
    /** Foto de fondo (ruta de `public/`). Es decorativa, el nombre ya dice lo que es. */
    image: string;
    /** Destino del enlace. */
    href: string;
    className?: string;
}

/**
 * Tarjeta de categoría (Figma: CategoryCard): foto a todo el tamaño con un degradado oscuro en la
 * mitad inferior y el nombre abajo a la izquierda, en 2xl medium. Toda la tarjeta es un enlace.
 * Al pasar el ratón o enfocarla, el nombre se aclara y aparece una flecha a su derecha.
 *
 * Mide 336 × 501 px (proporción 336/501) y se estira al ancho que le dé el contenedor.
 *
 * El nombre es `text-foreground` por defecto, como en el diseño: sobre fotos muy oscuras casi no se
 * lee hasta el hover.
 *
 * @example
 * <CategoryCard name="Generosos" image="/images/placeholders/colecciones/card-2.jpg" href="/productos" />
 */
export function CategoryCard({ name, image, href, className }: CategoryCardProps) {
    return (
        <Link
            href={href}
            className={cn(
                'group relative isolate flex aspect-[336/501] w-full items-end overflow-hidden rounded-sm p-8',
                className,
            )}
        >
            <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 336px, 50vw"
                className="object-cover"
            />
            <span
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-b from-transparent via-transparent via-50% to-[rgba(23,23,23,0.3)]"
            />
            <span className="relative flex items-center gap-2 text-2xl font-medium text-foreground group-hover:text-primary-foreground group-focus-visible:text-primary-foreground">
                {name}
                <ArrowRight
                    aria-hidden="true"
                    className="hidden size-6 group-hover:block group-focus-visible:block"
                />
            </span>
        </Link>
    );
}
