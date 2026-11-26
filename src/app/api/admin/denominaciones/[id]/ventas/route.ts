import { catalogRoute, parseCatalogId, readJsonBody, respond } from '@/lib/admin/catalog-api';
import { setDenominationSalesBlocked } from '@/lib/admin/denomination-service';
import { getAffectedOrders } from '@/lib/db/admin-sales-impact';
import { denominationBlockSchema } from '@/lib/validations/admin-denominations';

// Depende de la sesión de cada petición: nunca se genera ni se guarda de antemano.
export const dynamic = 'force-dynamic';

/**
 * Bloquea o pone a la venta una denominación de origen (`is_blocked`; CU9, RF4). SOLO el Administrador, comprobado
 * aquí en el servidor (RNF3): un editor recibe 403. Cuerpo: `{ isBlocked }`. Queda en `audit_logs`
 * en la misma transacción. Los pedidos ya hechos no se tocan.
 *
 * Respuestas: 200 `{ changed }`; 400 id o cuerpo no válidos; 401; 403 sin el rol; 404 no existe; 500.
 */
export const PATCH = catalogRoute<{ id: string }>(
    async ({ request, params, user }) => {
        const id = parseCatalogId(params.id);
        if (id === null)
            return respond({ message: 'El identificador de la denominación no es válido' }, 400);
        const body = await readJsonBody(request);
        if (body === undefined)
            return respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400);
        const parsed = denominationBlockSchema.safeParse(body);
        if (!parsed.success)
            return respond(
                { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
                400,
            );
        const result = await setDenominationSalesBlocked(user, id, parsed.data.isBlocked);
        if (!result.ok) return respond({ message: result.message }, 404);
        return respond({ changed: result.changed });
    },
    ['Administrador'],
);

/**
 * Pedidos en curso con productos de la denominación: los que avisa el modal de bloqueo. Solo lectura; no cambia ningún
 * pedido. SOLO el Administrador. Se comprueba aquí además de en el middleware (RNF3).
 *
 * Respuestas: 200 `{ orders: [{ id, number, status }] }`; 400 id no válido; 401; 403 sin el rol; 500.
 */
export const GET = catalogRoute<{ id: string }>(
    async ({ params }) => {
        const id = parseCatalogId(params.id);
        if (id === null)
            return respond({ message: 'El identificador de la denominación no es válido' }, 400);
        return respond({ orders: await getAffectedOrders('denomination', id) });
    },
    ['Administrador'],
);
