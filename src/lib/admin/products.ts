/**
 * Reglas puras del catálogo de productos del panel (CU9): filtros del listado y su URL, estado de
 * existencias, texto de presentaciones y utilidades del formulario. Sin acceso a la BD, para poder
 * probarlas.
 */
import { LOW_STOCK_THRESHOLD } from '@/lib/admin/dashboard';
import { entityNumber, salesStatusLabel } from '@/lib/admin/catalog';
import { formatPresentation } from '@/lib/catalog/presentation';

/** Ruta del listado de productos del panel. */
export const ADMIN_PRODUCTS_PATH = '/admin/productos';

/** Productos por página del listado (Figma: «Mostrando 1–10 de 142 productos»). */
export const ADMIN_PRODUCTS_PAGE_SIZE = 10;

/** Estados de venta que se pueden filtrar (el interruptor guarda `is_blocked`). */
export const PRODUCT_STATUSES = ['Activo', 'Bloqueado'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Carpeta de Cloudinary donde viven las imágenes de producto (`public_id` = carpeta + nombre). */
export const PRODUCT_IMAGE_FOLDER = 'pago-jotron/productos';

/** Tamaño máximo de la imagen que se sube (el formulario y Cloudinary lo comprueban). */
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Formatos admitidos, tal como los pide Cloudinary en `allowed_formats`. */
export const PRODUCT_IMAGE_FORMATS = 'jpg,jpeg,png,webp';

/** Filtros del listado tal como viajan en la URL (`tipologia`, `denominacion`, `bodega`, `estado`, `q`). */
export interface AdminProductFilters {
    typologyId?: number;
    guaranteeOfOriginId?: number;
    wineryId?: number;
    status?: ProductStatus;
    /** Texto buscado en el nombre del producto. */
    q?: string;
}

/**
 * `true` si hay algún filtro puesto.
 *
 * @param filters - Filtros ya saneados.
 */
export function hasAdminProductFilters({
    typologyId,
    guaranteeOfOriginId,
    wineryId,
    status,
    q,
}: AdminProductFilters): boolean {
    return Boolean(typologyId || guaranteeOfOriginId || wineryId || status || q);
}

/**
 * Enlace a una página del listado conservando los filtros:
 * `/admin/productos?pagina=2&tipologia=3`. La página 1 va sin `pagina`.
 *
 * @param params - Filtros y página (1 por defecto).
 */
export function adminProductsHref({
    page = 1,
    typologyId,
    guaranteeOfOriginId,
    wineryId,
    status,
    q,
}: AdminProductFilters & { page?: number }): string {
    const query = new URLSearchParams();
    if (page > 1) query.set('pagina', String(page));
    if (typologyId) query.set('tipologia', String(typologyId));
    if (guaranteeOfOriginId) query.set('denominacion', String(guaranteeOfOriginId));
    if (wineryId) query.set('bodega', String(wineryId));
    if (status) query.set('estado', status);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `${ADMIN_PRODUCTS_PATH}?${text}` : ADMIN_PRODUCTS_PATH;
}

/** Nombres con los que se rotulan los filtros por id. */
export interface AdminProductFilterNames {
    typologies: readonly { id: number; name: string }[];
    guarantees: readonly { id: number; name: string }[];
    wineries: readonly { id: number; name: string }[];
}

/**
 * Chips de «Filtros activos» (Figma: «Tipo: tinto», «D.O.: Sierras de Málaga»): `Tipo: todos`
 * siempre, y uno más por cada filtro puesto; la búsqueda va aparte y como `outline`.
 *
 * @param filters - Filtros vigentes.
 * @param names - Nombres de tipologías, D.O. y bodegas para rotularlos.
 */
export function adminProductFilterChips(
    { typologyId, guaranteeOfOriginId, wineryId, status, q }: AdminProductFilters,
    names: AdminProductFilterNames,
): { label: string; variant?: 'outline' }[] {
    const nameOf = (list: readonly { id: number; name: string }[], id: number) =>
        list.find((item) => item.id === id)?.name ?? `#${id}`;
    const typology = typologyId ? nameOf(names.typologies, typologyId).toLowerCase() : 'todos';
    return [
        { label: `Tipo: ${typology}` },
        ...(guaranteeOfOriginId
            ? [{ label: `D.O.: ${nameOf(names.guarantees, guaranteeOfOriginId)}` }]
            : []),
        ...(wineryId ? [{ label: `Bodega: ${nameOf(names.wineries, wineryId)}` }] : []),
        ...(status ? [{ label: `Estado: ${status.toLowerCase()}` }] : []),
        ...(q ? [{ label: q, variant: 'outline' as const }] : []),
    ];
}

/**
 * Pie de la tabla. Sin filtros, `Mostrando 1-10 de 142 productos`; con filtros, `Mostrando 1
 * producto filtrado de 142`; sin resultados, `Mostrando 0 de 0`.
 */
export function adminProductsRangeText({
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
        return `Mostrando ${total} ${total === 1 ? 'producto filtrado' : 'productos filtrados'} de ${overall}`;
    const first = (page - 1) * pageSize + 1;
    return `Mostrando ${first}-${first + shown - 1} de ${total} productos`;
}

/** Id de producto como se enseña: `PRD-001`. No hay columna: se deriva del id. */
export function productNumber(id: number): string {
    return entityNumber('PRD', id);
}

/** Lo que el listado necesita de una presentación. */
export interface ProductVariantSummary {
    format: string;
    capacity: number;
    capacityUnit: 'ml' | 'g';
    price: string;
    stock: number;
    isBlocked: boolean;
}

/** Estado que enseña la tabla: etiqueta y tono del `Badge`. */
export interface ProductStockState {
    label: string;
    tone: 'success' | 'warning' | 'destructive';
}

/**
 * Estado de un producto en el listado (Figma: Activo, Limitado, Agotado). Un producto con las
 * ventas bloqueadas sale «Ventas bloqueadas»; sin existencias en ninguna presentación a la venta,
 * «Agotado»; con alguna por debajo de `LOW_STOCK_THRESHOLD`, «Limitado»; si no, «A la venta».
 *
 * @param isBlocked - `products.is_blocked`.
 * @param variants - Sus presentaciones.
 */
export function productStockState(
    isBlocked: boolean,
    variants: readonly Pick<ProductVariantSummary, 'stock' | 'isBlocked'>[],
): ProductStockState {
    if (isBlocked) return { label: salesStatusLabel(true), tone: 'destructive' };
    const onSale = variants.filter((variant) => !variant.isBlocked);
    if (onSale.every((variant) => variant.stock === 0))
        return { label: 'Agotado', tone: 'destructive' };
    if (onSale.some((variant) => variant.stock < LOW_STOCK_THRESHOLD))
        return { label: 'Limitado', tone: 'warning' };
    return { label: salesStatusLabel(false), tone: 'success' };
}

/**
 * Presentación que enseña el listado en lugar del SKU: la primera (la de menor capacidad) como
 * «Botella 75 cl» y, si hay más, cuántas más (`+2`).
 *
 * @param variants - Presentaciones del producto.
 * @returns El texto y el número de las que no se nombran; `null` si no tiene ninguna.
 */
export function presentationSummary(
    variants: readonly Pick<ProductVariantSummary, 'format' | 'capacity' | 'capacityUnit'>[],
): { label: string; more: number } | null {
    if (variants.length === 0) return null;
    const [first] = [...variants].sort((a, b) => a.capacity - b.capacity);
    return { label: formatPresentation(first), more: variants.length - 1 };
}

/**
 * Precio más bajo de las presentaciones (el «desde» del listado).
 *
 * @param variants - Presentaciones del producto.
 * @returns El precio como texto decimal (`'12.90'`), o `null` sin presentaciones.
 */
export function lowestPrice(
    variants: readonly Pick<ProductVariantSummary, 'price'>[],
): string | null {
    if (variants.length === 0) return null;
    return variants.reduce(
        (min, v) => (Number(v.price) < Number(min) ? v.price : min),
        variants[0].price,
    );
}

/** Suma de las existencias de todas las presentaciones. */
export function totalStock(variants: readonly Pick<ProductVariantSummary, 'stock'>[]): number {
    return variants.reduce((sum, variant) => sum + variant.stock, 0);
}

/**
 * Texto del IVA bajo la tipología (Figma: «IVA 21 % (tipología)»). El IVA sale de la tipología y
 * aquí solo se lee.
 *
 * @param taxRate - `typologies.tax_rate` (`'21.00'`) o `undefined` si aún no hay tipología.
 */
export function taxText(taxRate: string | undefined): string {
    if (taxRate === undefined) return 'El IVA sale de la tipología';
    return `IVA ${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(Number(taxRate))} % (tipología)`;
}

/**
 * Unidad con la que se propone una presentación nueva: los vinos van en mililitros y las pasas en
 * gramos (`typologies.product_type`).
 *
 * @param productType - Tipo de la tipología elegida, o `undefined` si aún no hay.
 */
export function defaultCapacityUnit(productType: 'Vino' | 'Pasas' | undefined): 'ml' | 'g' {
    return productType === 'Pasas' ? 'g' : 'ml';
}

/** Fallos de negocio de las escrituras de producto, con el estado HTTP que les corresponde. */
const WRITE_STATUS = {
    not_found: 404,
    invalid_reference: 400,
    invalid_variant: 400,
    slug_taken: 409,
    duplicate_variant: 409,
    stock_conflict: 409,
} as const;

/**
 * Código HTTP de un fallo de escritura de producto: 404 si no existe, 400 si una referencia o
 * presentación no es válida y 409 si choca con lo que ya hay (slug repetido, presentación
 * repetida o stock que cambió mientras se editaba).
 *
 * @param code - Código del fallo (`ProductWriteFailureCode`).
 */
export function productWriteStatus(code: keyof typeof WRITE_STATUS): 400 | 404 | 409 {
    return WRITE_STATUS[code];
}
