import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CatalogFilters } from '@/components/shop/catalog-filters';
import { CatalogHero } from '@/components/shop/catalog-hero';
import { CatalogNoResults } from '@/components/shop/catalog-no-results';
import { CatalogPagination } from '@/components/shop/catalog-pagination';
import { CollectionsSection } from '@/components/shop/collections-section';
import { FavoritesSection } from '@/components/shop/favorites-section';
import { ProductCard } from '@/components/shop/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { hasActiveFilters } from '@/lib/catalog/active-filters';
import { catalogPageHref } from '@/lib/catalog/catalog-url';
import { sanitizeFilters } from '@/lib/catalog/filter-options';
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
 * conservando los filtros. Sin resultados, enseña el estado vacío: el de los filtros si hay alguno
 * activo y el del catálogo vacío si no.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
    const {
        page: requestedPage,
        orden,
        ...requestedFilters
    } = catalogSearchParamsSchema.parse(searchParams);
    const options = await getCatalogFilterOptions();
    const filters = sanitizeFilters(requestedFilters, options);
    const { items, total } = await getCatalogPage({
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
                    <section aria-label="Productos" className="flex flex-col gap-12">
                        <CatalogFilters
                            options={options}
                            filters={filters}
                            orden={orden}
                            total={total}
                        />
                        {total > 0 ? (
                            <>
                                {/* Sin diseño para tablet ni móvil: 2 columnas por debajo de `lg`. */}
                                <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
                                    {items.map((product, index) => (
                                        <li key={product.id} className="grid min-w-0">
                                            <ProductCard product={product} priority={index < 4} />
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
                    </section>

                    {/* Maqueta con datos del diseño: no sale en producción hasta que haya categorías reales. */}
                    {process.env.VERCEL_ENV !== 'production' && <CollectionsSection />}
                    <FavoritesSection />
                </div>
            </div>
        </main>
    );
}
