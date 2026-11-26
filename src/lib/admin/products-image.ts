/**
 * Subida firmada de imágenes de producto a Cloudinary (CU9). El navegador sube el archivo
 * directamente a Cloudinary con una firma que solo el servidor puede generar (porque lleva el
 * `API_SECRET`); así el secreto no sale del servidor y el archivo no pasa por él.
 */
import { createHash } from 'node:crypto';
import {
    PRODUCT_IMAGE_FOLDER,
    PRODUCT_IMAGE_FORMATS,
    PRODUCT_IMAGE_MAX_BYTES,
} from '@/lib/admin/products';

export { PRODUCT_IMAGE_FORMATS, PRODUCT_IMAGE_MAX_BYTES };

/**
 * Firma de una subida de Cloudinary: SHA-1 de los parámetros ordenados por nombre y unidos como
 * `a=1&b=2`, seguidos del secreto (sin `&`). No se firman `file`, `api_key` ni `resource_type`.
 *
 * @param params - Parámetros que se enviarán (y que quedan firmados).
 * @param apiSecret - `CLOUDINARY_API_SECRET`.
 * @returns La firma en hexadecimal.
 *
 * @example
 * signCloudinaryParams({ timestamp: 1315060510, public_id: 'sample' }, 'abcd');
 */
export function signCloudinaryParams(
    params: Record<string, string | number>,
    apiSecret: string,
): string {
    const toSign = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');
    return createHash('sha1')
        .update(toSign + apiSecret)
        .digest('hex');
}

/** Lo que el formulario necesita para subir una imagen directamente a Cloudinary. */
export interface ProductImageSignature {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    allowedFormats: string;
    signature: string;
}

/**
 * Datos firmados para una subida a la carpeta de productos.
 *
 * @param env - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.
 * @param now - Reloj en milisegundos (Cloudinary rechaza firmas de hace más de una hora).
 * @returns La firma, o `null` si falta alguna variable de entorno.
 */
export function productImageSignature(
    env: { cloudName?: string; apiKey?: string; apiSecret?: string },
    now: number = Date.now(),
): ProductImageSignature | null {
    const { cloudName, apiKey, apiSecret } = env;
    if (!cloudName || !apiKey || !apiSecret) return null;
    const timestamp = Math.floor(now / 1000);
    const signed = {
        allowed_formats: PRODUCT_IMAGE_FORMATS,
        folder: PRODUCT_IMAGE_FOLDER,
        timestamp,
    };
    return {
        cloudName,
        apiKey,
        timestamp,
        folder: PRODUCT_IMAGE_FOLDER,
        allowedFormats: PRODUCT_IMAGE_FORMATS,
        signature: signCloudinaryParams(signed, apiSecret),
    };
}
