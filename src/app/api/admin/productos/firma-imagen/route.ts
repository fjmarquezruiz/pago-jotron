import { catalogRoute, respond } from '@/lib/admin/catalog-api';
import { productImageSignature } from '@/lib/admin/products-image';

// Depende de la sesión y del reloj de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Firma una subida de imagen de producto a Cloudinary (CU9). Editor o Administrador; se comprueba
 * aquí además de en el middleware (RNF3): sin la firma, nadie puede subir a la carpeta de
 * productos. El archivo no pasa por el servidor, que solo entrega los datos firmados.
 *
 * Respuestas: 200 con la firma (`cloudName`, `apiKey`, `timestamp`, `folder`, `allowedFormats`,
 * `signature`); 401 sin sesión; 403 sin el rol; 503 si faltan las variables `CLOUDINARY_*`; 500
 * error interno.
 */
export const POST = catalogRoute(async () => {
    const signature = productImageSignature({
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    });
    if (signature === null)
        return respond({ message: 'La subida de imágenes no está configurada' }, 503);
    return respond(signature);
});
