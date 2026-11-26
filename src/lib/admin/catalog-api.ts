/**
 * Utilidades de servidor para las rutas `/api/admin/...` del catálogo (CU9): comprobación de rol,
 * lectura del cuerpo, identificadores, respuestas JSON sin caché y escritura en `audit_logs` en la
 * misma transacción que el cambio.
 */
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { requireRole, type AuthorizedUser } from '@/lib/auth/require-role';
import { insertAuditLogQuery } from '@/lib/db/queries';
import { CATALOG_ROLES, catalogAuditEntry, type CatalogAuditInput } from '@/lib/admin/catalog';
import { MAX_ID } from '@/lib/validations/ids';

/** Transacción de la BD, la que reciben los servicios de escritura. */
export type CatalogTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Respuesta JSON que ningún navegador ni intermediario guarda.
 *
 * @param body - Cuerpo, serializable.
 * @param status - Código HTTP; 200 por defecto.
 */
export function respond(body: unknown, status = 200): NextResponse {
    return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Convierte el segmento `[id]` de la ruta en un identificador válido.
 *
 * @param raw - Texto de la URL.
 * @returns El entero entre 1 y `MAX_ID`, o `null` si no lo es.
 */
export function parseCatalogId(raw: string): number | null {
    if (!/^\d+$/.test(raw)) return null;
    const id = Number(raw);
    return Number.isSafeInteger(id) && id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * Lee el cuerpo JSON de la petición.
 *
 * @param request - Petición entrante.
 * @returns El cuerpo, o `undefined` si no es JSON válido (la ruta responde 400).
 */
export async function readJsonBody(request: Request): Promise<unknown> {
    return request.json().catch(() => undefined);
}

/** Lo que recibe el manejador de una ruta de catálogo ya autorizada. */
export interface CatalogRouteContext<P> {
    request: Request;
    params: P;
    /** Cuenta de la sesión (rol Editor o Administrador, leído de la BD). */
    user: AuthorizedUser;
}

/**
 * Envuelve el manejador de una ruta del catálogo: exige Editor o Administrador (RNF3, el
 * middleware no basta) y convierte cualquier error inesperado en un 500 sin filtrar detalles.
 *
 * Un bloqueo de bodega o de D.O. es solo del administrador: esa ruta debe pasar `roles` con solo
 * `['Administrador']`.
 *
 * @param handler - Lógica de la ruta; devuelve su respuesta.
 * @param roles - Roles permitidos; por defecto `CATALOG_ROLES`.
 * @returns La función `(request, { params })` que Next espera de `GET`, `POST`, `PATCH`…
 *
 * @example
 * export const PATCH = catalogRoute<{ id: string }>(async ({ request, params, user }) => {
 *     const id = parseCatalogId(params.id);
 *     if (id === null) return respond({ message: 'El identificador no es válido' }, 400);
 *     return respond(await saveWinery(user, id, await readJsonBody(request)));
 * });
 */
export function catalogRoute<P = Record<string, never>>(
    handler: (context: CatalogRouteContext<P>) => Promise<NextResponse>,
    roles: readonly AuthorizedUser['role'][] = CATALOG_ROLES,
) {
    return async (request: Request, { params }: { params: P }): Promise<NextResponse> => {
        try {
            const auth = await requireRole(roles);
            if ('response' in auth) return auth.response;
            return await handler({ request, params, user: auth.user });
        } catch (error) {
            console.error(error);
            return respond({ message: 'Error interno del servidor' }, 500);
        }
    };
}

/**
 * Hace un cambio del catálogo y lo anota en `audit_logs` en la MISMA transacción: si falla uno,
 * no queda el otro. El trabajo decide qué asiento dejar; si devuelve `audit: null` (no cambió
 * nada) no se anota nada.
 *
 * @param work - Recibe la transacción; devuelve el resultado y los datos del asiento.
 * @returns El resultado de `work`.
 * @throws Cualquier error de la BD o de `work`; la transacción se deshace entera.
 */
export async function auditedCatalogChange<T>(
    work: (tx: CatalogTx) => Promise<{ result: T; audit: CatalogAuditInput | null }>,
): Promise<T> {
    return db.transaction(async (tx) => {
        const { result, audit } = await work(tx);
        if (audit !== null) await insertAuditLogQuery(tx, catalogAuditEntry(audit));
        return result;
    });
}
