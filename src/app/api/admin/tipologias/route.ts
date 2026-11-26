import { catalogRoute } from '@/lib/admin/catalog-api';
import { createTypology } from '@/lib/admin/typologies-service';
import { parseBodyWith, respondResult } from '@/lib/admin/value-routes';
import { typologySchema } from '@/lib/validations/admin-typologies';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Crea una tipología (CU9). Solo Editor y Administrador: se comprueba aquí, en el servidor, además de en el
 * middleware. El cambio y su asiento de `audit_logs` van en la misma transacción.
 *
 * Respuestas: 201 `{ id }`; 400 cuerpo no válido; 401 sin sesión; 403 sin el rol; 409 el nombre ya
 * existe; 500 error interno.
 */
export const POST = catalogRoute(async ({ request, user }) => {
    const body = await parseBodyWith(request, typologySchema);
    if ('response' in body) return body.response;
    return respondResult(await createTypology(user, body.data), 201);
});
