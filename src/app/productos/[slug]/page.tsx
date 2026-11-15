import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductHeader } from '@/components/shop/product-header';
import { ProductImage } from '@/components/shop/product-image';
import { ProductPurchase } from '@/components/shop/product-purchase';
import { ProductRelated } from '@/components/shop/product-related';
import { ProductShippingInfo } from '@/components/shop/product-shipping-info';
import { ProductSpecSheet } from '@/components/shop/product-spec-sheet';
import { ProductTastingNotes } from '@/components/shop/product-tasting-notes';
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
 * Ficha de producto (RF4): foto, cabecera, compra, envío y devoluciones, notas de cata y ficha
 * técnica. Es un Server Component; lo único con estado es `ProductPurchase`.
 *
 * Si el producto no existe o no se puede mostrar (bloqueado él, su bodega, su D.O. o sin
 * presentaciones a la venta), responde con `not-found.tsx`.
 */
export default async function ProductPage({ params }: ProductPageProps) {
    const product = await loadProduct(params.slug);
    if (!product || !isProductPageAvailable(product)) notFound();

    return (
        <main className="mx-auto flex w-full max-w-9xl flex-col gap-16 px-6 py-16 lg:gap-40 lg:py-40">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 lg:flex-row lg:items-start">
                <div className="min-w-0 lg:flex-1">
                    <ProductImage src={product.image} alt={`Botella de ${product.name}`} />
                </div>
                <div className="flex min-w-0 flex-col gap-12 lg:flex-1">
                    <ProductHeader product={product} />
                    <ProductPurchase variants={product.variants}>
                        {product.description && <p className="text-base">{product.description}</p>}
                    </ProductPurchase>
                    <ProductShippingInfo />
                </div>
            </div>

            {/* Sin notas de cata ni ficha técnica (los dos vacíos), la sección no ocupa sitio. */}
            <div className="mx-auto hidden w-full max-w-6xl flex-col gap-16 has-[>:not(:empty)]:flex lg:flex-row lg:items-start">
                <div className="min-w-0 empty:hidden lg:flex-1">
                    <ProductTastingNotes product={product} />
                </div>
                <div className="min-w-0 empty:hidden lg:flex-1">
                    <ProductSpecSheet product={product} />
                </div>
            </div>

            <ProductRelated />
        </main>
    );
}
