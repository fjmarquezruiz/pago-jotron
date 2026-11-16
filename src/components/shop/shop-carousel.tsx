'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ShopCarouselProps {
    /** Título de la sección (un `h2`). */
    title: string;
    /** Acción junto al título, por ejemplo el botón "Ver todo". */
    action?: React.ReactNode;
    /** Los elementos de la fila (tarjetas). Cada uno va dentro de su `<li>`. */
    children: React.ReactNode;
    className?: string;
}

/**
 * Indica si la fila se puede desplazar hacia cada lado, para habilitar o no las flechas. Se
 * recalcula al hacer scroll y cuando cambia el tamaño de la fila.
 *
 * @param ref - Referencia a la fila que se desplaza.
 * @returns `canPrevious` y `canNext`.
 */
function useScrollEdges(ref: React.RefObject<HTMLElement>) {
    const [canPrevious, setCanPrevious] = React.useState(false);
    const [canNext, setCanNext] = React.useState(true);

    React.useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const update = () => {
            const maxScroll = element.scrollWidth - element.clientWidth;
            setCanPrevious(element.scrollLeft > 1);
            setCanNext(element.scrollLeft < maxScroll - 1);
        };

        update();
        element.addEventListener('scroll', update, { passive: true });
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => {
            element.removeEventListener('scroll', update);
            observer.disconnect();
        };
    }, [ref]);

    return { canPrevious, canNext };
}

/**
 * Sección con una fila de tarjetas que se desplaza en horizontal (Figma: section-bestsellers):
 * título a la izquierda, una acción opcional ("Ver todo") y dos flechas, y debajo la fila con
 * 32 px entre tarjetas, recortada al ancho del contenedor para que la última se vea cortada.
 *
 * - Las flechas desplazan una tarjeta y se deshabilitan en los extremos. Respetan
 *   `prefers-reduced-motion`.
 * - Con ratón o con el dedo se desplaza igual, con el ajuste (`scroll-snap`) a cada tarjeta, y
 *   con teclado basta tabular por los enlaces de las tarjetas: el navegador las lleva a la vista.
 * - Hasta `lg` se ven 2 tarjetas por pantalla y las flechas no se pintan (el diseño móvil no las
 *   trae; se desplaza con el dedo). Desde `lg`, tarjetas de 336 px.
 *
 * @example
 * <ShopCarousel title="Nuestros favoritos">
 *     {items.map((item) => <ProductCard key={item.id} product={item} />)}
 * </ShopCarousel>
 */
export function ShopCarousel({ title, action, children, className }: ShopCarouselProps) {
    const titleId = React.useId();
    const listId = React.useId();
    const listRef = React.useRef<HTMLUListElement>(null);
    const { canPrevious, canNext } = useScrollEdges(listRef);

    /** Desplaza la fila una tarjeta (su ancho más el hueco) hacia un lado. */
    function scrollByCard(direction: 1 | -1) {
        const list = listRef.current;
        if (!list) return;
        const [first, second] = Array.from(list.children) as HTMLElement[];
        const step = second ? second.offsetLeft - first.offsetLeft : list.clientWidth;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        list.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    return (
        <section
            aria-labelledby={titleId}
            className={cn('flex w-full flex-col gap-8 lg:gap-12', className)}
        >
            <div className="flex min-h-9 items-center gap-4 lg:min-h-12">
                <h2
                    id={titleId}
                    className="min-w-0 flex-1 font-display text-3xl font-medium lg:text-4xl lg:font-normal"
                >
                    {title}
                </h2>
                {action}
                <IconButton
                    aria-label="Anterior"
                    aria-controls={listId}
                    size="lg"
                    className="hidden lg:inline-flex [&_svg]:size-5"
                    disabled={!canPrevious}
                    onClick={() => scrollByCard(-1)}
                >
                    <ArrowLeft />
                </IconButton>
                <IconButton
                    aria-label="Siguiente"
                    aria-controls={listId}
                    size="lg"
                    className="hidden lg:inline-flex [&_svg]:size-5"
                    disabled={!canNext}
                    onClick={() => scrollByCard(1)}
                >
                    <ArrowRight />
                </IconButton>
            </div>
            <ul
                id={listId}
                ref={listRef}
                className="relative flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto lg:gap-8 [&::-webkit-scrollbar]:hidden"
            >
                {React.Children.toArray(children).map((child, index) => (
                    <li
                        key={React.isValidElement(child) && child.key !== null ? child.key : index}
                        className="flex w-[calc((100%-1.5rem)/2)] shrink-0 snap-start lg:w-84"
                    >
                        {child}
                    </li>
                ))}
            </ul>
        </section>
    );
}
