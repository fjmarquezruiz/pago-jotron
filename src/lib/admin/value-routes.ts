/**
 * Piezas comunes de las rutas `/api/admin/uvas` y `/api/admin/tipologias` (CU9): leer y validar el
 * cuerpo, validar el id de la URL y traducir el resultado de un servicio a su respuesta HTTP.
 */
import type { NextResponse } from 'next/server';
import type { z } from 'zod';
import { parseCatalogId, readJsonBody, respond } from '@/lib/admin/catalog-api';

/**
 * Lee y valida el cuerpo JSON de una petición.
 *
 * @param request - Petición entrante.
 * @param schema - Esquema Zod del cuerpo.
 * @returns Los datos validados, o la respuesta 400 que la ruta debe devolver tal cual.
 */
export async function parseBodyWith<S extends z.ZodType>(
    request: Request,
    schema: S,
): Promise<{ data: z.infer<S> } | { response: NextResponse }> {
    const body = await readJsonBody(request);
    if (body === undefined)
        return {
            response: respond({ message: 'El cuerpo de la petición no es JSON válido' }, 400),
        };
    const parsed = schema.safeParse(body);
    if (!parsed.success)
        return {
            response: respond(
                { message: 'Datos inválidos', errors: parsed.error.flatten().fieldErrors },
                400,
            ),
        };
    return { data: parsed.data };
}

/**
 * Valida el segmento `[id]` de la URL.
 *
 * @param raw - Texto de la URL.
 * @param what - Qué se identifica, para el mensaje («de la variedad»).
 * @returns El id, o la respuesta 400.
 */
export function parseIdParam(
    raw: string,
    what: string,
): { id: number } | { response: NextResponse } {
    const id = parseCatalogId(raw);
    return id === null
        ? { response: respond({ message: `El identificador ${what} no es válido` }, 400) }
        : { id };
}

/**
 * Respuesta de un servicio: `ok` con el código que se indica y el valor como cuerpo; si no,
 * 404 (no existe) o 409 (nombre repetido o valor en uso) con el mensaje.
 *
 * @param result - Resultado del servicio.
 * @param okStatus - Código si salió bien (200, o 201 al crear).
 */
export function respondResult<T>(
    result: { ok: true; value: T } | { ok: false; code: string; message: string },
    okStatus = 200,
): NextResponse {
    if (result.ok) return respond(result.value, okStatus);
    return respond({ message: result.message }, result.code === 'not_found' ? 404 : 409);
}
