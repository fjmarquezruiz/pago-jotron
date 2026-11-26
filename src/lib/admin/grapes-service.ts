/**
 * Escritura de variedades de uva del panel (CU9): crear, editar y borrar, cada cambio con su asiento
 * en `audit_logs` en la misma transacción. Solo lo llaman las rutas `/api/admin/uvas`, que ya
 * exigieron el rol de Editor o Administrador.
 */
import { changedFields } from '@/lib/admin/catalog';
import { auditedCatalogChange } from '@/lib/admin/catalog-api';
import { canDeleteGrape } from '@/lib/admin/grapes';
import { deleteGrapeRow, insertGrape, lockGrape, updateGrape } from '@/lib/db/admin-grapes';
import { isDuplicateEntryError } from '@/lib/db/errors';
import type { AuthorizedUser } from '@/lib/auth/require-role';
import type { GrapeInput } from '@/lib/validations/admin-grapes';

export type GrapeFailureCode = 'not_found' | 'duplicate' | 'in_use';

/** Resultado de una escritura; las reglas de negocio no lanzan, devuelven `ok: false`. */
export type GrapeResult<T> =
    { ok: true; value: T } | { ok: false; code: GrapeFailureCode; message: string };

const fail = (code: GrapeFailureCode, message: string): GrapeResult<never> => ({
    ok: false,
    code,
    message,
});

const DUPLICATE = 'Ya existe una variedad con ese nombre';

/** Nombres con los que sale cada campo en el asiento de auditoría. */
const LABELS = { name: 'nombre', color: 'color' } as const;

/**
 * Crea una variedad de uva.
 *
 * @param user - Cuenta de la sesión (queda en la auditoría).
 * @param input - Cuerpo ya validado con `grapeSchema`.
 * @returns El id nuevo, o `duplicate` si el nombre ya existe (la BD no distingue mayúsculas ni acentos).
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function createGrape(
    user: AuthorizedUser,
    input: GrapeInput,
): Promise<GrapeResult<{ id: number }>> {
    try {
        return await auditedCatalogChange(async (tx) => {
            const id = await insertGrape(tx, input);
            return {
                result: { ok: true, value: { id } } as const,
                audit: { entity: 'grape', id, name: input.name, actor: user, changes: ['creada'] },
            };
        });
    } catch (error) {
        if (isDuplicateEntryError(error)) return fail('duplicate', DUPLICATE);
        throw error;
    }
}

/**
 * Edita el nombre y el color de una uva. Un cambio que no cambia nada responde `ok` con
 * `changed: false` y no deja asiento.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `grapes.grape_id`.
 * @param input - Cuerpo ya validado.
 */
export async function updateGrapeValues(
    user: AuthorizedUser,
    id: number,
    input: GrapeInput,
): Promise<GrapeResult<{ changed: boolean }>> {
    try {
        return await auditedCatalogChange<GrapeResult<{ changed: boolean }>>(async (tx) => {
            const before = await lockGrape(tx, id);
            if (before === null)
                return { result: fail('not_found', 'La variedad no existe'), audit: null };
            const fields = changedFields({ name: before.name, color: before.color }, input, LABELS);
            if (fields.length === 0)
                return { result: { ok: true, value: { changed: false } }, audit: null };
            await updateGrape(tx, id, input);
            return {
                result: { ok: true, value: { changed: true } },
                audit: {
                    entity: 'grape',
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

/**
 * Borra una uva que ningún producto usa. La fila se bloquea antes de contar: un producto que la
 * enlace a la vez espera a que acabe la transacción y, con la uva ya borrada, falla su clave foránea.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `grapes.grape_id`.
 * @returns `in_use` si algún producto la usa (no se borra), `not_found` si ya no existe.
 */
export async function deleteGrape(
    user: AuthorizedUser,
    id: number,
): Promise<GrapeResult<{ deleted: true }>> {
    return auditedCatalogChange<GrapeResult<{ deleted: true }>>(async (tx) => {
        const grape = await lockGrape(tx, id);
        if (grape === null)
            return { result: fail('not_found', 'La variedad no existe'), audit: null };
        if (!canDeleteGrape(grape.wineCount))
            return {
                result: fail(
                    'in_use',
                    'La variedad está en uso: ningún producto debe usarla para borrarla',
                ),
                audit: null,
            };
        await deleteGrapeRow(tx, id);
        return {
            result: { ok: true, value: { deleted: true } },
            audit: { entity: 'grape', id, name: grape.name, actor: user, changes: ['eliminada'] },
        };
    });
}
