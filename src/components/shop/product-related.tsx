import { ProductCard, type ProductCardProduct } from '@/components/shop/product-card';
import { cn } from '@/lib/utils';

/**
 * Datos de muestra del diseño, con el formato de `CatalogItem`. Los slugs son ficticios (no
 * existen en la BD: el enlace de la tarjeta lleva a la página de producto no disponible) y las
 * imágenes son archivos locales, no de Cloudinary.
 * TODO: sustituir por la consulta de recomendados
 */
const PLACEHOLDER_PRODUCTS: { product: ProductCardProduct; localImage: string }[] = [
    {
        product: {
            slug: 'payoya-negra',
            name: 'Payoya Negra',
            originName: 'Sierras de Málaga',
            image: null,
            minPrice: '23.50',
            variantCount: 1,
            totalStock: 1,
            isNew: false,
        },
        localImage: '/images/placeholders/payoya-negra.png',
    },
    {
        product: {
            slug: 'mh-vino-de-autor-melonera',
            name: 'MH Vino de Autor Melonera',
            originName: 'Sierras de Málaga',
            image: null,
            minPrice: '42.00',
            variantCount: 1,
            totalStock: 1,
            isNew: false,
        },
        localImage: '/images/placeholders/mh-vino-de-autor-melonera.png',
    },
    {
        product: {
            slug: 'encina-del-ingles-blanco',
            name: 'Encina del Inglés Blanco',
            originName: 'Sierras de Málaga',
            image: null,
            minPrice: '12.90',
            variantCount: 1,
            totalStock: 1,
            isNew: false,
        },
        localImage: '/images/placeholders/encina-del-ingles-blanco.png',
    },
    {
        product: {
            slug: 'pago-de-jotron-tinto-seleccion',
            name: 'Pago de Jotrón Tinto Selección',
            originName: 'Sierras de Málaga',
            image: null,
            minPrice: '18.50',
            variantCount: 1,
            totalStock: 1,
            isNew: false,
        },
        localImage: '/images/placeholders/pago-de-jotron-tinto-seleccion.png',
    },
];

/**
 * Sección "También te puede gustar": título y una fila de tarjetas de producto. Con datos de
 * muestra hasta que exista la consulta de recomendados.
 *
 * Cuatro tarjetas desde `lg` (1024 px) y dos por debajo, como el diseño móvil: a 1024 px cada
 * tarjeta mide unos 220 px, justo para que los nombres largos pasen a tres líneas sin romperse.
 * Es `w-full`: la página la coloca en un contenedor de 1440 px como máximo.
 *
 * @example
 * <ProductRelated />
 */
export function ProductRelated() {
    return (
        <section aria-labelledby="related-title" className="flex w-full flex-col gap-8 lg:gap-12">
            <div className="flex min-h-9 items-center lg:min-h-12 lg:items-baseline">
                <h2
                    id="related-title"
                    className="font-display text-3xl font-medium lg:text-4xl lg:font-normal"
                >
                    También te puede gustar
                </h2>
            </div>
            <ul className="flex items-stretch gap-6 lg:gap-8">
                {PLACEHOLDER_PRODUCTS.map(({ product, localImage }, index) => (
                    <li
                        key={product.slug}
                        className={cn('min-w-0 flex-1', index >= 2 ? 'hidden lg:flex' : 'flex')}
                    >
                        <ProductCard product={product} localImage={localImage} className="w-full" />
                    </li>
                ))}
            </ul>
        </section>
    );
}
