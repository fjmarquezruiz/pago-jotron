import { orderResponseSchema, type ConfirmationOrder } from '@/lib/validations/order-response';
import { profileResponseSchema, type CheckoutProfile } from '@/lib/validations/checkout-state';

/** Milisegundos que se espera cada petición antes de darla por perdida. */
const DEFAULT_TIMEOUT_MS = 8000;

/** Por qué falló la carga del pedido: sin sesión (401), no existe o es de otra cuenta (404/400) o cualquier otro motivo. */
export type OrderLoadFailure = 'unauthorized' | 'not-found' | 'error';

/** `fetch` reducido a lo que se usa: una ruta del propio sitio. */
export type OrderFetch = (input: string, init?: RequestInit) => Promise<Response>;

/** Resultado de `loadConfirmationOrder`: nunca lanza. */
export type OrderLoadResult =
    | { ok: true; order: ConfirmationOrder; profile: CheckoutProfile | null }
    | { ok: false; reason: OrderLoadFailure };

/**
 * Pide al servidor el pedido (`GET /api/pedidos/[id]`) y, en paralelo, el perfil de la cuenta
 * (`GET /api/cuenta/perfil`) para saludar por el nombre y enseñar el correo, sin caché y con
 * tiempo máximo. Las respuestas se validan con zod.
 *
 * El perfil es accesorio: si falla, el pedido se enseña igual (`profile: null`) y la pantalla se
 * limita a omitir el nombre y el correo. Lo que no puede faltar es el pedido.
 *
 * @param orderId - `orders.order_id`.
 * @param options.fetchFn - Cómo hacer las peticiones; por defecto `fetch`. Solo lo cambian los tests.
 * @param options.timeoutMs - Tiempo máximo de cada petición (8000 por defecto).
 * @param options.signal - Para cancelar (al desmontar o recargar).
 * @returns El pedido y el perfil, o el motivo del fallo. Nunca lanza.
 *
 * @example
 * const result = await loadConfirmationOrder(12);
 * if (result.ok) console.log(result.order.number); // 'PJ-12'
 */
export async function loadConfirmationOrder(
    orderId: number,
    options: { fetchFn?: OrderFetch; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<OrderLoadResult> {
    const fetchFn = options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const get = (url: string) => {
        const timeout = AbortSignal.timeout(timeoutMs);
        return fetchFn(url, {
            cache: 'no-store',
            signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
        });
    };

    const loadProfile = async (): Promise<CheckoutProfile | null> => {
        try {
            const response = await get('/api/cuenta/perfil');
            if (!response.ok) return null;
            const parsed = profileResponseSchema.safeParse(await response.json());
            return parsed.success ? parsed.data.profile : null;
        } catch {
            return null;
        }
    };

    try {
        const [response, profile] = await Promise.all([
            get(`/api/pedidos/${orderId}`),
            loadProfile(),
        ]);
        if (response.status === 401) return { ok: false, reason: 'unauthorized' };
        if (response.status === 404 || response.status === 400)
            return { ok: false, reason: 'not-found' };
        if (!response.ok) return { ok: false, reason: 'error' };
        const parsed = orderResponseSchema.safeParse(await response.json());
        if (!parsed.success) return { ok: false, reason: 'error' };
        return { ok: true, order: parsed.data.order, profile };
    } catch {
        return { ok: false, reason: 'error' };
    }
}
