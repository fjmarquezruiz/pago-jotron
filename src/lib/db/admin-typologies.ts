import { and, asc, count, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { outerColumn } from '@/lib/db/outer-column';
import { products, typologies } from '@/db/schema';
import type { AdminTypologyFilters } from '@/lib/admin/typologies';
import type { CatalogTx } from '@/lib/admin/catalog-api';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';

/** Productos que usan la tipología. */
const productCount =
    sql<number>`(select count(*) from ${products} where ${products.typologyId} = ${outerColumn(typologies.id)})`.mapWith(
        Number,
    );

/** `WHERE` del listado: tipo de producto y búsqueda por nombre. */
function adminTypologiesCondition({ productType, q }: AdminTypologyFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (productType) conditions.push(eq(typologies.productType, productType));
    const pattern = searchPattern(q);
    if (pattern)
        conditions.push(
            sql`${typologies.name} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`,
        );
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * El listado de tipologías del panel (CU9), por «Orden en filtros» y luego por id. Sin paginar:
 * son pocas.
 *
 * @returns Las tipologías con los productos que las usan y el total sin filtros.
 */
export async function getAdminTypologies(filters: AdminTypologyFilters) {
    const [items, [all]] = await Promise.all([
        db
            .select({
                id: typologies.id,
                name: typologies.name,
                productType: typologies.productType,
                filterOrder: typologies.filterOrder,
                taxRate: typologies.taxRate,
                productCount,
            })
            .from(typologies)
            .where(adminTypologiesCondition(filters))
            .orderBy(asc(typologies.filterOrder), asc(typologies.id)),
        db.select({ total: count() }).from(typologies),
    ]);
    return { items, overall: all?.total ?? 0 };
}

export type AdminTypologiesList = Awaited<ReturnType<typeof getAdminTypologies>>;
export type AdminTypologyRow = AdminTypologiesList['items'][number];

/** Valores que se guardan de una tipología; el IVA va como texto decimal (`'21.00'`). */
export interface TypologyValues {
    name: string;
    productType: AdminTypologyRow['productType'];
    filterOrder: number;
    taxRate: string;
}

/** Inserta una tipología y devuelve su id. Lanza `ER_DUP_ENTRY` si el nombre ya existe. */
export async function insertTypology(tx: CatalogTx, values: TypologyValues) {
    const [result] = await tx.insert(typologies).values(values);
    return result.insertId;
}

/**
 * Lee una tipología bloqueándola (`SELECT … FOR UPDATE`) junto con los productos que la usan.
 *
 * @returns La tipología, o `null` si no existe.
 */
export async function lockTypology(tx: CatalogTx, id: number) {
    const [row] = await tx
        .select({
            id: typologies.id,
            name: typologies.name,
            productType: typologies.productType,
            filterOrder: typologies.filterOrder,
            taxRate: typologies.taxRate,
        })
        .from(typologies)
        .where(eq(typologies.id, id))
        .for('update');
    if (!row) return null;
    const [used] = await tx
        .select({ total: count() })
        .from(products)
        .where(eq(products.typologyId, id));
    return { ...row, productCount: used?.total ?? 0 };
}

/** Cambia los valores de una tipología. Lanza `ER_DUP_ENTRY` si el nombre ya es de otra. */
export async function updateTypology(tx: CatalogTx, id: number, values: TypologyValues) {
    await tx.update(typologies).set(values).where(eq(typologies.id, id));
}

/** Borra una tipología (el servicio ya comprobó que ningún producto la usa). */
export async function deleteTypologyRow(tx: CatalogTx, id: number) {
    await tx.delete(typologies).where(eq(typologies.id, id));
}
