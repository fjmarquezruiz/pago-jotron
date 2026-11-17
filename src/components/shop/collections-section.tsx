import Link from 'next/link';
import { CategoryCard } from '@/components/shop/category-card';
import { ShopCarousel } from '@/components/shop/shop-carousel';
import { Button } from '@/components/ui/button';

// MAQUETA: nombres y fotos de ejemplo del diseño de Figma (la 2.ª se llama "Generosos" y el resto
// "Categoría"). Reemplazar por las categorías reales cuando exista el filtro por categoría.
const COLLECTIONS = [
    { name: 'Categoría', image: '/images/placeholders/colecciones/card-1.jpg' },
    { name: 'Generosos', image: '/images/placeholders/colecciones/card-2.jpg' },
    { name: 'Categoría', image: '/images/placeholders/colecciones/card-3.jpg' },
    { name: 'Categoría', image: '/images/placeholders/colecciones/card-4.jpg' },
    { name: 'Categoría', image: '/images/placeholders/colecciones/card-5.jpg' },
    { name: 'Categoría', image: '/images/placeholders/colecciones/card-6.jpg' },
];

/**
 * "Nuestras colecciones": carrusel de tarjetas de categoría con el botón "Ver todo". Como en el
 * diseño, el botón no sale por debajo de 640 px; de 640 a 1279 px es un botón sin borde de 40 px y
 * desde 1280 px, el botón con borde de 48 px.
 *
 * MAQUETA: los datos y las fotos son de ejemplo, copiados del diseño; no vienen de la BD (la tabla
 * `categories` no tiene imagen ni slug). La versión real será el catálogo filtrado por categoría,
 * que llega con los filtros (punto 4).
 *
 * @example
 * <CollectionsSection />
 */
export function CollectionsSection() {
    return (
        <ShopCarousel
            title="Nuestras colecciones"
            action={
                <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="hidden h-control-md border-transparent px-inset-lg text-sm sm:inline-flex xl:h-control-lg xl:border-input xl:px-inset-xl xl:text-base"
                >
                    {/* TODO: ruta pendiente (slug ficticio) */}
                    <Link href="/colecciones">Ver todo</Link>
                </Button>
            }
        >
            {COLLECTIONS.map(({ name, image }) => (
                // TODO: enlazar a /productos?categoria=… cuando exista el filtro por categoría (punto 4)
                <CategoryCard key={image} name={name} image={image} href="/productos" />
            ))}
        </ShopCarousel>
    );
}
