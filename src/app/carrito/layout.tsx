import { SiteFooter } from '@/components/shop/site-footer';

/**
 * Marco de la página del carrito: el footer abajo, como en `/productos`. La cabecera va en la
 * página (`CatalogHero`), porque se superpone a la foto de la cabecera.
 */
export default function CartLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <SiteFooter />
        </>
    );
}
