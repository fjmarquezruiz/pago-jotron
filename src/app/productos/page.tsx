import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CatalogHero } from '@/components/shop/catalog-hero';
import { CatalogPagination } from '@/components/shop/catalog-pagination';
import { CollectionsSection } from '@/components/shop/collections-section';
import { FavoritesSection } from '@/components/shop/favorites-section';
import { ProductCard } from '@/components/shop/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { catalogPageHref } from '@/lib/catalog/catalog-url';
import { CATALOG_PAGE_SIZE, getPagination } from '@/lib/catalog/pagination';
import { getCatalogPage } from '@/lib/db/queries';
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
 * Listado de productos (RF4): hero, número de productos, rejilla de 12 tarjetas por página,
 * paginación con enlaces `?page=N`, colecciones y favoritos. La barra de filtros, el buscador y
 * el orden llegan después.
 *
 * `page` se valida con `catalogSearchParamsSchema`: lo que no sea un entero >= 1 vale 1. Si la
 * página pedida pasa de la última (o ya no hay tantos productos), redirige a la última en vez de
 * pintar una rejilla vacía; si no hay ningún producto, enseña el estado vacío.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
    const { page: requestedPage } = catalogSearchParamsSchema.parse(searchParams);
    const { items, total } = await getCatalogPage({
        page: requestedPage,
        pageSize: CATALOG_PAGE_SIZE,
    });

    const pagination = getPagination({
        page: requestedPage,
        pageSize: CATALOG_PAGE_SIZE,
        total,
    });
    if (pagination.outOfRange) redirect(catalogPageHref(pagination.page));

    return (
        <main>
            <CatalogHero />
            <div className="px-6 py-16 lg:py-40">
                <div className="mx-auto flex w-full max-w-9xl flex-col gap-16 lg:gap-40">
                    <section aria-label="Productos" className="flex flex-col gap-12">
                        {total > 0 ? (
                            <>
                                <p className="flex h-10 items-center text-sm text-muted-foreground">
                                    {total === 1
                                        ? 'Mostrando 1 producto'
                                        : `Mostrando ${total} productos`}
                                </p>
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
                                />
                            </>
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
