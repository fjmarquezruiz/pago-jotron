/**
 * Escritura de tipologías del panel (CU9): crear, editar y borrar, cada cambio con su asiento en
 * `audit_logs` en la misma transacción. Solo lo llaman las rutas `/api/admin/tipologias`, que ya
 * exigieron el rol de Editor o Administrador.
 */
import { changedFields } from '@/lib/admin/catalog';
import { auditedCatalogChange } from '@/lib/admin/catalog-api';
import { canDeleteTypology } from '@/lib/admin/typologies';
import {
    deleteTypologyRow,
    insertTypology,
    lockTypology,
    updateTypology,
    type TypologyValues,
} from '@/lib/db/admin-typologies';
import { isDuplicateEntryError } from '@/lib/db/errors';
import type { AuthorizedUser } from '@/lib/auth/require-role';
import type { TypologyInput } from '@/lib/validations/admin-typologies';

export type TypologyFailureCode = 'not_found' | 'duplicate' | 'in_use';

/** Resultado de una escritura; las reglas de negocio no lanzan, devuelven `ok: false`. */
export type TypologyResult<T> =
    { ok: true; value: T } | { ok: false; code: TypologyFailureCode; message: string };

const fail = (code: TypologyFailureCode, message: string): TypologyResult<never> => ({
    ok: false,
    code,
    message,
});

const DUPLICATE = 'Ya existe una tipología con ese nombre';

/** Nombres con los que sale cada campo en el asiento de auditoría. */
const LABELS = {
    name: 'nombre',
    productType: 'tipo de producto',
    filterOrder: 'orden en filtros',
    taxRate: 'IVA',
} as const;

/**
 * Valores de la BD a partir del cuerpo validado: el IVA va como texto decimal (`21` → `'21.00'`).
 *
 * @param input - Cuerpo validado con `typologySchema`.
 */
export function toTypologyValues(input: TypologyInput): TypologyValues {
    return { ...input, taxRate: input.taxRate.toFixed(2) };
}

/**
 * Crea una tipología.
 *
 * @param user - Cuenta de la sesión (queda en la auditoría).
 * @param input - Cuerpo ya validado con `typologySchema`.
 * @returns El id nuevo, o `duplicate` si el nombre ya existe.
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function createTypology(
    user: AuthorizedUser,
    input: TypologyInput,
): Promise<TypologyResult<{ id: number }>> {
    try {
        return await auditedCatalogChange(async (tx) => {
            const id = await insertTypology(tx, toTypologyValues(input));
            return {
                result: { ok: true, value: { id } } as const,
                audit: {
                    entity: 'typology',
                    id,
                    name: input.name,
                    actor: user,
                    changes: ['creada'],
                },
            };
        });
    } catch (error) {
        if (isDuplicateEntryError(error)) return fail('duplicate', DUPLICATE);
        throw error;
    }
}

/**
 * Edita una tipología. Un cambio que no cambia nada responde `ok` con `changed: false` y no deja
 * asiento. El IVA nuevo lo heredan los productos de la tipología.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `typologies.typology_id`.
 * @param input - Cuerpo ya validado.
 */
export async function updateTypologyValues(
    user: AuthorizedUser,
    id: number,
    input: TypologyInput,
): Promise<TypologyResult<{ changed: boolean }>> {
    try {
        return await auditedCatalogChange<TypologyResult<{ changed: boolean }>>(async (tx) => {
            const before = await lockTypology(tx, id);
            if (before === null)
                return { result: fail('not_found', 'La tipología no existe'), audit: null };
            const values = toTypologyValues(input);
            const fields = changedFields(
                {
                    name: before.name,
                    productType: before.productType,
                    filterOrder: before.filterOrder,
                    taxRate: Number(before.taxRate),
                },
                input,
                LABELS,
            );
            if (fields.length === 0)
                return { result: { ok: true, value: { changed: false } }, audit: null };
            await updateTypology(tx, id, values);
            return {
                result: { ok: true, value: { changed: true } },
                audit: {
                    entity: 'typology',
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
 * Borra una tipología que ningún producto usa. La fila se bloquea antes de contar.
 *
 * @param user - Cuenta de la sesión.
 * @param id - `typologies.typology_id`.
 * @returns `in_use` si algún producto la usa (no se borra), `not_found` si ya no existe.
 */
export async function deleteTypology(
    user: AuthorizedUser,
    id: number,
): Promise<TypologyResult<{ deleted: true }>> {
    return auditedCatalogChange<TypologyResult<{ deleted: true }>>(async (tx) => {
        const typology = await lockTypology(tx, id);
        if (typology === null)
            return { result: fail('not_found', 'La tipología no existe'), audit: null };
        if (!canDeleteTypology(typology.productCount))
            return {
                result: fail(
                    'in_use',
                    'La tipología está en uso: ningún producto debe usarla para borrarla',
                ),
                audit: null,
            };
        await deleteTypologyRow(tx, id);
        return {
            result: { ok: true, value: { deleted: true } },
            audit: {
                entity: 'typology',
                id,
                name: typology.name,
                actor: user,
                changes: ['eliminada'],
            },
        };
    });
}
