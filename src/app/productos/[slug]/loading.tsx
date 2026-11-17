import { ProductPageSkeleton } from '@/components/shop/product-skeleton';
import { SiteHeader } from '@/components/shop/site-header';

/**
 * Carga de la ficha `/productos/[slug]`: la cabecera del sitio es la de verdad y debajo, un
 * esqueleto con la forma de la ficha. Va en esta carpeta y no solo en `/productos` porque el
 * `loading.tsx` de una carpeta lo heredan sus subrutas: sin este, la ficha enseñaría el esqueleto
 * del listado.
 */
export default function ProductLoading() {
    return (
        <>
            <SiteHeader />
            <ProductPageSkeleton />
        </>
    );
}
