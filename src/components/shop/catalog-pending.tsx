'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Lo que se espera antes de enseñar que el listado está cargando. Si el servidor responde antes,
 * no se ve nada: atenuar y volver a pintar la rejilla en 50 ms parpadea más que ayuda.
 */
const PENDING_DELAY_MS = 150;

interface CatalogPendingValue {
    /** `true` desde que se pide una página del listado hasta que llega. */
    pending: boolean;
    /** `true` si lleva pendiente más de `PENDING_DELAY_MS`: es cuando se enseña la carga. */
    slow: boolean;
    /** Envuelve una navegación para que cuente como pendiente (`router.push`). */
    start: React.TransitionStartFunction;
}

const CatalogPendingContext = React.createContext<CatalogPendingValue | null>(null);

/** Es `true` solo cuando `value` lleva `delay` ms seguidos siendo `true`. */
function useDelayedFlag(value: boolean, delay: number): boolean {
    const [delayed, setDelayed] = React.useState(false);
    React.useEffect(() => {
        if (!value) {
            setDelayed(false);
            return;
        }
        const timer = setTimeout(() => setDelayed(true), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return delayed;
}

/**
 * Comparte el estado "cargando" del listado entre quien navega (la barra de filtros, el buscador,
 * los enlaces de la paginación) y quien lo enseña (`CatalogResults` y el texto "Mostrando…").
 * Envuelve la sección entera; no pinta nada propio.
 *
 * Usa una transición de React: durante la navegación se sigue viendo el listado anterior, sin
 * vaciarlo, hasta que llega el nuevo.
 *
 * @example
 * <CatalogPendingProvider>
 *     <CatalogFilters … />
 *     <CatalogResults>…</CatalogResults>
 * </CatalogPendingProvider>
 */
export function CatalogPendingProvider({ children }: { children: React.ReactNode }) {
    const [pending, start] = React.useTransition();
    const slow = useDelayedFlag(pending, PENDING_DELAY_MS);
    const value = React.useMemo(() => ({ pending, slow, start }), [pending, slow, start]);
    return (
        <CatalogPendingContext.Provider value={value}>{children}</CatalogPendingContext.Provider>
    );
}

/**
 * El estado "cargando" del listado y la función para navegar dentro de él.
 *
 * @throws {Error} Si se usa fuera de `CatalogPendingProvider`.
 */
export function useCatalogPending(): CatalogPendingValue {
    const value = React.useContext(CatalogPendingContext);
    if (!value) throw new Error('useCatalogPending debe usarse dentro de <CatalogPendingProvider>');
    return value;
}

/**
 * Los resultados del listado (rejilla, paginación o estado vacío). Mientras se carga una página
 * nueva se marcan como ocupados (`aria-busy`) y, pasado un momento, se atenúan: se sigue viendo
 * lo anterior, sin vaciarlo, hasta que llega lo nuevo.
 *
 * @example
 * <CatalogResults><ul>…</ul><CatalogPagination … /></CatalogResults>
 */
export function CatalogResults({ children }: { children: React.ReactNode }) {
    const { pending, slow } = useCatalogPending();
    return (
        <div
            aria-busy={pending}
            className={cn(
                'flex flex-col gap-12 transition-opacity duration-200',
                slow && 'opacity-50',
            )}
        >
            {children}
        </div>
    );
}

type CatalogLinkProps = Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string };

/**
 * Enlace a otra página del listado (paginación, "Borrar todo", "Quitar filtros") que cuenta como
 * carga pendiente. Es un `Link` normal, con su `href` real: se abre en otra pestaña, se copia y
 * funciona sin JavaScript; solo un clic simple se encarga `router.push` dentro de la transición.
 *
 * @example
 * <CatalogLink href="/productos?page=2" scroll={false}>Siguiente</CatalogLink>
 */
export const CatalogLink = React.forwardRef<HTMLAnchorElement, CatalogLinkProps>(
    ({ href, scroll, onClick, ...props }, ref) => {
        const router = useRouter();
        const { start } = useCatalogPending();
        return (
            <Link
                ref={ref}
                href={href}
                scroll={scroll}
                onClick={(event) => {
                    onClick?.(event);
                    const modified =
                        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
                    if (event.defaultPrevented || event.button !== 0 || modified) return;
                    event.preventDefault();
                    start(() => router.push(href, { scroll }));
                }}
                {...props}
            />
        );
    },
);
CatalogLink.displayName = 'CatalogLink';
