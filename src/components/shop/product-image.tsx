import { CloudinaryImage } from '@/components/ui/cloudinary-image';

interface ProductImageProps {
    /** `public_id` de la foto en Cloudinary (`products.image`). Sin él, solo se pinta el fondo. */
    src: string | null;
    /** Texto alternativo de la foto. */
    alt: string;
}

/**
 * Foto principal de la ficha sobre un fondo `muted`. En escritorio ocupa 720 px de alto con la
 * botella de 400 × 600 centrada; en móvil, con 72 px de margen lateral y 40 px arriba y abajo,
 * la botella mantiene la proporción 2:3. Es la imagen que más pesa de la página (LCP), por eso
 * lleva `priority`.
 *
 * @example
 * <ProductImage src={product.image} alt={product.name} />
 */
export function ProductImage({ src, alt }: ProductImageProps) {
    return (
        <div className="flex w-full items-center justify-center rounded-sm bg-muted px-18 py-10 lg:h-180 lg:px-0 lg:py-0">
            <div className="relative aspect-[2/3] min-w-0 flex-1 lg:w-100 lg:flex-none">
                {src && (
                    <CloudinaryImage
                        src={src}
                        alt={alt}
                        fill
                        priority
                        sizes="(min-width: 1024px) 400px, 60vw"
                        className="object-contain"
                    />
                )}
            </div>
        </div>
    );
}
