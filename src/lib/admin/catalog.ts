/**
 * Reglas puras comunes del catálogo del panel (CU9): quién puede editarlo, cómo se llama el estado
 * de venta, cómo se numeran las filas y qué asiento de auditoría deja cada cambio. Sin acceso a la
 * BD, para poder probarlas.
 */
import type { Role } from '@/types/auth';

/** Roles que mantienen el catálogo (el administrador además bloquea ventas de bodegas y D.O.). */
export const CATALOG_ROLES = ['Editor', 'Administrador'] as const satisfies readonly Role[];

/** Lo que se edita en el catálogo, con el nombre con el que sale en la auditoría. */
export const CATALOG_ENTITIES = {
    product: 'Producto',
    winery: 'Bodega',
    denomination: 'Denominación de origen',
    grape: 'Variedad de uva',
    typology: 'Tipología',
} as const;

export type CatalogEntity = keyof typeof CATALOG_ENTITIES;

/**
 * Etiqueta del interruptor de Estado. Las tablas guardan `is_blocked`, pero el interruptor se lee
 * al revés: encendido es «A la venta».
 *
 * @param isBlocked - `is_blocked` de la fila.
 * @returns «Ventas bloqueadas» o «A la venta».
 */
export function salesStatusLabel(isBlocked: boolean): string {
    return isBlocked ? 'Ventas bloqueadas' : 'A la venta';
}

/**
 * Id de una fila como se enseña: `WIN-001` (tres cifras como mínimo). No hay columna: se deriva
 * del id, como `userNumber`.
 *
 * @param prefix - Prefijo en mayúsculas del diseño (por ejemplo `WIN`).
 * @param id - Clave primaria de la fila.
 */
export function entityNumber(prefix: string, id: number): string {
    return `${prefix}-${String(id).padStart(3, '0')}`;
}

/**
 * Nombres de los campos que han cambiado entre dos versiones de una fila, en el orden de `labels`,
 * para el texto del asiento de auditoría. Compara en profundidad (JSON), así que vale también para
 * listas como las presentaciones.
 *
 * @param before - Fila antes del cambio.
 * @param after - Fila después del cambio.
 * @param labels - Campo → nombre legible en español.
 * @returns Los nombres de los campos distintos; vacío si no cambió nada.
 */
export function changedFields<T extends Record<string, unknown>>(
    before: T,
    after: T,
    labels: { [K in keyof T]?: string },
): string[] {
    return (Object.keys(labels) as (keyof T)[])
        .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        .map((key) => labels[key] as string);
}

/** Lo que `catalogAuditEntry` necesita para componer un asiento. */
export interface CatalogAuditInput {
    entity: CatalogEntity;
    /** Clave primaria de la fila. */
    id: number;
    /** Nombre de la fila, para localizarla aunque cambie. */
    name: string;
    /** Cuenta de la sesión que hace el cambio. */
    actor: { id: number; role: Role };
    /** Qué se hizo: «creado», «bloqueadas las ventas», «cambia: nombre, precio»… */
    changes: string[];
}

/**
 * Asiento de `audit_logs` de un cambio del catálogo, listo para `insertAuditLogQuery`. Sigue el
 * formato de usuarios: la acción dice qué fila y qué cambió; el detalle, quién lo hizo.
 *
 * @example
 * catalogAuditEntry({ entity: 'winery', id: 3, name: 'Lustau', actor: { id: 1, role: 'Editor' }, changes: ['ventas bloqueadas'] });
 * // { userId: 1, action: 'Bodega 3: ventas bloqueadas', details: '«Lustau»; lo cambia Editor (cuenta 1)' }
 */
export function catalogAuditEntry({ entity, id, name, actor, changes }: CatalogAuditInput) {
    return {
        userId: actor.id,
        action: `${CATALOG_ENTITIES[entity]} ${id}: ${changes.join(', ')}`,
        details: `«${name}»; lo cambia ${actor.role} (cuenta ${actor.id})`,
    };
}

/**
 * Qué anota la auditoría al cambiar el estado de venta.
 *
 * @param isBlocked - Estado nuevo (`is_blocked`).
 */
export function salesChangeText(isBlocked: boolean): string {
    return isBlocked ? 'ventas bloqueadas' : 'puesta a la venta';
}
