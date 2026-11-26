import { catalogRoute } from '@/lib/admin/catalog-api';
import { deleteTypology, updateTypologyValues } from '@/lib/admin/typologies-service';
import { parseBodyWith, parseIdParam, respondResult } from '@/lib/admin/value-routes';
import { typologySchema } from '@/lib/validations/admin-typologies';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Edita una tipología (CU9). Solo Editor y Administrador; cambio y auditoría en la misma transacción.
 *
 * Respuestas: 200 `{ changed }`; 400 id o cuerpo no válidos; 401 sin sesión; 403 sin el rol; 404 no
 * existe; 409 el nombre ya existe; 500 error interno.
 */
export const PATCH = catalogRoute<{ id: string }>(async ({ request, params, user }) => {
    const parsedId = parseIdParam(params.id, 'de la tipología');
    if ('response' in parsedId) return parsedId.response;
    const body = await parseBodyWith(request, typologySchema);
    if ('response' in body) return body.response;
    return respondResult(await updateTypologyValues(user, parsedId.id, body.data));
});

/**
 * Borra una tipología (CU9), solo si ningún producto la usa. Solo Editor y Administrador; el borrado y su
 * asiento van en la misma transacción.
 *
 * Respuestas: 200 `{ deleted }`; 400 id no válido; 401 sin sesión; 403 sin el rol; 404 no existe;
 * 409 está en uso; 500 error interno.
 */
export const DELETE = catalogRoute<{ id: string }>(async ({ params, user }) => {
    const parsedId = parseIdParam(params.id, 'de la tipología');
    if ('response' in parsedId) return parsedId.response;
    return respondResult(await deleteTypology(user, parsedId.id));
});
