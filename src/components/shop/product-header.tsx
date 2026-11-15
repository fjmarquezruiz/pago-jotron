import Link from 'next/link';
import { Slash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { typologyTone } from '@/lib/catalog/typology-tone';
import type { ProductDetail } from '@/lib/db/queries';

interface ProductHeaderProps {
    /** Producto cargado con `getProductBySlug`. */
    product: ProductDetail;
}

/**
 * Cabecera de la ficha: ruta de navegación, nombre del producto, su D.O. y las etiquetas de
 * tipología y añada. La descripción y el precio van en `ProductPurchase`.
 *
 * Tamaños del diseño: ruta de 12 px y título de 72 px en escritorio; ruta de 14 px y título de
 * 48 px en móvil. La añada solo se pinta si el producto la tiene (las pasas no).
 *
 * @example
 * <ProductHeader product={product} />
 */
export function ProductHeader({ product }: ProductHeaderProps) {
    return (
        <div className="flex flex-col gap-4">
            <Breadcrumb>
                <BreadcrumbList size="md" className="gap-gap-2xs text-foreground lg:text-xs">
                    <BreadcrumbItem className="min-h-6">
                        <BreadcrumbLink asChild className="hover:no-underline">
                            <Link href="/productos">La tienda</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="ml-gap-2xs flex items-center lg:ml-0">
                        <Slash aria-hidden="true" className="size-3.5 lg:size-3" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem className="min-h-6">
                        <BreadcrumbPage className="font-normal">{product.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <h1 className="font-display text-5xl leading-none font-normal lg:text-7xl">
                {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-2xl text-muted-foreground">{product.guaranteeOfOrigin.name}</p>
                <Badge tone={typologyTone(product.typology.name)}>{product.typology.name}</Badge>
                {product.vintage !== null && <Badge>{product.vintage}</Badge>}
            </div>
        </div>
    );
}
