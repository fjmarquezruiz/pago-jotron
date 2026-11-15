import Image from 'next/image';
import Link from 'next/link';
import { Navbar, NavbarItem } from '@/components/ui/navbar';

/** Enlaces de la izquierda. Las rutas con `#` aún no existen. */
const mainLinks = [
    { label: 'La tienda', href: '/productos' },
    // TODO: ruta pendiente
    { label: 'Eventos', href: '#' },
    // TODO: ruta pendiente
    { label: 'La bodega', href: '#' },
    // TODO: ruta pendiente
    { label: 'Blog', href: '#' },
];

/**
 * Cabecera de la tienda (Figma: Menu): enlaces a la izquierda, logo centrado y cuenta y carrito a
 * la derecha. Por debajo de `lg` los enlaces pasan al menú lateral y solo queda el carrito.
 *
 * @example
 * <SiteHeader />
 */
export function SiteHeader() {
    // TODO(A8): contador real del carrito.
    const cartCount = 0;

    return (
        <Navbar
            layout="centered"
            variant="transparent"
            className="border-b-0"
            brand={
                <Link href="/" aria-label="Pago de Jotrón, ir a la portada" className="flex">
                    <Image
                        src="/images/brand/logo.svg"
                        alt=""
                        width={201}
                        height={28}
                        className="hidden lg:block"
                    />
                    <Image
                        src="/images/brand/logo-mobile.svg"
                        alt=""
                        width={87}
                        height={48}
                        className="lg:hidden"
                    />
                </Link>
            }
            actions={
                <>
                    <NavbarItem asChild className="hidden lg:inline-flex">
                        {/* TODO: ruta pendiente */}
                        <Link href="#">Encuéntranos</Link>
                    </NavbarItem>
                    <NavbarItem asChild className="hidden lg:inline-flex">
                        <Link href="/auth/login">Iniciar sesión</Link>
                    </NavbarItem>
                    <NavbarItem asChild>
                        {/* TODO: ruta pendiente */}
                        <Link href="#">Carrito ({cartCount})</Link>
                    </NavbarItem>
                </>
            }
        >
            {mainLinks.map(({ label, href }) => (
                <NavbarItem key={label} asChild>
                    <Link href={href}>{label}</Link>
                </NavbarItem>
            ))}
        </Navbar>
    );
}
