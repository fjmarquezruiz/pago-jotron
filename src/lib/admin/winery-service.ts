/**
 * Escrituras de las bodegas (CU9): alta, edición, estado de venta y borrado. Cada una va en UNA
 * transacción con su asiento de `audit_logs` (`auditedCatalogChange`). Las rutas exigen el rol
 * antes de llamar aquí; el bloqueo de ventas, solo el administrador.
 */
import { count, eq } from 'drizzle-orm';
import { products, wineries } from '@/db/schema';
import { auditedCatalogChange } from '@/lib/admin/catalog-api';
import { changedFields, salesChangeText } from '@/lib/admin/catalog';
import { WINERY_FIELD_LABELS } from '@/lib/admin/wineries';
import { isDuplicateEntryError } from '@/lib/db/errors';
import type { AuthorizedUser } from '@/lib/auth/require-role';
import type { WineryInput } from '@/lib/validations/admin-wineries';

/** Por qué no se pudo hacer el cambio. */
export type WineryFailureCode = 'not_found' | 'duplicate' | 'in_use';

/** Resultado de una escritura: sin lanzar por reglas de negocio. */
export type WineryResult<T = object> =
    ({ ok: true } & T) | { ok: false; code: WineryFailureCode; message: string };

const fail = (code: WineryFailureCode, message: string) => ({ ok: false as const, code, message });

const NOT_FOUND = 'La bodega no existe';
const DUPLICATE = 'Ya existe una bodega con ese nombre';

/**
 * Da de alta una bodega (está a la venta: `is_blocked` por defecto es 0).
 *
 * @param user - Cuenta de la sesión.
 * @param input - Datos ya validados (`wineryFormSchema`).
 * @returns `{ ok: true, id }`, o `duplicate` si el nombre ya existe (índice único).
 */
export async function createWinery(
    user: AuthorizedUser,
    input: WineryInput,
): Promise<WineryResult<{ id: number }>> {
    try {
        const id = await auditedCatalogChange<number>(async (tx) => {
            const [inserted] = await tx.insert(wineries).values(input).$returningId();
            return {
                result: inserted.id,
                audit: {
                    entity: 'winery',
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
 * Edita los datos de una bodega. Si no cambia nada no se escribe ni se audita. No toca
 * `is_blocked`.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `wineries.winery_id`.
 * @param input - Datos ya validados.
 * @returns `{ ok: true, changed }`, `not_found` o `duplicate`.
 */
export async function updateWinery(
    user: AuthorizedUser,
    id: number,
    input: WineryInput,
): Promise<WineryResult<{ changed: boolean }>> {
    try {
        return await auditedCatalogChange<WineryResult<{ changed: boolean }>>(async (tx) => {
            const [before] = await tx
                .select()
                .from(wineries)
                .where(eq(wineries.id, id))
                .for('update');
            if (!before) return { result: fail('not_found', NOT_FOUND), audit: null };
            const changes = changedFields(before, { ...before, ...input }, WINERY_FIELD_LABELS);
            if (changes.length === 0)
                return { result: { ok: true as const, changed: false }, audit: null };
            await tx.update(wineries).set(input).where(eq(wineries.id, id));
            return {
                result: { ok: true as const, changed: true },
                audit: {
                    entity: 'winery',
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
 * Bloquea o pone a la venta una bodega (`is_blocked`). Solo la llama una ruta que exigió el rol
 * Administrador. Los pedidos ya hechos no se tocan (punto 5 del plan).
 *
 * @param user - Cuenta de la sesión.
 * @param id - `wineries.winery_id`.
 * @param isBlocked - Estado nuevo.
 * @returns `{ ok: true, changed }` o `not_found`.
 */
export async function setWinerySalesBlocked(
    user: AuthorizedUser,
    id: number,
    isBlocked: boolean,
): Promise<WineryResult<{ changed: boolean }>> {
    return auditedCatalogChange<WineryResult<{ changed: boolean }>>(async (tx) => {
        const [before] = await tx.select().from(wineries).where(eq(wineries.id, id)).for('update');
        if (!before) return { result: fail('not_found', NOT_FOUND), audit: null };
        if (before.isBlocked === isBlocked)
            return { result: { ok: true as const, changed: false }, audit: null };
        await tx.update(wineries).set({ isBlocked }).where(eq(wineries.id, id));
        return {
            result: { ok: true as const, changed: true },
            audit: {
                entity: 'winery',
                id,
                name: before.name,
                actor: user,
                changes: [salesChangeText(isBlocked)],
            },
        };
    });
}

/**
 * Borra una bodega SIN productos. Con la fila bloqueada se cuentan sus productos: si tiene, no se
 * borra (`in_use`); la baja de una bodega en uso es bloquear sus ventas.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `wineries.winery_id`.
 * @returns `{ ok: true }`, `not_found` o `in_use`.
 */
export async function deleteWinery(user: AuthorizedUser, id: number): Promise<WineryResult> {
    return auditedCatalogChange<WineryResult>(async (tx) => {
        const [before] = await tx.select().from(wineries).where(eq(wineries.id, id)).for('update');
        if (!before) return { result: fail('not_found', NOT_FOUND), audit: null };
        const [used] = await tx
            .select({ total: count() })
            .from(products)
            .where(eq(products.wineryId, id));
        if ((used?.total ?? 0) > 0)
            return {
                result: fail(
                    'in_use',
                    'La bodega tiene productos: no se puede borrar. Bloquea sus ventas.',
                ),
                audit: null,
            };
        await tx.delete(wineries).where(eq(wineries.id, id));
        return {
            result: { ok: true as const },
            audit: { entity: 'winery', id, name: before.name, actor: user, changes: ['borrada'] },
        };
    });
}
