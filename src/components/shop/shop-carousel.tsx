'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
    CAROUSEL_GAP_CLASS,
    CAROUSEL_HEADER_CLASS,
    CAROUSEL_ITEM_CLASS,
    CAROUSEL_SECTION_CLASS,
    CAROUSEL_TITLE_CLASS,
} from '@/components/shop/carousel-layout';
import { IconButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ShopCarouselProps {
    /** Título de la sección (un `h2`). */
    title: string;
    /**
     * Acción junto al título, por ejemplo el botón "Ver todo". Su visibilidad según el ancho la
     * decide quien la pasa (en el diseño, el botón no sale por debajo de 640 px).
     */
    action?: React.ReactNode;
    /** Los elementos de la fila (tarjetas). Cada uno va dentro de su `<li>`. */
    children: React.ReactNode;
    className?: string;
    /**
     * Clases del `<li>` de cada elemento, para cambiar su ancho. Por defecto, desde 1280 px miden
     * 336 px y la siguiente asoma; un bloque con pocos elementos puede repartir el ancho
     * (`xl:w-[calc((100%-6rem)/4)]`) para que se vean todos.
     */
    itemClassName?: string;
}

/** Hasta dónde se puede desplazar la fila y si hay algo que desplazar. */
interface ScrollEdges {
    /** `true` si hay más contenido que ancho: solo entonces tienen sentido las flechas. */
    overflows: boolean;
    canPrevious: boolean;
    canNext: boolean;
}

/**
 * Indica si la fila se puede desplazar y hacia qué lado, para pintar o no las flechas y habilitar
 * cada una. Se recalcula al hacer scroll y cuando cambia el tamaño de la fila. Antes de medir (en
 * el servidor y en el primer pintado) no hay flechas: sin JavaScript tampoco funcionarían.
 *
 * @param ref - Referencia a la fila que se desplaza.
 * @returns `overflows`, `canPrevious` y `canNext`.
 */
function useScrollEdges(ref: React.RefObject<HTMLElement>): ScrollEdges {
    const [edges, setEdges] = React.useState<ScrollEdges>({
        overflows: false,
        canPrevious: false,
        canNext: false,
    });

    React.useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const update = () => {
            const maxScroll = element.scrollWidth - element.clientWidth;
            const next = {
                overflows: maxScroll > 1,
                canPrevious: element.scrollLeft > 1,
                canNext: element.scrollLeft < maxScroll - 1,
            };
            setEdges((current) =>
                current.overflows === next.overflows &&
                current.canPrevious === next.canPrevious &&
                current.canNext === next.canNext
                    ? current
                    : next,
            );
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

    return edges;
}

/**
 * Sección con una fila de tarjetas que se desplaza en horizontal (Figma: section-bestsellers, y
 * los bloques de la home en 480, 640, 768 y 1024 px). Título a la izquierda, una acción opcional
 * ("Ver todo") y dos flechas, y debajo la fila.
 *
 * Cuántas tarjetas se ven a la vez y cómo es la cabecera cambian con el ancho, como en Figma:
 *
 * | Ancho            | Tarjetas por vista   | Cabecera                                | Hueco |
 * | ---------------- | -------------------- | --------------------------------------- | ----- |
 * | < 640 px         | 1                    | 36 px, flechas de 36 px                 | 32 px |
 * | 640 – 1023 px    | 2                    | 40 px, flechas de 40 px                 | 32 px |
 * | 1024 – 1279 px   | 3                    | 40 px, flechas de 40 px                 | 40 px |
 * | >= 1280 px       | tarjetas de 336 px   | 48 px, flechas negras de 48 px          | 48 px |
 *
 * Desde 1280 px las tarjetas miden 336 px con 32 px entre ellas y la siguiente asoma cortada;
 * por debajo se reparten el ancho con 24 px entre ellas.
 *
 * - Las flechas desplazan una tarjeta y se deshabilitan en los extremos. Solo se pintan si hay
 *   algo que desplazar: una fila a la que le caben todas las tarjetas no las lleva. Respetan
 *   `prefers-reduced-motion`.
 * - Con ratón o con el dedo se desplaza igual, con el ajuste (`scroll-snap`) a cada tarjeta, y
 *   con teclado basta tabular por los enlaces de las tarjetas: el navegador las lleva a la vista.
 * - Si el título es largo y las flechas no caben a su lado, bajan a una segunda línea.
 *
 * @example
 * <ShopCarousel title="Nuestros favoritos">
 *     {items.map((item) => <ProductCard key={item.id} product={item} />)}
 * </ShopCarousel>
 */
export function ShopCarousel({
    title,
    action,
    children,
    className,
    itemClassName,
}: ShopCarouselProps) {
    const titleId = React.useId();
    const listId = React.useId();
    const listRef = React.useRef<HTMLUListElement>(null);
    const { overflows, canPrevious, canNext } = useScrollEdges(listRef);

    /** Desplaza la fila una tarjeta (su ancho más el hueco) hacia un lado. */
    function scrollByCard(direction: 1 | -1) {
        const list = listRef.current;
        if (!list) return;
        const [first, second] = Array.from(list.children) as HTMLElement[];
        const step = second ? second.offsetLeft - first.offsetLeft : list.clientWidth;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        list.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    /**
     * Las dos flechas en una de las dos versiones del diseño: contorno de 36 px (40 desde 640 px)
     * con icono de 16 px hasta 1279 px, y negras de 48 px con icono de 20 px desde 1280 px. Cada
     * versión se oculta con CSS en el otro rango (`display: none` también la saca de la
     * accesibilidad), así no hay que medir el ancho en JavaScript.
     */
    function arrows(version: 'compact' | 'wide') {
        const compact = version === 'compact';
        const common = {
            'aria-controls': listId,
            size: compact ? ('sm' as const) : ('lg' as const),
            variant: compact ? ('outline' as const) : undefined,
            className: compact
                ? 'sm:size-control-md xl:hidden [&_svg]:size-4'
                : 'hidden xl:inline-flex [&_svg]:size-5',
        };
        return (
            <>
                <IconButton
                    {...common}
                    aria-label="Anterior"
                    disabled={!canPrevious}
                    onClick={() => scrollByCard(-1)}
                >
                    <ArrowLeft />
                </IconButton>
                <IconButton
                    {...common}
                    aria-label="Siguiente"
                    disabled={!canNext}
                    onClick={() => scrollByCard(1)}
                >
                    <ArrowRight />
                </IconButton>
            </>
        );
    }

    return (
        <section aria-labelledby={titleId} className={cn(CAROUSEL_SECTION_CLASS, className)}>
            <div className={CAROUSEL_HEADER_CLASS}>
                <h2 id={titleId} className={CAROUSEL_TITLE_CLASS}>
                    {title}
                </h2>
                {action}
                {overflows && (
                    <div className="ml-auto flex items-center gap-3 sm:ml-0 sm:gap-4">
                        {arrows('compact')}
                        {arrows('wide')}
                    </div>
                )}
            </div>
            <ul
                id={listId}
                ref={listRef}
                className={cn(
                    'relative flex snap-x snap-mandatory scrollbar-none overflow-x-auto [&::-webkit-scrollbar]:hidden',
                    CAROUSEL_GAP_CLASS,
                )}
            >
                {React.Children.toArray(children).map((child, index) => (
                    <li
                        key={React.isValidElement(child) && child.key !== null ? child.key : index}
                        className={cn(CAROUSEL_ITEM_CLASS, itemClassName)}
                    >
                        {child}
                    </li>
                ))}
            </ul>
        </section>
    );
}
