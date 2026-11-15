import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FooterLink {
    label: string;
    href: string;
    /** Enlace a otro sitio: se abre en una pestaña nueva. */
    external?: boolean;
}

/**
 * Columnas de enlaces del footer. Ninguna de estas rutas existe todavía: llevan un slug ficticio
 * (no `#`, que el lector de pantalla anuncia como un enlace que no va a ningún sitio).
 * TODO: ruta pendiente en todos los enlaces de las columnas.
 */
const columns: { title: string; links: FooterLink[] }[] = [
    {
        title: 'TIENDA',
        links: [
            { label: 'Colecciones', href: '/colecciones' },
            { label: 'Vinos tintos', href: '/vinos-tintos' },
            { label: 'Vinos blancos', href: '/vinos-blancos' },
            { label: 'Pasas', href: '/pasas' },
        ],
    },
    {
        title: 'SOBRE NOSOTROS',
        links: [
            { label: 'Nuestra historia', href: '/nuestra-historia' },
            { label: 'La bodega', href: '/la-bodega' },
            { label: 'Diario', href: '/diario' },
            { label: 'Eventos', href: '/eventos' },
        ],
    },
    {
        title: 'AYUDA',
        links: [
            { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
            { label: 'Contacto', href: '/contacto' },
            { label: 'Envíos', href: '/envios' },
            { label: 'Devoluciones', href: '/devoluciones' },
        ],
    },
];

/**
 * Columna extra del footer móvil: en escritorio estas redes van como iconos. Las redes son sitios
 * externos, así que llevan la portada de cada plataforma. TODO: URL del perfil de la bodega.
 */
const socialColumn: { title: string; links: FooterLink[] } = {
    title: 'SÍGUENOS',
    links: [
        { label: 'instagram', href: 'https://www.instagram.com/', external: true },
        { label: 'x / twitter', href: 'https://x.com/', external: true },
        { label: 'facebook', href: 'https://www.facebook.com/', external: true },
    ],
};

/** Iconos de redes del footer de escritorio. TODO: URL del perfil de la bodega en cada red. */
const socialIcons = [
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: '/images/brand/instagram.svg' },
    { label: 'X', href: 'https://x.com/', icon: '/images/brand/x.svg' },
    { label: 'Facebook', href: 'https://www.facebook.com/', icon: '/images/brand/facebook.svg' },
];

/** Enlaces legales. Privacidad, cookies y condiciones ya son rutas públicas. */
const legalLinks: FooterLink[] = [
    // TODO: ruta pendiente (slug ficticio)
    { label: 'Aviso legal', href: '/aviso-legal' },
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
            {links.map(({ label, href, external }) => (
                <Link
                    key={label}
                    href={href}
                    className="w-fit opacity-60 hover:opacity-100"
                    {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                >
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
                                        <a
                                            href={href}
                                            aria-label={label}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
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
