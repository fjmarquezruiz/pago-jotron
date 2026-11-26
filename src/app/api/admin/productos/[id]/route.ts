import { catalogRoute, parseCatalogId, readJsonBody, respond } from '@/lib/admin/catalog-api';
import { productWriteStatus } from '@/lib/admin/products';
import { updateProduct } from '@/lib/db/admin-products-write';
import { productFormSchema } from '@/lib/validations/admin-products';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Edita un producto, sus uvas y sus presentaciones (CU9). Editor o Administrador; se comprueba
 * aquí además de en el middleware (RNF3). El cambio y su asiento de `audit_logs` van en la misma
 * transacción.
 *
 * Las existencias llevan control optimista: cada presentación existente manda `loadedStock` (lo
 * leído) y su `stock` nuevo; solo se escribe si cambió y la fila sigue con lo leído. Si no, 409
 * y no se guarda nada.
 *
 * Cuerpo: `productFormSchema`. Respuestas: 200 `{ changed }`; 400 id, cuerpo o referencias no
 * válidos; 401 sin sesión; 403 sin el rol; 404 no existe; 409 stock cambiado entre tanto o
 * presentación repetida; 500 error interno.
 */
export const PATCH = catalogRoute<{ id: string }>(async ({ request, params, user }) => {
    const id = parseCatalogId(params.id);
    if (id === null) return respond({ message: 'El identificador del producto no es válido' }, 400);
    const body = await readJsonBody(request);
    if (body === undefined)
        return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
    const parsed = productFormSchema.safeParse(body);
    if (!parsed.success)
        return respond(
            { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
            400,
        );
    const result = await updateProduct(user, id, parsed.data);
    if (!result.ok) return respond({ message: result.message }, productWriteStatus(result.code));
    return respond(result.value);
});
