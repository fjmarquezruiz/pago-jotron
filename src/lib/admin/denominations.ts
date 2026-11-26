/**
 * Reglas puras del panel de denominaciones de origen (CU9): rutas, filtros de la URL, textos del
 * pie y de los chips, y los nombres de campo del asiento de auditoría. Sin acceso a la BD.
 */
import { entityNumber } from '@/lib/admin/catalog';

/** Ruta del listado de denominaciones del panel. */
export const ADMIN_DENOMINATIONS_PATH = '/admin/denominaciones';

/** Ruta del formulario de alta. */
export const ADMIN_DENOMINATION_NEW_PATH = '/admin/denominaciones/nueva';

/** Denominaciones por página del listado (Figma: «Mostrando 1–10 de 34 denominaciones»). */
export const ADMIN_DENOMINATIONS_PAGE_SIZE = 10;

/** Bodegas por página de la tabla «Bodegas relacionadas» de la ficha. */
export const DENOMINATION_WINERIES_PAGE_SIZE = 10;

/** Clasificaciones de `guarantees_of_origin.classification` con su texto del desplegable. */
export const CLASSIFICATIONS = [
    { value: 'DO', label: 'DO (Denominación de Origen)' },
    { value: 'DOP', label: 'DOP (Denominación de Origen Protegida)' },
    { value: 'DOCa', label: 'DOCa (Denominación de Origen Calificada)' },
    { value: 'IGP', label: 'IGP (Indicación Geográfica Protegida)' },
    { value: 'VT', label: 'VT (Vino de la Tierra)' },
] as const;

/** Valores del enum `guarantees_of_origin.classification`. */
export const CLASSIFICATION_VALUES = ['DO', 'DOP', 'DOCa', 'IGP', 'VT'] as const;

export type Classification = (typeof CLASSIFICATION_VALUES)[number];

/** Filtros del listado tal como viajan en la URL (`region`, `q`). */
export interface AdminDenominationFilters {
    /** Región geográfica exacta (`guarantees_of_origin.region`). */
    region?: string;
    /** Texto buscado en el nombre. */
    q?: string;
}

/** `true` si hay algún filtro puesto. */
export function hasAdminDenominationFilters({ region, q }: AdminDenominationFilters): boolean {
    return Boolean(region || q);
}

/**
 * Enlace a una página del listado conservando los filtros. La página 1 va sin `pagina`.
 *
 * @param input - Página (1 por defecto) y filtros.
 */
export function adminDenominationsHref({
    page = 1,
    region,
    q,
}: AdminDenominationFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (region) query.set('region', region);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_DENOMINATIONS_PATH}?${text}` : ADMIN_DENOMINATIONS_PATH;
}

/** Chips de «Filtros activos:» (Figma: denominations-list): `Región: todas` o la elegida y la búsqueda. */
export function adminDenominationFilterLabels({ region, q }: AdminDenominationFilters): {
    region: string;
    search?: string;
} {
    return { region: `Región: ${region ?? 'todas'}`, ...(q && { search: q }) };
}

/**
 * Pie de la tabla. Sin filtros, `Mostrando 1–10 de 34 denominaciones`; con filtros, `Mostrando 3
 * denominaciones filtradas de 34`; sin resultados, `Mostrando 0 de 0`.
 */
export function adminDenominationsRangeText({
    page,
    pageSize,
    shown,
    total,
    overall,
    filtered,
}: {
    page: number;
    pageSize: number;
    shown: number;
    total: number;
    overall: number;
    filtered: boolean;
}): string {
    if (shown === 0) return 'Mostrando 0 de 0';
    if (filtered)
        return `Mostrando ${total} ${total === 1 ? 'denominación filtrada' : 'denominaciones filtradas'} de ${overall}`;
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}–${first + shown - 1} de ${total} ${total === 1 ? 'denominación' : 'denominaciones'}`;
}

/** Id de denominación como se enseña: `DO-001`. */
export function denominationNumber(id: number): string {
    return entityNumber('DO', id);
}

/** Ruta de la ficha de una denominación. */
export function denominationHref(id: number): string {
    return `${ADMIN_DENOMINATIONS_PATH}/${id}`;
}

/** Campo → nombre legible, en el orden del formulario, para el asiento de auditoría. */
export const DENOMINATION_FIELD_LABELS = {
    name: 'nombre',
    foundedYear: 'año de fundación',
    classification: 'clasificación',
    regulatoryCouncil: 'consejo regulador',
    region: 'región',
    website: 'sitio web',
    description: 'descripción',
} as const;
