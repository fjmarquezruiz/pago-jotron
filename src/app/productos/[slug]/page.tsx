import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cloudinaryLoader } from '@/lib/cloudinary';
import { isProductPageAvailable } from '@/lib/catalog/visibility';
import { getProductBySlug } from '@/lib/db/queries';

/**
 * La ficha depende del stock y de los bloqueos (producto, bodega, D.O. y presentaciones), que
 * cambian desde el panel de administración: no se cachea.
 */
export const dynamic = 'force-dynamic';

interface ProductPageProps {
    params: { slug: string };
}

/** Una sola consulta por petición: `generateMetadata` y la página comparten el resultado. */
const loadProduct = cache(getProductBySlug);

/**
 * Título, descripción y miniatura de la ficha. Un producto que no se puede mostrar no revela
 * su nombre: lleva el título genérico, igual que `not-found.tsx`.
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const product = await loadProduct(params.slug);
    if (!product || !isProductPageAvailable(product)) {
        return { title: 'Producto no disponible | Pago de Jotrón' };
    }

    const title = `${product.name} | Pago de Jotrón`;
    const description = product.description ?? undefined;
    const image = product.image ? cloudinaryLoader({ src: product.image, width: 1200 }) : null;

    return {
        title,
        description,
        openGraph: { title, description, images: image ? [{ url: image }] : undefined },
    };
}

/**
 * Ficha de producto (RF4). Provisional: vuelca el producto en crudo para comprobar la consulta
 * en local y en la vista previa de Vercel contra TiDB. La interfaz llega después.
 *
 * Si el producto no existe o no se puede mostrar (bloqueado él, su bodega, su D.O. o sin
 * presentaciones a la venta), responde con `not-found.tsx`.
 */
export default async function ProductPage({ params }: ProductPageProps) {
    const product = await loadProduct(params.slug);
    if (!product || !isProductPageAvailable(product)) notFound();

    return (
        <main className="container-main py-16">
            <pre className="overflow-x-auto text-xs">{JSON.stringify(product, null, 2)}</pre>
        </main>
    );
}
