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
import { SiteHeader } from '@/components/shop/site-header';
import { AccountNav } from './account-nav';
import type { AccountSection } from './account-items';

/** Un nivel de las migas: sin `href` es la página actual. */
export interface AccountCrumb {
    label: string;
    href?: string;
}

interface AccountShellProps {
    /** Sección del menú que se marca como actual. */
    current: AccountSection;
    /** Migas, de `Mi cuenta` a la página actual; la última no lleva `href`. */
    breadcrumb: AccountCrumb[];
    children: React.ReactNode;
}

/**
 * Marco del área de cliente (Figma: account-*): la cabecera de la tienda (sin hero, como en la ficha
 * de producto), migas arriba, menú de la cuenta a la izquierda
 * (280 px) y el contenido a su derecha. Lo comparten `/cuenta/pedidos` y `/pedidos/[id]`. El footer
 * lo pone el layout de la ruta, como en `src/app/checkout/layout.tsx`.
 *
 * En pantallas pequeñas (el diseño solo trae 1920 px) el menú lateral desaparece y sus enlaces van
 * en el drawer de la cabecera, sección "Mi cuenta".
 *
 * @param props.current - Sección actual del menú.
 * @param props.breadcrumb - Niveles de las migas.
 *
 * @example
 * <AccountShell current="pedidos" breadcrumb={[{ label: 'Mi cuenta', href: '/cuenta/pedidos' }, { label: 'Historial de pedidos' }]}>
 *     …
 * </AccountShell>
 */
export function AccountShell({ current, breadcrumb, children }: AccountShellProps) {
    return (
        <>
            <SiteHeader accountCurrent={current} />
            <main className="px-6 py-10 lg:py-20">
                <div className="mx-auto grid w-full max-w-9xl gap-x-12 gap-y-8 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
                    <Breadcrumb className="lg:col-span-2">
                        <BreadcrumbList size="sm" className="gap-gap-2xs text-foreground">
                            {breadcrumb.map(({ label, href }, i) => (
                                <Fragment key={label}>
                                    <BreadcrumbItem className="min-h-6">
                                        {href ? (
                                            <BreadcrumbLink asChild>
                                                <Link href={href}>{label}</Link>
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage className="font-normal">
                                                {label}
                                            </BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {i < breadcrumb.length - 1 && (
                                        <BreadcrumbSeparator>
                                            <Slash className="size-3" />
                                        </BreadcrumbSeparator>
                                    )}
                                </Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <AccountNav current={current} />
                    <div className="flex min-w-0 flex-col gap-gap-xl">{children}</div>
                </div>
            </main>
        </>
    );
}
