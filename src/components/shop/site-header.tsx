import Image from 'next/image';
import Link from 'next/link';
import { CartCount } from '@/components/shop/cart-count';
import { Navbar, NavbarItem } from '@/components/ui/navbar';

/**
 * Enlaces de la izquierda. Salvo `/productos`, ninguna ruta existe todavía: llevan un slug
 * ficticio (no `#`, que el lector de pantalla anuncia como un enlace que no va a ningún sitio).
 */
const mainLinks = [
    { label: 'La tienda', href: '/productos' },
    // TODO: ruta pendiente (slug ficticio)
    { label: 'Eventos', href: '/eventos' },
    // TODO: ruta pendiente (slug ficticio)
    { label: 'La bodega', href: '/la-bodega' },
    // TODO: ruta pendiente (slug ficticio)
    { label: 'Blog', href: '/blog' },
];

/**
 * Cabecera de la tienda (Figma: Menu): enlaces a la izquierda, logo centrado y cuenta y carrito a
 * la derecha. Por debajo de `lg` los enlaces pasan al menú lateral y solo queda el carrito.
 * "Carrito (n)" cuenta las unidades del carrito (`CartCount`).
 *
 * Con `overlay` se superpone al principio de la página (el hero del listado): se coloca en
 * absoluto arriba, en el tema oscuro del sistema (texto claro) y con el logo blanco. El menú
 * lateral del móvil sigue con el tema claro, porque se abre fuera de este bloque.
 *
 * @param props.overlay - `true` para superponerla sobre una imagen oscura.
 *
 * @example
 * <SiteHeader />
 * <SiteHeader overlay />
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
    const header = (
        <Navbar
            layout="centered"
            variant="transparent"
            className="border-b-0"
            brand={
                <Link href="/" aria-label="Pago de Jotrón, ir a la portada" className="flex">
                    <Image
                        src={overlay ? '/images/brand/logo-white.svg' : '/images/brand/logo.svg'}
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
                        className={overlay ? 'invert lg:hidden' : 'lg:hidden'}
                    />
                </Link>
            }
            actions={
                <>
                    <NavbarItem asChild className="hidden lg:inline-flex">
                        {/* TODO: ruta pendiente (slug ficticio) */}
                        <Link href="/encuentranos">Encuéntranos</Link>
                    </NavbarItem>
                    <NavbarItem asChild className="hidden lg:inline-flex">
                        <Link href="/auth/login">Iniciar sesión</Link>
                    </NavbarItem>
                    <NavbarItem asChild>
                        <Link href="/carrito">
                            Carrito (<CartCount />)
                        </Link>
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

    if (!overlay) return header;
    return <div className="dark absolute inset-x-0 top-0 z-40 text-foreground">{header}</div>;
}
