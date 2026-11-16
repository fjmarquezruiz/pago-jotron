import Image from 'next/image';
import { SiteHeader } from '@/components/shop/site-header';

/**
 * Cabecera del listado (Figma: hero+1st-section): 420 px con la foto de fondo bajo una capa negra
 * al 60 %, el menú superpuesto arriba y, pegados abajo, "La tienda" y el título de la página.
 * Es el `h1` de `/productos`. Va en el tema oscuro del sistema de diseño para que el texto sea claro.
 *
 * El diseño del listado solo existe para escritorio: en móvil se reutiliza la misma composición
 * (título de 48 px y menú de 68 px).
 *
 * @example
 * <CatalogHero />
 */
export function CatalogHero() {
    return (
        <section className="dark relative isolate h-105 overflow-hidden text-foreground">
            <Image
                src="/images/hero/tienda.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="-z-10 object-cover"
            />
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[var(--black-alpha-600)]"
            />
            <SiteHeader overlay />
            <div className="relative h-full px-6">
                <div className="mx-auto flex h-full w-full max-w-9xl flex-col justify-end pb-12">
                    <div className="flex flex-col gap-6 lg:max-w-[calc((100%-3rem)/2)]">
                        <p className="text-2xl">La tienda</p>
                        <h1 className="font-display text-5xl leading-none lg:text-7xl">
                            Los mejores vinos de Andalucía
                        </h1>
                    </div>
                </div>
            </div>
        </section>
    );
}
