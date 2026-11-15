import { ProductCard } from '@/components/shop/product-card';
import { cn } from '@/lib/utils';

// TODO: sustituir por la consulta de recomendados
const PLACEHOLDER_PRODUCTS = [
    {
        name: 'Payoya Negra',
        region: 'Sierras de Málaga',
        price: 23.5,
        image: '/images/placeholders/payoya-negra.png',
    },
    {
        name: 'MH Vino de Autor Melonera',
        region: 'Sierras de Málaga',
        price: 42,
        image: '/images/placeholders/mh-vino-de-autor-melonera.png',
    },
    {
        name: 'Encina del Inglés Blanco',
        region: 'Sierras de Málaga',
        price: 12.9,
        image: '/images/placeholders/encina-del-ingles-blanco.png',
    },
    {
        name: 'Pago de Jotrón Tinto Selección',
        region: 'Sierras de Málaga',
        price: 18.5,
        image: '/images/placeholders/pago-de-jotron-tinto-seleccion.png',
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
                {PLACEHOLDER_PRODUCTS.map((product, index) => (
                    <li
                        key={product.name}
                        className={cn('min-w-0 flex-1', index >= 2 ? 'hidden lg:flex' : 'flex')}
                    >
                        <ProductCard
                            {...product}
                            alt={`Botella de ${product.name}`}
                            className="w-full"
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
