import { and, asc, count, eq, isNotNull, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { outerColumn } from '@/lib/db/outer-column';
import { guaranteesOfOrigin, products, wineries } from '@/db/schema';
import type { AdminDenominationFilters } from '@/lib/admin/denominations';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';

/** `WHERE` del listado: región exacta y búsqueda por nombre. */
function adminDenominationsCondition({ region, q }: AdminDenominationFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (region) conditions.push(eq(guaranteesOfOrigin.region, region));
    const pattern = searchPattern(q);
    if (pattern)
        conditions.push(
            sql`${guaranteesOfOrigin.name} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`,
        );
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/** Productos de la denominación (`Número de vinos` del listado). */
const productCount = sql<number>`(select count(*) from ${products} where ${products.guaranteeOfOriginId} = ${outerColumn(guaranteesOfOrigin.id)})`;

/**
 * Una página del listado de denominaciones del panel (CU9), por id.
 *
 * @returns Las denominaciones de la página con su número de productos, el total con los filtros y
 * el total sin filtros.
 */
export async function getAdminDenominationsPage({
    page,
    pageSize,
    ...filters
}: { page: number; pageSize: number } & AdminDenominationFilters) {
    const where = adminDenominationsCondition(filters);
    const [rows, [counted], [all]] = await Promise.all([
        db
            .select({
                id: guaranteesOfOrigin.id,
                name: guaranteesOfOrigin.name,
                classification: guaranteesOfOrigin.classification,
                region: guaranteesOfOrigin.region,
                isBlocked: guaranteesOfOrigin.isBlocked,
                productCount,
            })
            .from(guaranteesOfOrigin)
            .where(where)
            .orderBy(asc(guaranteesOfOrigin.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(guaranteesOfOrigin).where(where),
        db.select({ total: count() }).from(guaranteesOfOrigin),
    ]);
    const items = rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
    return { items, total: counted?.total ?? 0, overall: all?.total ?? 0 };
}

/** Una página del listado, tal como la devuelve `getAdminDenominationsPage`. */
export type AdminDenominationsPage = Awaited<ReturnType<typeof getAdminDenominationsPage>>;

/** Regiones distintas de las denominaciones, por orden alfabético, para el filtro «Región». */
export async function getAdminDenominationRegions(): Promise<string[]> {
    const rows = await db
        .selectDistinct({ region: guaranteesOfOrigin.region })
        .from(guaranteesOfOrigin)
        .where(isNotNull(guaranteesOfOrigin.region))
        .orderBy(asc(guaranteesOfOrigin.region));
    return rows.map((row) => row.region as string);
}

/**
 * La ficha de una denominación: sus datos, su estado de venta y el total de sus productos.
 *
 * @param denominationId - `guarantees_of_origin.guarantee_of_origin_id`.
 * @returns La ficha, o `null` si no existe.
 */
export async function getAdminDenomination(denominationId: number) {
    const [denomination] = await db
        .select()
        .from(guaranteesOfOrigin)
        .where(eq(guaranteesOfOrigin.id, denominationId));
    if (!denomination) return null;
    const [counted] = await db
        .select({ total: count() })
        .from(products)
        .where(eq(products.guaranteeOfOriginId, denominationId));
    return { denomination, productCount: counted?.total ?? 0 };
}

/** La ficha de una denominación, tal como la devuelve `getAdminDenomination`. */
export type AdminDenomination = NonNullable<Awaited<ReturnType<typeof getAdminDenomination>>>;

/**
 * Una página de las bodegas que tienen productos de la denominación («Bodegas relacionadas» de la
 * ficha), por id, con su número de productos de ella.
 *
 * @param denominationId - `guarantees_of_origin.guarantee_of_origin_id`.
 * @param page - Página, desde 1.
 * @param pageSize - Filas por página.
 * @returns Las bodegas de la página y el total.
 */
export async function getDenominationWineriesPage(
    denominationId: number,
    page: number,
    pageSize: number,
) {
    const grouped = db
        .select({
            id: wineries.id,
            name: wineries.name,
            city: wineries.city,
            productCount: count(products.id).as('product_count'),
        })
        .from(products)
        .innerJoin(wineries, eq(wineries.id, products.wineryId))
        .where(eq(products.guaranteeOfOriginId, denominationId))
        .groupBy(wineries.id, wineries.name, wineries.city);
    const sub = grouped.as('related');
    const [items, [counted]] = await Promise.all([
        db
            .select()
            .from(sub)
            .orderBy(asc(sub.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(sub),
    ]);
    return {
        items: items.map((row) => ({ ...row, productCount: Number(row.productCount) })),
        total: counted?.total ?? 0,
    };
}
