/**
 * Reglas puras del panel de bodegas (CU9): rutas, filtros de la URL, textos del pie y de los
 * chips, y los nombres de campo del asiento de auditoría. Sin acceso a la BD, para poder probarlas.
 */
import { entityNumber } from '@/lib/admin/catalog';
import { provinceFromPostalCode } from '@/lib/geo/provinces';

/** Ruta del listado de bodegas del panel. */
export const ADMIN_WINERIES_PATH = '/admin/bodegas';

/** Ruta del formulario de alta. */
export const ADMIN_WINERY_NEW_PATH = '/admin/bodegas/nueva';

/** Bodegas por página del listado (Figma: «Mostrando 1–10 de 34 bodegas»). */
export const ADMIN_WINERIES_PAGE_SIZE = 10;

/** Filtros del listado tal como viajan en la URL (`region`, `q`). */
export interface AdminWineryFilters {
    /** Ciudad de la bodega: es lo que el listado enseña en la columna «Región». */
    region?: string;
    /** Texto buscado en el nombre. */
    q?: string;
}

/** `true` si hay algún filtro puesto. */
export function hasAdminWineryFilters({ region, q }: AdminWineryFilters): boolean {
    return Boolean(region || q);
}

/**
 * Enlace a una página del listado conservando los filtros: `/admin/bodegas?pagina=2&region=Jerez`.
 * La página 1 va sin `pagina`.
 *
 * @param input - Página (1 por defecto) y filtros.
 */
export function adminWineriesHref({
    page = 1,
    region,
    q,
}: AdminWineryFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (region) query.set('region', region);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_WINERIES_PATH}?${text}` : ADMIN_WINERIES_PATH;
}

/**
 * Chips de «Filtros activos:»: `Región: todas` o la elegida y, aparte, la búsqueda con el texto
 * tal cual (Figma: wineries-list y wineries-list-search-applied).
 */
export function adminWineryFilterLabels({ region, q }: AdminWineryFilters): {
    region: string;
    search?: string;
} {
    return { region: `Región: ${region ?? 'todas'}`, ...(q && { search: q }) };
}

/**
 * Pie de la tabla. Sin filtros, `Mostrando 1–10 de 34 bodegas`; con filtros, `Mostrando 3 bodegas
 * filtradas de 34`; sin resultados, `Mostrando 0 de 0`.
 */
export function adminWineriesRangeText({
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
        return `Mostrando ${total} ${total === 1 ? 'bodega filtrada' : 'bodegas filtradas'} de ${overall}`;
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}–${first + shown - 1} de ${total} ${total === 1 ? 'bodega' : 'bodegas'}`;
}

/** Id de bodega como se enseña: `WIN-001`. */
export function wineryNumber(id: number): string {
    return entityNumber('WIN', id);
}

/** Ruta de la ficha de una bodega. */
export function wineryHref(id: number): string {
    return `${ADMIN_WINERIES_PATH}/${id}`;
}

/** Campo → nombre legible, en el orden del formulario, para el asiento de auditoría. */
export const WINERY_FIELD_LABELS = {
    name: 'nombre',
    address: 'dirección',
    email: 'correo',
    city: 'ciudad',
    province: 'provincia',
    country: 'país',
    phone: 'teléfono',
    website: 'sitio web',
    description: 'descripción',
} as const;

/** País por defecto de una bodega (`wineries.country`). */
export const WINERY_DEFAULT_COUNTRY = 'España';

/**
 * Provincias españolas, por orden alfabético, para el desplegable «Provincia». Salen de la lista
 * de códigos postales (01 a 52) que ya usan las direcciones, para no repetirla.
 */
export const SPANISH_PROVINCES: readonly string[] = Array.from({ length: 52 }, (_, index) =>
    provinceFromPostalCode(`${String(index + 1).padStart(2, '0')}000`),
)
    .filter((name): name is string => name !== null)
    .sort((a, b) => a.localeCompare(b, 'es'));
