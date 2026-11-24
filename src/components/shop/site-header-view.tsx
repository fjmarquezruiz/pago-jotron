import Image from 'next/image';
import Link from 'next/link';
import { CartCount } from '@/components/shop/cart-count';
import { SignOutButton } from '@/components/shop/sign-out-button';
import { Navbar, NavbarItem } from '@/components/ui/navbar';
import { ACCOUNT_ITEMS, type AccountSection } from '@/components/account/account-items';
import type { Role } from '@/types/auth';

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
 * "Carrito (n)" cuenta las unidades del carrito (`CartCount`). Con sesión, "Iniciar sesión" pasa a
 * ser "Mi cuenta" (Figma: Menu), que lleva al historial de pedidos, y "Cerrar sesión"
 * (`SignOutButton`; ese botón no está en Figma, pero permite cerrar sesión desde cualquier página).
 * Si quien entra es editor o administrador, hay además un enlace "Panel" al panel de
 * administración (RF13; tampoco está en Figma). Un cliente no lo ve.
 *
 * Es la parte de presentación: no lee la sesión, así que también se puede pintar desde un
 * componente cliente (la página 500 del panel). `SiteHeader` la monta con la sesión del servidor.
 *
 * Con `overlay` se superpone al principio de la página (el hero del listado): se coloca en
 * absoluto arriba, en el tema oscuro del sistema (texto claro) y con el logo blanco. El menú
 * lateral del móvil sigue con el tema claro, porque se abre fuera de este bloque.
 *
 * Con sesión, el drawer móvil añade la sección "Mi cuenta" (Datos personales, Historial de pedidos,
 * Direcciones y Cerrar sesión): en pantallas pequeñas no hay menú lateral de cuenta.
 *
 * @param props.signedIn - `true` si hay sesión.
 * @param props.role - Rol de la sesión; con `Editor` o `Administrador` sale el enlace "Panel".
 * @param props.overlay - `true` para superponerla sobre una imagen oscura.
 * @param props.accountCurrent - Sección de la cuenta que se marca como actual en el drawer.
 *
 * @example
 * <SiteHeaderView signedIn role="Editor" />
 */
export function SiteHeaderView({
    signedIn,
    role,
    overlay = false,
    accountCurrent,
}: {
    signedIn: boolean;
    role?: Role;
    overlay?: boolean;
    accountCurrent?: AccountSection;
}) {
    const canOpenPanel = signedIn && (role === 'Editor' || role === 'Administrador');

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
                    {signedIn ? (
                        <>
                            {canOpenPanel && (
                                <NavbarItem asChild className="hidden lg:inline-flex">
                                    <Link href="/admin">Panel</Link>
                                </NavbarItem>
                            )}
                            <NavbarItem asChild className="hidden lg:inline-flex">
                                <Link href="/cuenta/pedidos">Mi cuenta</Link>
                            </NavbarItem>
                            <SignOutButton />
                        </>
                    ) : (
                        <NavbarItem asChild className="hidden lg:inline-flex">
                            <Link href="/auth/login">Iniciar sesión</Link>
                        </NavbarItem>
                    )}
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
            {canOpenPanel && (
                // Solo en el drawer móvil: en escritorio hay "Panel" arriba a la derecha.
                <NavbarItem asChild className="lg:hidden">
                    <Link href="/admin">Panel</Link>
                </NavbarItem>
            )}
            {signedIn && (
                <>
                    {/* Solo en el drawer móvil: en escritorio hay "Mi cuenta" arriba a la derecha. */}
                    <p className="mt-gap-md px-inset-sm text-xs font-medium text-muted-foreground lg:hidden">
                        Mi cuenta
                    </p>
                    {ACCOUNT_ITEMS.map(({ section, label, href, icon: Icon }) => (
                        <NavbarItem
                            key={section}
                            asChild
                            icon={<Icon />}
                            current={section === accountCurrent}
                            className="lg:hidden"
                        >
                            <Link href={href}>{label}</Link>
                        </NavbarItem>
                    ))}
                    <SignOutButton placement="drawer" />
                </>
            )}
        </Navbar>
    );

    if (!overlay) return header;
    return <div className="dark absolute inset-x-0 top-0 z-40 text-foreground">{header}</div>;
}
