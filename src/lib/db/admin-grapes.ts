import { and, asc, count, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { outerColumn } from '@/lib/db/outer-column';
import { grapes, productGrapes, products, typologies, wineries } from '@/db/schema';
import type { AdminGrapeFilters } from '@/lib/admin/grapes';
import type { CatalogTx } from '@/lib/admin/catalog-api';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';

/** Productos que usan la uva: cuenta de `product_grapes` (una fila por producto y uva). */
const wineCount =
    sql<number>`(select count(*) from ${productGrapes} where ${productGrapes.grapeId} = ${outerColumn(grapes.id)})`.mapWith(
        Number,
    );

/** `WHERE` del listado: color y búsqueda por nombre. */
function adminGrapesCondition({ color, q }: AdminGrapeFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (color) conditions.push(eq(grapes.color, color));
    const pattern = searchPattern(q);
    if (pattern)
        conditions.push(sql`${grapes.name} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`);
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Una página del listado de uvas del panel (CU9), por id.
 *
 * @returns Las uvas de la página con los vinos que las usan, el total con los filtros y el total
 * sin filtros.
 */
export async function getAdminGrapesPage({
    page,
    pageSize,
    ...filters
}: { page: number; pageSize: number } & AdminGrapeFilters) {
    const where = adminGrapesCondition(filters);
    const [items, [counted], [all]] = await Promise.all([
        db
            .select({ id: grapes.id, name: grapes.name, color: grapes.color, wineCount })
            .from(grapes)
            .where(where)
            .orderBy(asc(grapes.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(grapes).where(where),
        db.select({ total: count() }).from(grapes),
    ]);
    return { items, total: counted?.total ?? 0, overall: all?.total ?? 0 };
}

export type AdminGrapesPage = Awaited<ReturnType<typeof getAdminGrapesPage>>;
export type AdminGrapeRow = AdminGrapesPage['items'][number];

/**
 * Una uva con el número de vinos que la usan, o `null` si no existe.
 *
 * @param id - `grapes.grape_id`.
 */
export async function getAdminGrape(id: number): Promise<AdminGrapeRow | null> {
    const [row] = await db
        .select({ id: grapes.id, name: grapes.name, color: grapes.color, wineCount })
        .from(grapes)
        .where(eq(grapes.id, id))
        .limit(1);
    return row ?? null;
}

/**
 * Los productos que usan la uva (ficha de la uva), por nombre, con su bodega y su tipología.
 *
 * @param grapeId - `grapes.grape_id`.
 */
export async function getGrapeWines(grapeId: number) {
    return db
        .select({
            id: products.id,
            name: products.name,
            winery: wineries.name,
            typology: typologies.name,
            isBlocked: products.isBlocked,
        })
        .from(productGrapes)
        .innerJoin(products, eq(products.id, productGrapes.productId))
        .innerJoin(wineries, eq(wineries.id, products.wineryId))
        .innerJoin(typologies, eq(typologies.id, products.typologyId))
        .where(eq(productGrapes.grapeId, grapeId))
        .orderBy(asc(products.name), asc(products.id));
}

export type GrapeWine = Awaited<ReturnType<typeof getGrapeWines>>[number];

/** Inserta una uva y devuelve su id. Lanza `ER_DUP_ENTRY` si el nombre ya existe. */
export async function insertGrape(
    tx: CatalogTx,
    values: { name: string; color: AdminGrapeRow['color'] },
) {
    const [result] = await tx.insert(grapes).values(values);
    return result.insertId;
}

/**
 * Lee una uva bloqueándola (`SELECT … FOR UPDATE`): mientras dura la transacción nadie puede
 * enlazarla a un producto (la clave foránea de `product_grapes` espera a este bloqueo).
 *
 * @returns La uva y los productos que la usan, o `null` si no existe.
 */
export async function lockGrape(tx: CatalogTx, id: number) {
    const [row] = await tx
        .select({ id: grapes.id, name: grapes.name, color: grapes.color })
        .from(grapes)
        .where(eq(grapes.id, id))
        .for('update');
    if (!row) return null;
    const [used] = await tx
        .select({ total: count() })
        .from(productGrapes)
        .where(eq(productGrapes.grapeId, id));
    return { ...row, wineCount: used?.total ?? 0 };
}

/** Cambia nombre y color de una uva. Lanza `ER_DUP_ENTRY` si el nombre ya es de otra. */
export async function updateGrape(
    tx: CatalogTx,
    id: number,
    values: { name: string; color: AdminGrapeRow['color'] },
) {
    await tx.update(grapes).set(values).where(eq(grapes.id, id));
}

/** Borra una uva (el servicio ya comprobó que ningún producto la usa). */
export async function deleteGrapeRow(tx: CatalogTx, id: number) {
    await tx.delete(grapes).where(eq(grapes.id, id));
}
