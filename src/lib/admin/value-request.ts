/** Resultado de pedir un cambio a las API de valores asociados (uvas y tipologías). */
export type ValueOutcome =
    | { kind: 'ok' }
    /** 400, 404 o 409 con motivo en español (nombre repetido, valor en uso, ya no existe). */
    | { kind: 'rejected'; status: number; message: string }
    /** Cualquier otro fallo (sin red, sesión caducada, 500). */
    | { kind: 'error' };

/**
 * Pide a una API `/api/admin/...` crear, editar o borrar un valor y interpreta la respuesta. Las
 * reglas (nombre único, valor en uso) las comprueba el servidor; aquí solo se lee su respuesta.
 *
 * @param url - Ruta de la API (`/api/admin/uvas/3`).
 * @param method - `POST`, `PATCH` o `DELETE`.
 * @param body - Cuerpo JSON; sin él en `DELETE`.
 * @param request - `fetch` (inyectable para las pruebas).
 * @returns El resultado, sin lanzar nunca.
 */
export async function valueRequest(
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: unknown,
    request: typeof fetch = fetch,
): Promise<ValueOutcome> {
    try {
        const response = await request(url, {
            method,
            ...(body !== undefined && {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }),
        });
        if (response.ok) return { kind: 'ok' };
        const data = (await response.json().catch(() => null)) as { message?: unknown } | null;
        if ([400, 404, 409].includes(response.status) && typeof data?.message === 'string')
            return { kind: 'rejected', status: response.status, message: data.message };
        return { kind: 'error' };
    } catch {
        return { kind: 'error' };
    }
}
