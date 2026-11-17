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
 * mitad inferior y el nombre abajo a la izquierda, en xl medium (2xl desde 1280 px). Toda la tarjeta
 * es un enlace. Al pasar el ratón o enfocarla, el nombre se aclara y aparece una flecha a su derecha.
 *
 * Se estira al ancho que le dé el contenedor. Su alto cambia con el ancho, como en Figma: cuadrada
 * por debajo de 640 px (una por vista), de 450 px de alto de 640 a 1279 px, y de 336 × 501 px
 * (proporción 336/501) desde 1280 px. El degradado llega al 50 % de opacidad, y al 30 % desde 1280 px.
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
                'group relative isolate flex aspect-square w-full items-end overflow-hidden rounded-sm p-8 sm:aspect-auto sm:h-112.5 xl:aspect-[336/501] xl:h-auto',
                className,
            )}
        >
            <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1280px) 336px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
            />
            <span
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-b from-transparent via-transparent via-50% to-[rgba(23,23,23,0.5)] xl:to-[rgba(23,23,23,0.3)]"
            />
            <span className="relative flex items-center gap-2 text-xl font-medium text-foreground group-hover:text-primary-foreground group-focus-visible:text-primary-foreground xl:text-2xl">
                {name}
                <ArrowRight
                    aria-hidden="true"
                    className="hidden size-6 group-hover:block group-focus-visible:block"
                />
            </span>
        </Link>
    );
}
