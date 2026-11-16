import { SiteFooter } from '@/components/shop/site-footer';

/**
 * Marco de la tienda: el footer abajo para todas las páginas de `/productos`. La cabecera no va
 * aquí: cada página pinta la suya (`SiteHeader`) porque el listado la superpone al hero, con otro
 * estilo, y el resto la lleva normal arriba.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <SiteFooter />
        </>
    );
}
