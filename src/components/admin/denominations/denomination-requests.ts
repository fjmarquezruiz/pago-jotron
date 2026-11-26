/** Resultado de una petición a `/api/admin/denominaciones`. */
export type DenominationRequestOutcome =
    | { kind: 'ok'; body: Record<string, unknown> }
    /** Rechazo con motivo: 400 datos no válidos (con `errors` por campo), 404 ya no existe, 409 nombre repetido o denominación con productos. */
    | { kind: 'rejected'; status: number; message: string; errors?: Record<string, string[]> }
    /** Cualquier otro fallo (sin red, sesión caducada, 500). */
    | { kind: 'error' };

/**
 * Hace una petición JSON a la API de denominaciones e interpreta la respuesta. Las reglas las comprueba
 * el servidor; aquí solo se separa lo que se puede explicar a la persona de lo que no.
 *
 * @param url - Ruta de la API (`/api/admin/denominaciones/3`).
 * @param method - Método HTTP.
 * @param body - Cuerpo JSON, si lleva.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El resultado, sin lanzar nunca.
 *
 * @example
 * const outcome = await denominationRequest('/api/admin/denominaciones/3/ventas', 'PATCH', { isBlocked: true });
 */
export async function denominationRequest(
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: unknown,
    request: typeof fetch = fetch,
): Promise<DenominationRequestOutcome> {
    try {
        const response = await request(url, {
            method,
            ...(body !== undefined && {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }),
        });
        const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (response.ok) return { kind: 'ok', body: data ?? {} };
        if ([400, 404, 409].includes(response.status) && typeof data?.message === 'string')
            return {
                kind: 'rejected',
                status: response.status,
                message: data.message,
                errors: (data.errors as Record<string, string[]> | undefined) ?? undefined,
            };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}
