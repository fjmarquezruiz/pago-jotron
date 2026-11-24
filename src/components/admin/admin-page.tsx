import { Fragment } from 'react';
import Link from 'next/link';
import { Slash } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/** Un nivel de las migas: sin `href` es la página actual. */
export interface AdminCrumb {
    label: string;
    href?: string;
}

interface AdminPageProps {
    /** Migas tras «Pago de Jotrón» (que se añade solo); la última no lleva `href`. */
    breadcrumb: AdminCrumb[];
    /** Título de la página (Figma: PageHeader). */
    title: string;
    /** Frase bajo el título. */
    description?: string;
    /** Insignias junto al título (Figma: user-detail, el rol). */
    titleBadges?: React.ReactNode;
    /** Botones a la derecha del título. */
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

/**
 * Cabecera de cada página del panel (Figma: breadcrumbs + PageHeader): migas, título de 24 px y
 * descripción de 12 px, y debajo el contenido. Devuelve un fragmento para que migas, cabecera y
 * contenido sean hijos directos del contenedor del `AdminShell` y compartan su separación de 32 px.
 *
 * @example
 * <AdminPage breadcrumb={[{ label: 'Catálogo' }]} title="Catálogo" description="…">…</AdminPage>
 */
export function AdminPage({
    breadcrumb,
    title,
    description,
    titleBadges,
    actions,
    children,
}: AdminPageProps) {
    const crumbs: AdminCrumb[] = [{ label: 'Pago de Jotrón', href: '/' }, ...breadcrumb];
    return (
        <>
            <Breadcrumb>
                <BreadcrumbList size="sm" className="gap-gap-2xs text-foreground">
                    {crumbs.map(({ label, href }, i) => (
                        <Fragment key={label}>
                            <BreadcrumbItem className="min-h-6">
                                {href ? (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>{label}</Link>
                                    </BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage className="font-normal">{label}</BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                            {i < crumbs.length - 1 && (
                                <BreadcrumbSeparator>
                                    <Slash className="size-3" />
                                </BreadcrumbSeparator>
                            )}
                        </Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col gap-1.5">
                <div className="flex min-h-control-md items-center gap-gap-md">
                    {titleBadges ? (
                        <div className="flex min-w-0 flex-1 items-center gap-gap-sm">
                            <h1 className="min-w-0 text-2xl font-medium">{title}</h1>
                            {titleBadges}
                        </div>
                    ) : (
                        <h1 className="min-w-0 flex-1 text-2xl font-medium">{title}</h1>
                    )}
                    {actions && (
                        <div className="flex shrink-0 items-center gap-gap-sm">{actions}</div>
                    )}
                </div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            {children}
        </>
    );
}
