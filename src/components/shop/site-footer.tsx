import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FooterLink {
    label: string;
    href: string;
}

/**
 * Columnas de enlaces del footer. Ninguna de estas rutas existe todavía.
 * TODO: ruta pendiente en todos los `href: '#'`.
 */
const columns: { title: string; links: FooterLink[] }[] = [
    {
        title: 'TIENDA',
        links: [
            { label: 'Colecciones', href: '#' },
            { label: 'Vinos tintos', href: '#' },
            { label: 'Vinos blancos', href: '#' },
            { label: 'Pasas', href: '#' },
        ],
    },
    {
        title: 'SOBRE NOSOTROS',
        links: [
            { label: 'Nuestra historia', href: '#' },
            { label: 'La bodega', href: '#' },
            { label: 'Diario', href: '#' },
            { label: 'Eventos', href: '#' },
        ],
    },
    {
        title: 'AYUDA',
        links: [
            { label: 'Preguntas frecuentes', href: '#' },
            { label: 'Contacto', href: '#' },
            { label: 'Envíos', href: '#' },
            { label: 'Devoluciones', href: '#' },
        ],
    },
];

/** Columna extra del footer móvil: en escritorio estas redes van como iconos. TODO: URLs de las redes. */
const socialColumn = {
    title: 'SÍGUENOS',
    links: [
        { label: 'instagram', href: '#' },
        { label: 'x / twitter', href: '#' },
        { label: 'facebook', href: '#' },
    ],
};

/** Iconos de redes del footer de escritorio. TODO: URLs de las redes. */
const socialIcons = [
    { label: 'Instagram', href: '#', icon: '/images/brand/instagram.svg' },
    { label: 'X', href: '#', icon: '/images/brand/x.svg' },
    { label: 'Facebook', href: '#', icon: '/images/brand/facebook.svg' },
];

/** Enlaces legales. Privacidad, cookies y condiciones ya son rutas públicas. */
const legalLinks: FooterLink[] = [
    // TODO: ruta pendiente
    { label: 'Aviso legal', href: '#' },
    { label: 'Privacidad', href: '/privacidad' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Condiciones de compra', href: '/condiciones' },
];

/**
 * Columna del footer: título en negrita y enlaces atenuados.
 *
 * @param props.title - Título de la columna.
 * @param props.links - Enlaces de la columna.
 */
function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
    return (
        <div className="flex flex-col gap-3">
            <p className="font-semibold">{title}</p>
            {links.map(({ label, href }) => (
                <Link key={label} href={href} className="w-fit opacity-60 hover:opacity-100">
                    {label}
                </Link>
            ))}
        </div>
    );
}

/**
 * Pie de la tienda (Figma: Footer), sobre el tema oscuro del sistema de diseño. En escritorio:
 * marca, texto e iconos de redes a la izquierda y tres columnas de enlaces a la derecha. En
 * móvil: marca y texto, rejilla de columnas de dos en dos (con "Síguenos" en lugar de los iconos)
 * y los enlaces legales en varias líneas.
 *
 * @example
 * <SiteFooter />
 */
export function SiteFooter() {
    return (
        <footer className="dark flex flex-col items-center gap-12 bg-background px-6 pt-16 pb-10 text-foreground lg:gap-20 lg:px-10 lg:pt-20">
            <div className="flex w-full max-w-9xl flex-col gap-12 lg:gap-20">
                <div className="flex flex-col gap-12 lg:flex-row lg:gap-8">
                    <div className="flex w-full max-w-120 flex-col gap-6 lg:min-w-0 lg:flex-1">
                        <Image
                            src="/images/brand/logo-footer.svg"
                            alt="Pago de Jotrón"
                            width={230}
                            height={32}
                        />
                        <p className="text-sm opacity-60 lg:text-base">
                            En el Parque Natural Montes de Málaga, cuidamos la herencia vinícola de
                            Málaga para las próximas generaciones.
                        </p>
                        <ul className="hidden items-center gap-5 lg:flex">
                            {socialIcons.map(({ label, href, icon }) => (
                                <li key={label}>
                                    <Button asChild variant="ghost" size="icon">
                                        <a href={href} aria-label={label}>
                                            <Image src={icon} alt="" width={16} height={16} />
                                        </a>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <nav
                        aria-label="Pie de página"
                        className="grid grid-cols-2 gap-x-4 gap-y-12 text-sm whitespace-nowrap lg:flex lg:min-w-0 lg:flex-1 lg:items-start lg:justify-end lg:gap-20"
                    >
                        {columns.map((column) => (
                            <FooterColumn key={column.title} {...column} />
                        ))}
                        <div className="lg:hidden">
                            <FooterColumn {...socialColumn} />
                        </div>
                    </nav>
                </div>

                <div className="h-px w-full bg-foreground opacity-10" />

                <div className="flex flex-col gap-8 text-sm lg:flex-row">
                    <p className="opacity-40 lg:whitespace-nowrap">
                        © {new Date().getFullYear()} Pago de Jotrón. Todos los derechos reservados.
                    </p>
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 whitespace-nowrap lg:min-w-0 lg:flex-1 lg:justify-end lg:gap-4">
                        {legalLinks.map(({ label, href }) => (
                            <li key={label}>
                                <Link href={href} className="opacity-40 hover:opacity-100">
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
}
