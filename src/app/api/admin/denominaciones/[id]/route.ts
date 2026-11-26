import { catalogRoute, parseCatalogId, readJsonBody, respond } from '@/lib/admin/catalog-api';
import { deleteDenomination, updateDenomination } from '@/lib/admin/denomination-service';
import { denominationFormSchema } from '@/lib/validations/admin-denominations';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

const BAD_ID = 'El identificador de la denominación no es válido';

/**
 * Edición de los datos de una denominación de origen (CU9). Editor o Administrador (RNF3). Cuerpo: los campos de
 * `denominationFormSchema`; NO cambia el estado de venta (eso es `/ventas`). Un cambio queda en
 * `audit_logs` en la misma transacción; si no cambia nada, no.
 *
 * Respuestas: 200 `{ changed }`; 400 id o cuerpo no válidos; 401; 403; 404 no existe; 409 el nombre
 * ya existe; 500.
 */
export const PATCH = catalogRoute<{ id: string }>(async ({ request, params, user }) => {
    const id = parseCatalogId(params.id);
    if (id === null) return respond({ message: BAD_ID }, 400);
    const body = await readJsonBody(request);
    if (body === undefined)
        return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
    const parsed = denominationFormSchema.safeParse(body);
    if (!parsed.success)
        return respond(
            { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
            400,
        );
    const result = await updateDenomination(user, id, parsed.data);
    if (!result.ok)
        return respond({ message: result.message }, result.code === 'not_found' ? 404 : 409);
    return respond({ changed: result.changed });
});

/**
 * Borrado de una denominación de origen SIN productos (CU9). Editor o Administrador (RNF3). Con productos no se
 * borra: la baja es bloquear sus ventas.
 *
 * Respuestas: 200 `{ deleted: true }`; 400 id no válido; 401; 403; 404 no existe; 409 tiene
 * productos; 500.
 */
export const DELETE = catalogRoute<{ id: string }>(async ({ params, user }) => {
    const id = parseCatalogId(params.id);
    if (id === null) return respond({ message: BAD_ID }, 400);
    const result = await deleteDenomination(user, id);
    if (!result.ok)
        return respond({ message: result.message }, result.code === 'not_found' ? 404 : 409);
    return respond({ deleted: true });
});
