import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogFilters } from '@/components/shop/catalog-filters';
import { CatalogHero } from '@/components/shop/catalog-hero';
import { CatalogNoResults } from '@/components/shop/catalog-no-results';
import { CatalogPagination } from '@/components/shop/catalog-pagination';
import { CatalogPendingProvider, CatalogResults } from '@/components/shop/catalog-pending';
import { CollectionsSection } from '@/components/shop/collections-section';
import { FavoritesSection } from '@/components/shop/favorites-section';
import { ProductCard } from '@/components/shop/product-card';
import { ShopCarouselSkeleton } from '@/components/shop/shop-carousel-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { hasActiveFilters } from '@/lib/catalog/active-filters';
import { CATALOG_RESULTS_ID, catalogPageHref } from '@/lib/catalog/catalog-url';
import { sameFilters, sanitizeFilters } from '@/lib/catalog/filter-options';
import { CATALOG_PAGE_SIZE, getPagination } from '@/lib/catalog/pagination';
import { getCatalogFilterOptions, getCatalogPage } from '@/lib/db/queries';
import { catalogSearchParamsSchema } from '@/lib/validations/catalog';

/**
 * El listado depende del stock y de los bloqueos (producto, bodega, D.O. y presentaciones), que
 * cambian desde el panel de administración, y los favoritos son aleatorios: no se cachea.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'La tienda | Pago de Jotrón' };

interface CatalogPageProps {
    searchParams: Record<string, string | string[] | undefined>;
}

/**
 * Listado de productos (RF4, RF5): hero, barra de búsqueda, filtros y orden, rejilla de 12
 * tarjetas por página, paginación con enlaces `?page=N`, colecciones y favoritos.
 *
 * La URL lleva el estado: `page`, `q`, `do`, `bodega`, `uva`, `tipologia`, `precio`, `anada` y
 * `orden` se validan con `catalogSearchParamsSchema` (lo inválido no rompe la página: se corrige o
 * se ignora) y los ids se comprueban además contra las opciones de los selects: un id que no se
 * puede elegir (no existe, está bloqueado o no tiene productos) se descarta en vez de filtrar por
 * algo que la barra no deja quitar. Si la página pedida pasa de la última, redirige a la última
 * conservando los filtros.
 *
 * Mientras se carga (`loading.tsx`) se ve el listado con esqueletos. Al filtrar o cambiar de
 * página se sigue viendo el listado anterior, atenuado, hasta que llega el nuevo
 * (`CatalogPendingProvider`). "Nuestros favoritos" va en un `Suspense`: carga aparte y no retrasa
 * los resultados. Sin resultados, enseña el estado vacío: el de los filtros si hay alguno
 * activo y el del catálogo vacío si no.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
    const {
        page: requestedPage,
        orden,
        ...requestedFilters
    } = catalogSearchParamsSchema.parse(searchParams);
    // Las opciones y el listado se piden a la vez. El listado va con los filtros tal como llegan de
    // la URL, y solo si `sanitizeFilters` descarta alguno (un id que no se puede elegir, algo poco
    // habitual) se repite con los filtros saneados.
    const [options, requestedPageData] = await Promise.all([
        getCatalogFilterOptions(),
        getCatalogPage({
            page: requestedPage,
            pageSize: CATALOG_PAGE_SIZE,
            filters: requestedFilters,
            orden,
        }),
    ]);
    const filters = sanitizeFilters(requestedFilters, options);
    const { items, total } = sameFilters(filters, requestedFilters)
        ? requestedPageData
        : await getCatalogPage({
              page: requestedPage,
              pageSize: CATALOG_PAGE_SIZE,
              filters,
              orden,
          });

    const pagination = getPagination({
        page: requestedPage,
        pageSize: CATALOG_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange) redirect(catalogPageHref(pagination.page, { filters, orden }));

    return (
        <main>
            <CatalogHero />
            <div className="px-6 py-16 lg:py-40">
                <div className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40">
                    <CatalogPendingProvider>
                        <section
                            id={CATALOG_RESULTS_ID}
                            aria-label="Productos"
                            className="flex scroll-mt-6 flex-col gap-12"
                        >
                            <CatalogFilters
                                options={options}
                                filters={filters}
                                orden={orden}
                                total={total}
                            />
                            <CatalogResults>
                                {total > 0 ? (
                                    <>
                                        {/*
                                         * Sin diseño propio del listado por debajo de escritorio: se reparte como los
                                         * bloques de la home (Figma, 480-1024 px): 1 columna, 2 desde 640 px, 3 desde
                                         * 1024 px y 4 desde 1280 px.
                                         */}
                                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8">
                                            {items.map((product, index) => (
                                                <li key={product.id} className="grid min-w-0">
                                                    <ProductCard
                                                        product={product}
                                                        priority={index < 4}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                        <CatalogPagination
                                            page={pagination.page}
                                            totalPages={pagination.totalPages}
                                            filters={filters}
                                            orden={orden}
                                        />
                                    </>
                                ) : hasActiveFilters(filters) ? (
                                    <CatalogNoResults q={filters.q} orden={orden} />
                                ) : (
                                    <EmptyState titleAs="h2" title="No hay productos disponibles" />
                                )}
                            </CatalogResults>
                        </section>
                    </CatalogPendingProvider>

                    {/* Maqueta con datos del diseño: no sale en producción hasta que haya categorías reales. */}
                    {process.env.VERCEL_ENV !== 'production' && <CollectionsSection />}
                    {/* Su consulta es aparte y al azar: no retrasa los resultados de arriba. */}
                    <Suspense
                        fallback={<ShopCarouselSkeleton title="Nuestros favoritos" count={8} />}
                    >
                        <FavoritesSection />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
