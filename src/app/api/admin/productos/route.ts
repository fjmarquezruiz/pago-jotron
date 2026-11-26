import { catalogRoute, readJsonBody, respond } from '@/lib/admin/catalog-api';
import { productWriteStatus } from '@/lib/admin/products';
import { createProduct } from '@/lib/db/admin-products-write';
import { productFormSchema } from '@/lib/validations/admin-products';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Crea un producto con sus uvas y presentaciones (CU9). Editor o Administrador; se comprueba aquí,
 * en el servidor, además de en el middleware (RNF3). El slug sale del nombre y la añada. El alta y
 * su asiento de `audit_logs` van en la misma transacción.
 *
 * Cuerpo: `productFormSchema`. Respuestas: 201 `{ id, slug }`; 400 cuerpo o referencias no válidas;
 * 401 sin sesión; 403 sin el rol; 409 ya hay un producto con ese nombre y añada o una presentación
 * repetida; 500 error interno.
 */
export const POST = catalogRoute(async ({ request, user }) => {
    const body = await readJsonBody(request);
    if (body === undefined)
        return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
    const parsed = productFormSchema.safeParse(body);
    if (!parsed.success)
        return respond(
            { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
            400,
        );
    const result = await createProduct(user, parsed.data);
    if (!result.ok) return respond({ message: result.message }, productWriteStatus(result.code));
    return respond(result.value, 201);
});
