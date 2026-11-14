'use client';

import Image, { type ImageProps } from 'next/image';
import { cloudinaryLoader } from '@/lib/cloudinary';

export type CloudinaryImageProps = Omit<ImageProps, 'loader' | 'src'> & {
    /** `public_id` de la imagen en Cloudinary, con su carpeta (`pago-jotron/productos/payoya-negra-2022`). */
    src: string;
};

/**
 * `next/image` para imágenes alojadas en Cloudinary. Le pasa `cloudinaryLoader`, así Cloudinary
 * sirve cada tamaño y Next no las optimiza. Es un componente de cliente porque una función no puede
 * pasarse como prop desde un Server Component. El resto de props (`alt`, `fill`, `sizes`,
 * `priority`…) van tal cual a `next/image`.
 *
 * Solo para imágenes subidas a Cloudinary: las de `public/` siguen usando `next/image` a secas.
 *
 * @example
 * <CardMedia>
 *     <CloudinaryImage
 *         src="pago-jotron/productos/payoya-negra-2022"
 *         alt="Botella de Payoya Negra 2022"
 *         fill
 *         sizes="(min-width: 1024px) 33vw, 100vw"
 *         className="object-contain"
 *     />
 * </CardMedia>
 */
export function CloudinaryImage({ alt, ...props }: CloudinaryImageProps) {
    return <Image alt={alt} {...props} loader={cloudinaryLoader} />;
}
