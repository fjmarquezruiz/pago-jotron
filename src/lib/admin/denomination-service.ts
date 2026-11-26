/**
 * Escrituras de las denominaciones de origen (CU9): alta, edición, estado de venta y borrado. Cada
 * una va en UNA transacción con su asiento de `audit_logs` (`auditedCatalogChange`). Las rutas
 * exigen el rol antes de llamar aquí; el bloqueo de ventas, solo el administrador.
 */
import { count, eq } from 'drizzle-orm';
import { guaranteesOfOrigin, products } from '@/db/schema';
import { auditedCatalogChange } from '@/lib/admin/catalog-api';
import { changedFields, salesChangeText } from '@/lib/admin/catalog';
import { DENOMINATION_FIELD_LABELS } from '@/lib/admin/denominations';
import { isDuplicateEntryError } from '@/lib/db/errors';
import type { AuthorizedUser } from '@/lib/auth/require-role';
import type { DenominationInput } from '@/lib/validations/admin-denominations';

/** Por qué no se pudo hacer el cambio. */
export type DenominationFailureCode = 'not_found' | 'duplicate' | 'in_use';

/** Resultado de una escritura: sin lanzar por reglas de negocio. */
export type DenominationResult<T = object> =
    ({ ok: true } & T) | { ok: false; code: DenominationFailureCode; message: string };

const fail = (code: DenominationFailureCode, message: string) => ({
    ok: false as const,
    code,
    message,
});

const NOT_FOUND = 'La denominación de origen no existe';
const DUPLICATE = 'Ya existe una denominación de origen con ese nombre';

/**
 * Da de alta una denominación (está a la venta: `is_blocked` por defecto es 0).
 *
 * @param user - Cuenta de la sesión.
 * @param input - Datos ya validados (`denominationFormSchema`).
 * @returns `{ ok: true, id }`, o `duplicate` si el nombre ya existe (índice único).
 */
export async function createDenomination(
    user: AuthorizedUser,
    input: DenominationInput,
): Promise<DenominationResult<{ id: number }>> {
    try {
        const id = await auditedCatalogChange<number>(async (tx) => {
            const [inserted] = await tx.insert(guaranteesOfOrigin).values(input).$returningId();
            return {
                result: inserted.id,
                audit: {
                    entity: 'denomination',
                    id: inserted.id,
                    name: input.name,
                    actor: user,
                    changes: ['creada'],
                },
            };
        });
        return { ok: true, id };
    } catch (error) {
        if (isDuplicateEntryError(error)) return fail('duplicate', DUPLICATE);
        throw error;
    }
}

/**
 * Edita los datos de una denominación. Si no cambia nada no se escribe ni se audita. No toca
 * `is_blocked`.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `guarantees_of_origin.guarantee_of_origin_id`.
 * @param input - Datos ya validados.
 * @returns `{ ok: true, changed }`, `not_found` o `duplicate`.
 */
export async function updateDenomination(
    user: AuthorizedUser,
    id: number,
    input: DenominationInput,
): Promise<DenominationResult<{ changed: boolean }>> {
    try {
        return await auditedCatalogChange<DenominationResult<{ changed: boolean }>>(async (tx) => {
            const [before] = await tx
                .select()
                .from(guaranteesOfOrigin)
                .where(eq(guaranteesOfOrigin.id, id))
                .for('update');
            if (!before) return { result: fail('not_found', NOT_FOUND), audit: null };
            const changes = changedFields(
                before,
                { ...before, ...input },
                DENOMINATION_FIELD_LABELS,
            );
            if (changes.length === 0)
                return { result: { ok: true as const, changed: false }, audit: null };
            await tx.update(guaranteesOfOrigin).set(input).where(eq(guaranteesOfOrigin.id, id));
            return {
                result: { ok: true as const, changed: true },
                audit: {
                    entity: 'denomination',
                    id,
                    name: input.name,
                    actor: user,
                    changes: [`cambia: ${changes.join(', ')}`],
                },
            };
        });
    } catch (error) {
        if (isDuplicateEntryError(error)) return fail('duplicate', DUPLICATE);
        throw error;
    }
}

/**
 * Bloquea o pone a la venta una denominación (`is_blocked`). Solo la llama una ruta que exigió el
 * rol Administrador. Los pedidos ya hechos no se tocan (punto 5 del plan).
 *
 * @param user - Cuenta de la sesión.
 * @param id - `guarantees_of_origin.guarantee_of_origin_id`.
 * @param isBlocked - Estado nuevo.
 * @returns `{ ok: true, changed }` o `not_found`.
 */
export async function setDenominationSalesBlocked(
    user: AuthorizedUser,
    id: number,
    isBlocked: boolean,
): Promise<DenominationResult<{ changed: boolean }>> {
    return auditedCatalogChange<DenominationResult<{ changed: boolean }>>(async (tx) => {
        const [before] = await tx
            .select()
            .from(guaranteesOfOrigin)
            .where(eq(guaranteesOfOrigin.id, id))
            .for('update');
        if (!before) return { result: fail('not_found', NOT_FOUND), audit: null };
        if (before.isBlocked === isBlocked)
            return { result: { ok: true as const, changed: false }, audit: null };
        await tx.update(guaranteesOfOrigin).set({ isBlocked }).where(eq(guaranteesOfOrigin.id, id));
        return {
            result: { ok: true as const, changed: true },
            audit: {
                entity: 'denomination',
                id,
                name: before.name,
                actor: user,
                changes: [salesChangeText(isBlocked)],
            },
        };
    });
}

/**
 * Borra una denominación SIN productos. Con la fila bloqueada se cuentan sus productos: si tiene,
 * no se borra (`in_use`); la baja de una denominación en uso es bloquear sus ventas.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `guarantees_of_origin.guarantee_of_origin_id`.
 * @returns `{ ok: true }`, `not_found` o `in_use`.
 */
export async function deleteDenomination(
    user: AuthorizedUser,
    id: number,
): Promise<DenominationResult> {
    return auditedCatalogChange<DenominationResult>(async (tx) => {
        const [before] = await tx
            .select()
            .from(guaranteesOfOrigin)
            .where(eq(guaranteesOfOrigin.id, id))
            .for('update');
        if (!before) return { result: fail('not_found', NOT_FOUND), audit: null };
        const [used] = await tx
            .select({ total: count() })
            .from(products)
            .where(eq(products.guaranteeOfOriginId, id));
        if ((used?.total ?? 0) > 0)
            return {
                result: fail(
                    'in_use',
                    'La denominación tiene productos: no se puede borrar. Bloquea sus ventas.',
                ),
                audit: null,
            };
        await tx.delete(guaranteesOfOrigin).where(eq(guaranteesOfOrigin.id, id));
        return {
            result: { ok: true as const },
            audit: {
                entity: 'denomination',
                id,
                name: before.name,
                actor: user,
                changes: ['borrada'],
            },
        };
    });
}
