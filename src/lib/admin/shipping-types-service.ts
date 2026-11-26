/**
 * Escritura de tipos de envío del panel (CU13): crear y editar, cada cambio con su asiento en
 * `audit_logs` en la misma transacción. Nunca se borran (los pedidos los referencian): se
 * desactivan con `is_blocked`. Solo lo llaman las rutas `/api/admin/envios`, que ya exigieron el
 * rol de Administrador.
 */
import { changedFields } from '@/lib/admin/catalog';
import { auditedCatalogChange } from '@/lib/admin/catalog-api';
import { canDeactivateShipping } from '@/lib/admin/shipping-types';
import {
    lockActiveShippingTypeIds,
    insertShippingType,
    lockShippingType,
    updateShippingTypeRow,
    type ShippingTypeValues,
} from '@/lib/db/admin-shipping';
import { isDuplicateEntryError } from '@/lib/db/errors';
import type { AuthorizedUser } from '@/lib/auth/require-role';
import type { ShippingTypeInput } from '@/lib/validations/admin-shipping';

export type ShippingFailureCode = 'not_found' | 'duplicate' | 'last_active';

/** Resultado de una escritura; las reglas de negocio no lanzan, devuelven `ok: false`. */
export type ShippingResult<T> =
    { ok: true; value: T } | { ok: false; code: ShippingFailureCode; message: string };

const fail = (code: ShippingFailureCode, message: string): ShippingResult<never> => ({
    ok: false,
    code,
    message,
});

const DUPLICATE = 'Ya existe un tipo de envío con ese nombre';
const LAST_ACTIVE =
    'No se puede desactivar el último tipo de envío activo: el checkout se quedaría sin envíos';

/** Nombres con los que sale cada campo en el asiento de auditoría. */
const LABELS = {
    name: 'nombre',
    cost: 'precio',
    minDeliveryDays: 'plazo mínimo',
    maxDeliveryDays: 'plazo máximo',
    isBlocked: 'estado',
} as const;

/**
 * Valores de la BD a partir del cuerpo validado: el coste va como texto decimal (`4.95` → `'4.95'`).
 *
 * @param input - Cuerpo validado con `shippingTypeSchema`.
 */
export function toShippingValues(input: ShippingTypeInput): ShippingTypeValues {
    return { ...input, cost: input.cost.toFixed(2) };
}

/**
 * Crea un tipo de envío.
 *
 * @param user - Cuenta de la sesión (queda en la auditoría).
 * @param input - Cuerpo ya validado con `shippingTypeSchema`.
 * @returns El id nuevo, o `duplicate` si el nombre ya existe.
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function createShippingType(
    user: AuthorizedUser,
    input: ShippingTypeInput,
): Promise<ShippingResult<{ id: number }>> {
    try {
        return await auditedCatalogChange(async (tx) => {
            const id = await insertShippingType(tx, toShippingValues(input));
            return {
                result: { ok: true, value: { id } } as const,
                audit: {
                    entity: 'shipping_type',
                    id,
                    name: input.name,
                    actor: user,
                    changes: ['creado'],
                },
            };
        });
    } catch (error) {
        if (isDuplicateEntryError(error)) return fail('duplicate', DUPLICATE);
        throw error;
    }
}

/**
 * Edita un tipo de envío. Si lo desactiva, comprueba con las filas activas bloqueadas que queda al
 * menos otro (`canDeactivateShipping`). Un cambio que no cambia nada responde `ok` con
 * `changed: false` y no deja asiento.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `shipping_types.shipping_type_id`.
 * @param input - Cuerpo ya validado.
 * @returns `ok`, `not_found`, `duplicate` o `last_active`.
 */
export async function updateShippingType(
    user: AuthorizedUser,
    id: number,
    input: ShippingTypeInput,
): Promise<ShippingResult<{ changed: boolean }>> {
    try {
        return await auditedCatalogChange<ShippingResult<{ changed: boolean }>>(async (tx) => {
            // Primero todos los activos y luego la fila concreta, siempre en ese orden.
            const activeIds = await lockActiveShippingTypeIds(tx);
            const before = await lockShippingType(tx, id);
            if (before === null)
                return { result: fail('not_found', 'El tipo de envío no existe'), audit: null };
            const fields = changedFields(
                {
                    name: before.name,
                    cost: Number(before.cost),
                    minDeliveryDays: before.minDeliveryDays,
                    maxDeliveryDays: before.maxDeliveryDays,
                    isBlocked: before.isBlocked,
                },
                input,
                LABELS,
            );
            if (fields.length === 0)
                return { result: { ok: true, value: { changed: false } }, audit: null };
            if (!before.isBlocked && input.isBlocked) {
                const others = activeIds.filter((activeId) => activeId !== id).length;
                if (!canDeactivateShipping(others))
                    return { result: fail('last_active', LAST_ACTIVE), audit: null };
            }
            await updateShippingTypeRow(tx, id, toShippingValues(input));
            return {
                result: { ok: true, value: { changed: true } },
                audit: {
                    entity: 'shipping_type',
                    id,
                    name: input.name,
                    actor: user,
                    changes: [`cambia: ${fields.join(', ')}`],
                },
            };
        });
    } catch (error) {
        if (isDuplicateEntryError(error)) return fail('duplicate', DUPLICATE);
        throw error;
    }
}
