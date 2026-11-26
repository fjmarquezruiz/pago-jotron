import { and, asc, count, desc, eq, isNotNull, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { outerColumn } from '@/lib/db/outer-column';
import { products, wineries } from '@/db/schema';
import type { AdminWineryFilters } from '@/lib/admin/wineries';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';

/** `WHERE` del listado: ciudad exacta y búsqueda por nombre. */
function adminWineriesCondition({ region, q }: AdminWineryFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (region) conditions.push(eq(wineries.city, region));
    const pattern = searchPattern(q);
    if (pattern)
        conditions.push(
            sql`${wineries.name} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`,
        );
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/** Productos de la bodega (`Número de vinos` del listado). */
const productCount = sql<number>`(select count(*) from ${products} where ${products.wineryId} = ${outerColumn(wineries.id)})`;

/**
 * Una página del listado de bodegas del panel (CU9), por id.
 *
 * @returns Las bodegas de la página con su número de productos, el total con los filtros y el
 * total sin filtros.
 */
export async function getAdminWineriesPage({
    page,
    pageSize,
    ...filters
}: { page: number; pageSize: number } & AdminWineryFilters) {
    const where = adminWineriesCondition(filters);
    const [rows, [counted], [all]] = await Promise.all([
        db
            .select({
                id: wineries.id,
                name: wineries.name,
                city: wineries.city,
                isBlocked: wineries.isBlocked,
                productCount,
            })
            .from(wineries)
            .where(where)
            .orderBy(asc(wineries.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(wineries).where(where),
        db.select({ total: count() }).from(wineries),
    ]);
    // `count(*)` de una subconsulta llega como texto en algunos drivers.
    const items = rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
    return { items, total: counted?.total ?? 0, overall: all?.total ?? 0 };
}

/** Una página del listado, tal como la devuelve `getAdminWineriesPage`. */
export type AdminWineriesPage = Awaited<ReturnType<typeof getAdminWineriesPage>>;

/** Ciudades distintas de las bodegas, por orden alfabético, para el filtro «Región». */
export async function getAdminWineryRegions(): Promise<string[]> {
    const rows = await db
        .selectDistinct({ city: wineries.city })
        .from(wineries)
        .where(isNotNull(wineries.city))
        .orderBy(asc(wineries.city));
    return rows.map((row) => row.city as string);
}

/** Productos que enseña la ficha de la bodega: los más recientes. */
export const WINERY_PRODUCTS_LIMIT = 50;

/**
 * La ficha de una bodega: sus datos, su estado de venta, el total de sus productos y los más
 * recientes.
 *
 * @param wineryId - `wineries.winery_id`.
 * @returns La ficha, o `null` si no existe.
 */
export async function getAdminWinery(wineryId: number) {
    const [winery] = await db.select().from(wineries).where(eq(wineries.id, wineryId));
    if (!winery) return null;
    const [[counted], related] = await Promise.all([
        db.select({ total: count() }).from(products).where(eq(products.wineryId, wineryId)),
        db
            .select({ id: products.id, name: products.name, isBlocked: products.isBlocked })
            .from(products)
            .where(eq(products.wineryId, wineryId))
            .orderBy(desc(products.id))
            .limit(WINERY_PRODUCTS_LIMIT),
    ]);
    return { winery, productCount: counted?.total ?? 0, products: related };
}

/** La ficha de una bodega, tal como la devuelve `getAdminWinery`. */
export type AdminWinery = NonNullable<Awaited<ReturnType<typeof getAdminWinery>>>;
