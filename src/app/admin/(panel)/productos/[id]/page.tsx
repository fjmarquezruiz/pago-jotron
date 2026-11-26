import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ProductForm } from '@/components/admin/products/product-form';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminProduct, getAdminProductOptions } from '@/lib/db/admin-products';
import { MAX_ID } from '@/lib/validations/ids';

// Depende de la sesión y de los datos del momento: nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Editar producto | Pago de Jotrón' };

/** Id de la URL como entero válido, o `null` (la página responde 404). */
function parseProductId(raw: string): number | null {
    const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
    return Number.isSafeInteger(id) && id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * Edición de un producto (Figma: admin-product-edit; CU9). Editor y administrador; aquí se vuelve
 * a comprobar con el rol de la BD. Un producto que no existe responde 404.
 */
export default async function EditProductPage({ params }: { params: { id: string } }) {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');

    const productId = parseProductId(params.id);
    if (productId === null) notFound();

    const [product, options] = await Promise.all([
        getAdminProduct(productId),
        getAdminProductOptions(),
    ]);
    if (product === null) notFound();

    return <ProductForm options={options} product={product} />;
}
