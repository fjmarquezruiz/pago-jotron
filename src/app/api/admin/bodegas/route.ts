import { catalogRoute, readJsonBody, respond } from '@/lib/admin/catalog-api';
import { createWinery } from '@/lib/admin/winery-service';
import { wineryFormSchema } from '@/lib/validations/admin-wineries';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Alta de una bodega (CU9). Editor o Administrador, comprobado aquí en el servidor (RNF3). Cuerpo:
 * los campos de `wineryFormSchema`. La bodega nace a la venta y el alta queda en `audit_logs` en la
 * misma transacción.
 *
 * Respuestas: 201 `{ id }`; 400 cuerpo no válido; 401 sin sesión; 403 sin el rol; 409 el nombre ya
 * existe; 500 error interno.
 */
export const POST = catalogRoute(async ({ request, user }) => {
    const body = await readJsonBody(request);
    if (body === undefined)
        return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
    const parsed = wineryFormSchema.safeParse(body);
    if (!parsed.success)
        return respond(
            { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
            400,
        );
    const result = await createWinery(user, parsed.data);
    if (!result.ok) return respond({ message: result.message }, 409);
    return respond({ id: result.id }, 201);
});
