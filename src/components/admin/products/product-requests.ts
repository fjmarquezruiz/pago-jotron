/**
 * Peticiones del formulario y del listado de productos a `/api/admin/productos` y a Cloudinary.
 * Cada una interpreta la respuesta y nunca lanza: devuelve un resultado que la pantalla traduce
 * en un aviso. Reciben `fetch` para poder probarlas.
 */
import type { ProductFormValues } from '@/lib/validations/admin-products';
import type { ProductImageSignature } from '@/lib/admin/products-image';
import { PRODUCT_IMAGE_MAX_BYTES } from '@/lib/admin/products';

/** Resultado de guardar un producto. */
export type SaveProductOutcome =
    | { kind: 'saved'; id?: number; changed?: boolean }
    /** 409 de existencias: cambiaron mientras se editaba; hay que recargar los datos. */
    | { kind: 'stock_conflict'; message: string }
    /** Rechazo con motivo (400, 404, o 409 de slug o presentación repetida). */
    | { kind: 'rejected'; message: string }
    /** Cualquier otro fallo (sin red, sesión caducada, 500). */
    | { kind: 'error' };

interface ResponseBody {
    message?: unknown;
    id?: unknown;
    changed?: unknown;
}

async function readBody(response: Response): Promise<ResponseBody | null> {
    return (await response.json().catch(() => null)) as ResponseBody | null;
}

/**
 * Crea (`productId` ausente) o edita un producto.
 *
 * @param productId - `products.product_id` del producto que se edita; `undefined` para crear.
 * @param values - Datos del formulario, ya validados con `productFormSchema`.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El resultado, sin lanzar nunca.
 */
export async function saveProductRequest(
    productId: number | undefined,
    values: ProductFormValues,
    request: typeof fetch = fetch,
): Promise<SaveProductOutcome> {
    try {
        const response = await request(
            productId === undefined ? '/api/admin/productos' : `/api/admin/productos/${productId}`,
            {
                method: productId === undefined ? 'POST' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            },
        );
        const body = await readBody(response);
        if (response.ok)
            return {
                kind: 'saved',
                ...(typeof body?.id === 'number' && { id: body.id }),
                changed: body?.changed === true,
            };
        const message = typeof body?.message === 'string' ? body.message : null;
        if (response.status === 409 && productId !== undefined && message?.includes('existencias'))
            return { kind: 'stock_conflict', message };
        if ([400, 404, 409].includes(response.status) && message)
            return { kind: 'rejected', message };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}

/** Resultado de bloquear o poner a la venta un producto. */
export type SetProductBlockedOutcome =
    | { kind: 'saved' }
    /** 409: no se puede poner a la venta porque su bodega o su D.O. siguen bloqueadas (o 404). */
    | { kind: 'rejected'; message: string }
    /** Cualquier otro fallo (sin red, sesión caducada, 500). */
    | { kind: 'error' };

/**
 * Bloquea las ventas de un producto o lo pone a la venta (`PATCH /api/admin/productos/[id]/estado`).
 *
 * @param productId - `products.product_id`.
 * @param isBlocked - Estado nuevo.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El resultado, sin lanzar nunca; un rechazo trae el motivo para mostrarlo.
 */
export async function setProductBlockedRequest(
    productId: number,
    isBlocked: boolean,
    request: typeof fetch = fetch,
): Promise<SetProductBlockedOutcome> {
    try {
        const response = await request(`/api/admin/productos/${productId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBlocked }),
        });
        if (response.ok) return { kind: 'saved' };
        const body = await readBody(response);
        if ([404, 409].includes(response.status) && typeof body?.message === 'string')
            return { kind: 'rejected', message: body.message };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}

/** Resultado de subir una imagen. */
export type UploadImageOutcome =
    | { kind: 'uploaded'; publicId: string }
    | { kind: 'rejected'; message: string }
    | { kind: 'error' };

/**
 * Sube una imagen de producto a Cloudinary con una firma del servidor: pide la firma a
 * `/api/admin/productos/firma-imagen` (que vuelve a comprobar el rol) y sube el archivo
 * directamente a Cloudinary.
 *
 * @param file - Imagen elegida; se rechaza si pasa de 5 MB o no es una imagen.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El `public_id` con su carpeta, listo para guardar en `products.image`.
 */
export async function uploadProductImage(
    file: File,
    request: typeof fetch = fetch,
): Promise<UploadImageOutcome> {
    if (!file.type.startsWith('image/'))
        return { kind: 'rejected', message: 'El archivo no es una imagen' };
    if (file.size > PRODUCT_IMAGE_MAX_BYTES)
        return { kind: 'rejected', message: 'La imagen pesa más de 5 MB' };
    try {
        const signed = await request('/api/admin/productos/firma-imagen', { method: 'POST' });
        if (!signed.ok) return { kind: 'error' };
        const signature = (await signed.json()) as ProductImageSignature;
        const form = new FormData();
        form.set('file', file);
        form.set('api_key', signature.apiKey);
        form.set('timestamp', String(signature.timestamp));
        form.set('folder', signature.folder);
        form.set('allowed_formats', signature.allowedFormats);
        form.set('signature', signature.signature);
        const uploaded = await request(
            `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
            { method: 'POST', body: form },
        );
        const body = (await uploaded.json().catch(() => null)) as {
            public_id?: unknown;
            error?: { message?: unknown };
        } | null;
        if (uploaded.ok && typeof body?.public_id === 'string')
            return { kind: 'uploaded', publicId: body.public_id };
        if (uploaded.status === 400)
            return { kind: 'rejected', message: 'Cloudinary no ha aceptado la imagen' };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}
