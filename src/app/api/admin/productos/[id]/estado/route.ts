import { catalogRoute, parseCatalogId, readJsonBody, respond } from '@/lib/admin/catalog-api';
import { productWriteStatus } from '@/lib/admin/products';
import { setProductBlocked } from '@/lib/db/admin-products-write';
import { getAffectedOrders } from '@/lib/db/admin-sales-impact';
import { productSalesSchema } from '@/lib/validations/admin-products';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Bloquea las ventas de un producto o lo pone a la venta (interruptor de Estado, RF4). Editor o
 * Administrador; se comprueba aquí además de en el middleware (RNF3). El cambio y su asiento van
 * en la misma transacción.
 *
 * Cuerpo: `{ isBlocked }`. Respuestas: 200 `{ changed }`; 400 id o cuerpo no válidos; 401 sin
 * sesión; 403 sin el rol; 404 no existe; 500 error interno.
 */
export const PATCH = catalogRoute<{ id: string }>(async ({ request, params, user }) => {
    const id = parseCatalogId(params.id);
    if (id === null) return respond({ message: 'El identificador del producto no es válido' }, 400);
    const body = await readJsonBody(request);
    if (body === undefined)
        return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
    const parsed = productSalesSchema.safeParse(body);
    if (!parsed.success) return respond({ message: 'Indica si se bloquean las ventas' }, 400);
    const result = await setProductBlocked(user, id, parsed.data.isBlocked);
    if (!result.ok) return respond({ message: result.message }, productWriteStatus(result.code));
    return respond(result.value);
});

/**
 * Pedidos en curso con este producto: los que avisa el modal de bloqueo. Solo lectura; no cambia ningún
 * pedido. Editor o Administrador. Se comprueba aquí además de en el middleware (RNF3).
 *
 * Respuestas: 200 `{ orders: [{ id, number, status }] }`; 400 id no válido; 401; 403 sin el rol; 500.
 */
export const GET = catalogRoute<{ id: string }>(async ({ params }) => {
    const id = parseCatalogId(params.id);
    if (id === null) return respond({ message: 'El identificador del producto no es válido' }, 400);
    return respond({ orders: await getAffectedOrders('product', id) });
});
