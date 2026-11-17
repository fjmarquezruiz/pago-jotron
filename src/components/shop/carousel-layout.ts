// Clases del carrusel de la tienda (`ShopCarousel`) que comparte su esqueleto
// (`ShopCarouselSkeleton`), para que el esqueleto mida exactamente lo mismo que el carrusel real y
// no haya un salto cuando llegan los datos. Viven en un módulo sin `'use client'` porque las usan
// un componente de cliente y otro de servidor.

/** La sección: título, hueco y fila (32 px bajo 1024, 40 px hasta 1279 y 48 px desde 1280). */
export const CAROUSEL_SECTION_CLASS = 'flex w-full flex-col gap-8 lg:gap-10 xl:gap-12';

/** La cabecera: 36 px bajo 640, 40 px hasta 1279 y 48 px desde 1280. */
export const CAROUSEL_HEADER_CLASS =
    'flex min-h-9 flex-wrap items-center gap-3 sm:min-h-10 sm:flex-nowrap sm:gap-4 xl:min-h-12';

/** El título (`h2`). */
export const CAROUSEL_TITLE_CLASS =
    'min-w-64 flex-1 font-display text-3xl font-medium sm:min-w-0 xl:text-4xl xl:font-normal';

/** El hueco entre tarjetas: 24 px, y 32 px desde 1280. */
export const CAROUSEL_GAP_CLASS = 'gap-6 xl:gap-8';

/**
 * El `<li>` de cada tarjeta: 1 por vista bajo 640 px, 2 hasta 1023, 3 hasta 1279 y de 336 px desde
 * 1280.
 */
export const CAROUSEL_ITEM_CLASS =
    'flex w-full shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-84';
