import { catalogRoute } from '@/lib/admin/catalog-api';
import { updateShippingType } from '@/lib/admin/shipping-types-service';
import { parseBodyWith, parseIdParam, respondResult } from '@/lib/admin/value-routes';
import { shippingTypeSchema } from '@/lib/validations/admin-shipping';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Edita un tipo de envío, también para desactivarlo o reactivarlo con `isBlocked` (CU13). SOLO el
 * Administrador (RNF3). Nunca se borran: los pedidos los referencian. No deja desactivar el último
 * tipo activo. Cambio y auditoría en la misma transacción.
 *
 * Respuestas: 200 `{ changed }`; 400 id o cuerpo no válidos; 401 sin sesión; 403 sin el rol; 404 no
 * existe; 409 el nombre ya existe o es el último activo; 500 error interno.
 */
export const PATCH = catalogRoute<{ id: string }>(
    async ({ request, params, user }) => {
        const parsedId = parseIdParam(params.id, 'del tipo de envío');
        if ('response' in parsedId) return parsedId.response;
        const body = await parseBodyWith(request, shippingTypeSchema);
        if ('response' in body) return body.response;
        return respondResult(await updateShippingType(user, parsedId.id, body.data));
    },
    ['Administrador'],
);
