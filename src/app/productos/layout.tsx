import { SiteFooter } from '@/components/shop/site-footer';
import { SiteHeader } from '@/components/shop/site-header';

/**
 * Marco de la tienda: cabecera arriba y footer abajo para todas las páginas de `/productos`
 * (la ficha, su `not-found` y el listado que vendrá).
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SiteHeader />
            {children}
            <SiteFooter />
        </>
    );
}
