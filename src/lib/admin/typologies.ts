/**
 * Reglas puras del listado de tipologías del panel (CU9): tipos de producto, filtros de la URL,
 * enlaces, formato del IVA y cuándo se puede borrar una tipología. Sin acceso a la BD, para poder
 * probarlas.
 */
import { entityNumber } from '@/lib/admin/catalog';

/** Ruta del listado de tipologías del panel. */
export const ADMIN_TYPOLOGIES_PATH = '/admin/tipologias';

/** Tipos de producto, como el enum de `typologies.product_type`. */
export const PRODUCT_TYPES = ['Vino', 'Pasas'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Filtros del listado tal como viajan en la URL (`tipo`, `q`). */
export interface AdminTypologyFilters {
    productType?: ProductType;
    /** Texto buscado en el nombre. */
    q?: string;
}

/** `true` si hay algún filtro puesto. */
export function hasAdminTypologyFilters({ productType, q }: AdminTypologyFilters): boolean {
    return Boolean(productType || q);
}

/**
 * Id de una tipología como se enseña: `TIP-001`. No hay columna: se deriva del id.
 *
 * @param id - `typologies.typology_id`.
 */
export function typologyNumber(id: number): string {
    return entityNumber('TIP', id);
}

/**
 * Enlace al listado conservando los filtros: `/admin/tipologias?tipo=Pasas&q=pasa`. No hay
 * paginación (son pocas filas, Figma: «Mostrando 1–7 de 7 tipologías»).
 */
export function adminTypologiesHref({ productType, q }: AdminTypologyFilters): string {
    const query = new URLSearchParams();
    if (productType) query.set('tipo', productType);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_TYPOLOGIES_PATH}?${text}` : ADMIN_TYPOLOGIES_PATH;
}

/**
 * Chips de «Filtros activos:» (Figma: «Tipo de producto: todos»): el tipo o «todos» y, aparte, la
 * búsqueda con el texto tal cual.
 */
export function adminTypologyFilterLabels({ productType, q }: AdminTypologyFilters): {
    productType: string;
    search?: string;
} {
    return {
        productType: `Tipo de producto: ${productType ? productType.toLowerCase() : 'todos'}`,
        ...(q && { search: q }),
    };
}

/**
 * Pie de la tabla: `Mostrando 1–7 de 7 tipologías`; con filtros, `Mostrando 2 tipologías
 * filtradas de 7`; sin resultados, `Mostrando 0 de 0`.
 */
export function adminTypologiesRangeText({
    shown,
    overall,
    filtered,
}: {
    shown: number;
    overall: number;
    filtered: boolean;
}): string {
    if (shown === 0) return 'Mostrando 0 de 0';
    if (filtered)
        return `Mostrando ${shown} ${shown === 1 ? 'tipología filtrada' : 'tipologías filtradas'} de ${overall}`;
    return `Mostrando 1–${shown} de ${overall} ${overall === 1 ? 'tipología' : 'tipologías'}`;
}

/**
 * IVA como se enseña (Figma: «21 %»). Las cifras decimales sobran: `'21.00'` es `21 %` y `'7.50'`
 * es `7,5 %`.
 *
 * @param taxRate - `typologies.tax_rate` (decimal como texto, `'21.00'`).
 */
export function formatTaxRate(taxRate: string): string {
    const value = Number(taxRate);
    if (!Number.isFinite(value)) return `${taxRate} %`;
    return `${String(value).replace('.', ',')} %`;
}

/**
 * Una tipología solo se borra si ningún producto la usa (`products.typology_id` es obligatoria y
 * de ella hereda el IVA).
 *
 * @param productCount - Productos que la usan.
 */
export function canDeleteTypology(productCount: number): boolean {
    return productCount === 0;
}
