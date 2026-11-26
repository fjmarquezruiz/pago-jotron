import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminErrorState } from '@/components/admin/admin-states';
import { ProductForm } from '@/components/admin/products/product-form';
import { CATALOG_ROLES } from '@/lib/admin/catalog';
import { ADMIN_PRODUCTS_PATH } from '@/lib/admin/products';
import { getSessionUser } from '@/lib/auth/session';
import { getAdminProductOptions, type AdminProductOptions } from '@/lib/db/admin-products';

// Depende de la sesión y de los datos del momento: nunca se genera de antemano.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Nuevo producto | Pago de Jotrón' };

/**
 * Alta de un producto (Figma: catalogue-create - pasas y admin-product-edit; CU9). Editor y
 * administrador; aquí se vuelve a comprobar con el rol de la BD. El mismo formulario sirve para
 * vino y pasas.
 */
export default async function NewProductPage() {
    const user = await getSessionUser();
    if (user === null || !CATALOG_ROLES.some((role) => role === user.role))
        redirect('/acceso-denegado');

    let options: AdminProductOptions;
    try {
        options = await getAdminProductOptions();
    } catch (error) {
        console.error(error);
        return (
            <AdminPage
                breadcrumb={[
                    { label: 'Catálogo', href: ADMIN_PRODUCTS_PATH },
                    { label: 'Nuevo producto' },
                ]}
                title="Añadir un nuevo producto"
            >
                <AdminErrorState title="No se puede cargar el formulario" />
            </AdminPage>
        );
    }
    return <ProductForm options={options} />;
}
