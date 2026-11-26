import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { GrapeDetail } from '@/components/admin/grapes/grape-detail';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { parseCatalogId } from '@/lib/admin/catalog-api';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminGrape, getGrapeWines } from '@/lib/db/admin-grapes';

/** Depende de la sesión: nunca se genera ni se guarda de antemano. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Variedad de uva | Pago de Jotrón' };

/**
 * Ficha de una variedad de uva del panel (Figma: grape-variety-detail; CU9). Editor y
 * Administrador (se vuelve a comprobar con el rol de la BD). Un id que no es válido o no existe da
 * la 404 del panel. Un fallo de la BD llega a `src/app/admin/error.tsx`.
 */
export default async function AdminGrapeDetailPage({ params }: { params: { id: string } }) {
    const user = await getSessionUser();
    if (user === null || !(CATALOG_ROLES as readonly string[]).includes(user.role))
        redirect('/acceso-denegado');

    const id = parseCatalogId(params.id);
    if (id === null) notFound();
    const grape = await getAdminGrape(id);
    if (grape === null) notFound();
    const wines = await getGrapeWines(id);
    return <GrapeDetail key={`${grape.name}-${grape.color}`} grape={grape} wines={wines} />;
}
