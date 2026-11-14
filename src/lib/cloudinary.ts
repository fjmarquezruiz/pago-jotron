import type { ImageLoaderProps } from 'next/image';

/**
 * Loader de `next/image` para imágenes de Cloudinary. Monta la URL de entrega con formato
 * automático (`f_auto`), el ancho que pide Next y `c_limit`, que reduce pero nunca agranda una
 * imagen más pequeña que ese ancho. Sin `quality`, Cloudinary la elige (`q_auto`).
 *
 * Lee `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. Se pasa por la prop `loader` (ver `CloudinaryImage`),
 * no en `next.config`, para no afectar a las imágenes de `public/`.
 *
 * @param props.src - `public_id` de la imagen con su carpeta, por ejemplo `pago-jotron/productos/payoya-negra-2022`.
 * @param props.width - Ancho en píxeles que pide `next/image`.
 * @param props.quality - Calidad de 1 a 100; si falta, `q_auto`.
 * @returns URL de `res.cloudinary.com` lista para el `src` o el `srcset`.
 *
 * @example
 * cloudinaryLoader({ src: 'pago-jotron/productos/payoya-negra-2022', width: 640 });
 * // https://res.cloudinary.com/<cloud>/image/upload/f_auto,c_limit,w_640,q_auto/pago-jotron/productos/payoya-negra-2022
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,c_limit,w_${width},q_${quality ?? 'auto'}/${src}`;
}
