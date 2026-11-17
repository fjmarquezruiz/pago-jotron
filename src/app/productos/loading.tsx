import { CatalogFiltersSkeleton, CatalogGridSkeleton } from '@/components/shop/catalog-skeleton';
import { CatalogHero } from '@/components/shop/catalog-hero';

/**
 * Carga del listado `/productos`: el hero y la cabecera son los de verdad (no dependen de la BD) y
 * debajo, esqueletos de la barra de filtros y de la rejilla con las mismas medidas que la página,
 * para que no haya saltos al llegar los datos. El pie lo pone `layout.tsx`.
 *
 * Se ve al entrar en `/productos` desde otra página o al cargarla. Al filtrar o cambiar de página
 * no sale: Next no la vuelve a enseñar cuando solo cambian los parámetros de la URL, y ahí el
 * listado anterior se queda atenuado (`CatalogPendingProvider`).
 */
export default function CatalogLoading() {
    return (
        <main aria-busy="true">
            <span role="status" className="sr-only">
                Cargando productos
            </span>
            <CatalogHero />
            <div className="px-6 py-16 lg:py-40">
                <div className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40">
                    <section aria-hidden="true" className="flex flex-col gap-12">
                        <CatalogFiltersSkeleton />
                        <CatalogGridSkeleton />
                    </section>
                </div>
            </div>
        </main>
    );
}
