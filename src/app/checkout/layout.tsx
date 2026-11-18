import { SiteFooter } from '@/components/shop/site-footer';

/** Marco del checkout: el footer abajo, como en `/productos` y `/carrito`. */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <SiteFooter />
        </>
    );
}
