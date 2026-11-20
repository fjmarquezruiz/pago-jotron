import type { UserAddress } from '@/lib/db/queries';
import {
    addressesResponseSchema,
    profileResponseSchema,
    type CheckoutProfile,
} from '@/lib/validations/checkout-state';

/** Ruta de la API de las direcciones de la cuenta (GET). */
const ADDRESSES_API = '/api/cuenta/direcciones';

/** Ruta de la API del perfil de la cuenta (GET). */
const PROFILE_API = '/api/cuenta/perfil';

/** Milisegundos que se espera cada petición antes de darla por perdida. */
const DEFAULT_TIMEOUT_MS = 8000;

/** Lo que el checkout necesita de la cuenta: sus direcciones vigentes y sus datos de contacto. */
export interface CheckoutAccountData {
    addresses: UserAddress[];
    profile: CheckoutProfile;
}

/** Por qué falló la carga: sin sesión (401) o cualquier otro motivo (red, tiempo, servidor, respuesta inesperada). */
export type CheckoutLoadFailure = 'unauthorized' | 'error';

/** `fetch` reducido a lo que se usa: una ruta del propio sitio. */
export type CheckoutFetch = (input: string, init?: RequestInit) => Promise<Response>;

/** Resultado de `loadCheckoutData`: nunca lanza. */
export type CheckoutLoadResult =
    { ok: true; data: CheckoutAccountData } | { ok: false; reason: CheckoutLoadFailure };

/** Lee una ruta y valida la respuesta; lanza `Error('unauthorized')` si es 401 y `Error('error')` en lo demás. */
async function getJson<T>(
    fetchFn: CheckoutFetch,
    url: string,
    parse: (body: unknown) => T | null,
    timeoutMs: number,
    signal?: AbortSignal,
): Promise<T> {
    const timeout = AbortSignal.timeout(timeoutMs);
    const response = await fetchFn(url, {
        cache: 'no-store',
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (response.status === 401) throw new Error('unauthorized');
    if (!response.ok) throw new Error('error');
    const parsed = parse(await response.json());
    if (parsed === null) throw new Error('error');
    return parsed;
}

/**
 * Pide al servidor las direcciones y el perfil de la cuenta (`GET /api/cuenta/direcciones` y
 * `GET /api/cuenta/perfil`), en paralelo, sin caché y con tiempo máximo. Valida las respuestas
 * con zod: si el servidor devuelve otra cosa, cuenta como error.
 *
 * @param options.fetchFn - Cómo hacer las peticiones; por defecto `fetch`. Solo lo cambian los tests.
 * @param options.timeoutMs - Tiempo máximo de cada petición (8000 por defecto).
 * @param options.signal - Para cancelar (al desmontar o recargar).
 * @returns Los datos, o el motivo del fallo. Nunca lanza.
 *
 * @example
 * const result = await loadCheckoutData();
 * if (result.ok) console.log(result.data.addresses);
 */
export async function loadCheckoutData(
    options: { fetchFn?: CheckoutFetch; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<CheckoutLoadResult> {
    const fetchFn = options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    try {
        const [addresses, profile] = await Promise.all([
            getJson(
                fetchFn,
                ADDRESSES_API,
                (body) => {
                    const parsed = addressesResponseSchema.safeParse(body);
                    return parsed.success ? parsed.data.addresses : null;
                },
                timeoutMs,
                options.signal,
            ),
            getJson(
                fetchFn,
                PROFILE_API,
                (body) => {
                    const parsed = profileResponseSchema.safeParse(body);
                    return parsed.success ? parsed.data.profile : null;
                },
                timeoutMs,
                options.signal,
            ),
        ]);
        return { ok: true, data: { addresses, profile } };
    } catch (error) {
        return {
            ok: false,
            reason:
                error instanceof Error && error.message === 'unauthorized'
                    ? 'unauthorized'
                    : 'error',
        };
    }
}
