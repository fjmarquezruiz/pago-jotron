/**
 * Consultas de lectura del catálogo de productos del panel (CU9): el listado con filtros, el
 * producto para el formulario y las opciones de los selectores.
 */
import { and, asc, count, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import {
    grapes,
    guaranteesOfOrigin,
    productGrapes,
    products,
    productVariants,
    typologies,
    wineries,
} from '@/db/schema';
import type { AdminProductFilters } from '@/lib/admin/products';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';

/** `WHERE` del listado: tipología, D.O., bodega, estado de venta y búsqueda por nombre. */
function adminProductsCondition({
    typologyId,
    guaranteeOfOriginId,
    wineryId,
    status,
    q,
}: AdminProductFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (typologyId) conditions.push(eq(products.typologyId, typologyId));
    if (guaranteeOfOriginId) conditions.push(eq(products.guaranteeOfOriginId, guaranteeOfOriginId));
    if (wineryId) conditions.push(eq(products.wineryId, wineryId));
    if (status) conditions.push(eq(products.isBlocked, status === 'Bloqueado'));
    const pattern = searchPattern(q);
    if (pattern)
        conditions.push(
            sql`${products.name} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`,
        );
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Una página del listado de productos del panel (CU9), del más reciente al más antiguo. Incluye los
 * bloqueados (a diferencia del catálogo de la tienda) y, de cada uno, todas sus presentaciones.
 *
 * @returns Los productos de la página con su bodega, D.O., tipología y presentaciones; el total con
 * los filtros y el total sin filtros.
 */
export async function getAdminProductsPage({
    page,
    pageSize,
    ...filters
}: { page: number; pageSize: number } & AdminProductFilters) {
    const where = adminProductsCondition(filters);
    const [rows, [counted], [all]] = await Promise.all([
        db
            .select({
                id: products.id,
                name: products.name,
                vintage: products.vintage,
                isBlocked: products.isBlocked,
                winery: wineries.name,
                guaranteeOfOrigin: guaranteesOfOrigin.name,
                typology: typologies.name,
            })
            .from(products)
            .innerJoin(wineries, eq(wineries.id, products.wineryId))
            .innerJoin(guaranteesOfOrigin, eq(guaranteesOfOrigin.id, products.guaranteeOfOriginId))
            .innerJoin(typologies, eq(typologies.id, products.typologyId))
            .where(where)
            .orderBy(desc(products.createdAt), desc(products.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(products).where(where),
        db.select({ total: count() }).from(products),
    ]);

    const variants =
        rows.length === 0
            ? []
            : await db
                  .select({
                      productId: productVariants.productId,
                      format: productVariants.format,
                      capacity: productVariants.capacity,
                      capacityUnit: productVariants.capacityUnit,
                      price: productVariants.price,
                      stock: productVariants.stock,
                      isBlocked: productVariants.isBlocked,
                  })
                  .from(productVariants)
                  .where(
                      inArray(
                          productVariants.productId,
                          rows.map((row) => row.id),
                      ),
                  )
                  .orderBy(asc(productVariants.capacity));

    const items = rows.map((row) => ({
        ...row,
        variants: variants.filter((variant) => variant.productId === row.id),
    }));
    return { items, total: counted?.total ?? 0, overall: all?.total ?? 0 };
}

/** Una página del listado, tal como la devuelve `getAdminProductsPage`. */
export type AdminProductsPage = Awaited<ReturnType<typeof getAdminProductsPage>>;

/** Una fila del listado de productos. */
export type AdminProductRow = AdminProductsPage['items'][number];

/**
 * Un producto para el formulario de edición: sus datos, sus uvas con porcentaje y todas sus
 * presentaciones (también las bloqueadas), de menor a mayor capacidad.
 *
 * @param productId - `products.product_id`.
 * @returns El producto, o `null` si no existe.
 */
export async function getAdminProduct(productId: number) {
    const [product] = await db
        .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            wineryId: products.wineryId,
            guaranteeOfOriginId: products.guaranteeOfOriginId,
            typologyId: products.typologyId,
            vintage: products.vintage,
            image: products.image,
            description: products.description,
            isBlocked: products.isBlocked,
            wineryName: wineries.name,
        })
        .from(products)
        .innerJoin(wineries, eq(wineries.id, products.wineryId))
        .where(eq(products.id, productId));
    if (!product) return null;
    const [productGrapeRows, variants] = await Promise.all([
        db
            .select({ grapeId: productGrapes.grapeId, percentage: productGrapes.percentage })
            .from(productGrapes)
            .where(eq(productGrapes.productId, productId))
            .orderBy(desc(productGrapes.percentage), asc(productGrapes.grapeId)),
        db
            .select({
                id: productVariants.id,
                format: productVariants.format,
                capacity: productVariants.capacity,
                capacityUnit: productVariants.capacityUnit,
                price: productVariants.price,
                stock: productVariants.stock,
                isBlocked: productVariants.isBlocked,
            })
            .from(productVariants)
            .where(eq(productVariants.productId, productId))
            .orderBy(asc(productVariants.capacity), asc(productVariants.id)),
    ]);
    return { ...product, grapes: productGrapeRows, variants };
}

/** Un producto tal como lo carga `getAdminProduct`. */
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

/**
 * Lo que ofrecen los selectores del listado y del formulario: todas las bodegas, D.O., tipologías
 * (con su tipo de producto y su IVA) y uvas, por nombre. Incluye las bloqueadas: un producto puede
 * seguir apuntando a una.
 */
export async function getAdminProductOptions() {
    const [wineryRows, guaranteeRows, typologyRows, grapeRows] = await Promise.all([
        db
            .select({ id: wineries.id, name: wineries.name })
            .from(wineries)
            .orderBy(asc(wineries.name)),
        db
            .select({ id: guaranteesOfOrigin.id, name: guaranteesOfOrigin.name })
            .from(guaranteesOfOrigin)
            .orderBy(asc(guaranteesOfOrigin.name)),
        db
            .select({
                id: typologies.id,
                name: typologies.name,
                productType: typologies.productType,
                taxRate: typologies.taxRate,
            })
            .from(typologies)
            .orderBy(asc(typologies.filterOrder), asc(typologies.name)),
        db.select({ id: grapes.id, name: grapes.name }).from(grapes).orderBy(asc(grapes.name)),
    ]);
    return {
        wineries: wineryRows,
        guarantees: guaranteeRows,
        typologies: typologyRows,
        grapes: grapeRows,
    };
}

/** Opciones de los selectores, tal como las devuelve `getAdminProductOptions`. */
export type AdminProductOptions = Awaited<ReturnType<typeof getAdminProductOptions>>;
