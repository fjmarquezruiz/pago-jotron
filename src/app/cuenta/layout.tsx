import { SiteFooter } from '@/components/shop/site-footer';

/** Marco del área de cliente: el footer abajo, como en `/checkout`. La cabecera la pone `AccountShell`. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <SiteFooter />
        </>
    );
}
