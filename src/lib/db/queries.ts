import {
    and,
    asc,
    count,
    countDistinct,
    desc,
    eq,
    min,
    not,
    sql,
    sum,
    type SQL,
} from 'drizzle-orm';
import { db } from '@/db';
import { NEW_PRODUCT_DAYS } from '@/lib/catalog/novelty';
import { toPositiveInt } from '@/lib/catalog/pagination';
import {
    guaranteesOfOrigin,
    productGrapes,
    productVariants,
    products,
    shippingTypes,
    users,
    wineries,
} from '@/db/schema';

/**
 * Condición `WHERE` de la regla de visibilidad del catálogo (RF4): ni el producto, ni su bodega,
 * ni su D.O. están bloqueados. Úsala en las consultas del listado, que deben hacer `join` con
 * `wineries` y `guaranteesOfOrigin`.
 *
 * Es la misma regla que `isProductVisible` (`src/lib/catalog/visibility.ts`), que decide en la
 * ficha con el producto ya cargado. Si cambia una, cambia la otra: `queries.test.ts` comprueba
 * que esta condición mira los tres bloqueos.
 */
export function visibleProductsCondition(): SQL {
    return and(
        eq(products.isBlocked, false),
        eq(wineries.isBlocked, false),
        eq(guaranteesOfOrigin.isBlocked, false),
    ) as SQL;
}

/**
 * Busca un usuario por su email (RF2). Lo usa el login para comprobar la contraseña.
 * @param email Email ya normalizado (sin espacios y en minúsculas).
 * @returns El usuario, o `null` si no existe.
 */
export async function getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
}

/**
 * Crea una cuenta de cliente (RF2). El rol lo pone la BD por defecto (`Cliente`).
 * @param data Email normalizado, hash de la contraseña y fecha de nacimiento (`AAAA-MM-DD`).
 * @returns El id del usuario creado.
 */
export async function createUser(data: { email: string; passwordHash: string; birthDate: string }) {
    const [{ id }] = await db.insert(users).values(data).$returningId();
    return id;
}

/**
 * Ficha de un producto por su slug (RF4). Carga el producto con su bodega, su D.O., su tipología,
 * sus presentaciones sin bloquear (de menor a mayor capacidad), sus uvas (la de mayor porcentaje
 * primero) y sus etiquetas de cata. Las uvas y las etiquetas llegan como filas de unión:
 * `grapes[i].grape` con `grapes[i].percentage`, y `tastingTags[i].tastingTag`.
 *
 * No filtra por visibilidad: devuelve también un producto bloqueado, con el estado de su bodega
 * y su D.O. dentro. La página debe comprobarlo con `isProductPageAvailable`, que además exige
 * alguna presentación, y llamar a `notFound()` si no se cumple.
 *
 * @param slug Slug de la URL (`/productos/[slug]`).
 * @returns El producto con sus relaciones, o `null` si no existe ese slug.
 */
export async function getProductBySlug(slug: string) {
    const product = await db.query.products.findFirst({
        where: eq(products.slug, slug),
        with: {
            winery: true,
            guaranteeOfOrigin: true,
            typology: true,
            variants: {
                where: eq(productVariants.isBlocked, false),
                orderBy: [asc(productVariants.capacity)],
            },
            grapes: { with: { grape: true }, orderBy: [desc(productGrapes.percentage)] },
            tastingTags: { with: { tastingTag: true } },
        },
    });
    return product ?? null;
}

/** Producto de la ficha con todas sus relaciones: el tipo que reciben los componentes de `/productos/[slug]`. */
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/**
 * Modalidades de envío que se ofrecen (RF8): las no bloqueadas, por orden de alta. La ficha las
 * enseña con su plazo y su precio, y el checkout (A8) cobrará lo mismo porque lee la misma tabla.
 *
 * @returns Las modalidades de envío disponibles.
 */
export async function getShippingTypes() {
    return db
        .select()
        .from(shippingTypes)
        .where(eq(shippingTypes.isBlocked, false))
        .orderBy(asc(shippingTypes.id));
}

/** Parámetros del listado: página (desde 1) y productos por página. */
export interface CatalogPageParams {
    page: number;
    pageSize: number;
}

// Uniones del listado. Las comparten la consulta de productos y la del total, para que cuenten
// exactamente lo mismo. Solo cuentan las presentaciones a la venta (sin bloquear): el `innerJoin`
// deja fuera los productos que no tienen ninguna, igual que la ficha (`isProductPageAvailable`).
const joinWinery = eq(wineries.id, products.wineryId);
const joinOrigin = eq(guaranteesOfOrigin.id, products.guaranteeOfOriginId);
const joinSellableVariant = and(
    eq(productVariants.productId, products.id),
    eq(productVariants.isBlocked, false),
);

/**
 * Condición SQL de producto nuevo: dado de alta en los últimos `NEW_PRODUCT_DAYS` días. Usa la
 * hora de la BD (`NOW()`), la misma con la que se rellena `created_at`.
 *
 * @returns La condición, para usarla en un `where` o como columna calculada.
 */
export function isNewCondition(): SQL {
    return sql`${products.createdAt} >= DATE_SUB(NOW(), INTERVAL ${sql.raw(String(NEW_PRODUCT_DAYS))} DAY)`;
}

/** Columnas de una tarjeta de producto: las que comparten el listado y los favoritos. */
function catalogColumns() {
    return {
        id: products.id,
        slug: products.slug,
        name: products.name,
        image: products.image,
        vintage: products.vintage,
        /** Nombre de la D.O.: lo que la tarjeta pinta bajo el nombre. */
        originName: guaranteesOfOrigin.name,
        /** `true` si es nuevo (`isNewCondition`): la tarjeta lleva "¡NUEVO!". */
        isNew: isNewCondition().mapWith(Boolean),
        /** Precio más bajo entre sus presentaciones, para el "desde". Nunca es nulo: el `innerJoin` exige al menos una. */
        minPrice: min(productVariants.price) as SQL<string>,
        /** Número de presentaciones a la venta: con más de una, el precio lleva "Desde". */
        variantCount: count(productVariants.id),
        /** Stock sumado de todas sus presentaciones: 0 = agotado. */
        totalStock: sum(productVariants.stock).mapWith(Number),
    };
}

/** Columnas por las que se agrupa: todas las que se piden sin agregar, más `created_at` (la fecha de `isNew`). */
function catalogGroupBy() {
    return [
        products.id,
        products.slug,
        products.name,
        products.image,
        products.vintage,
        products.createdAt,
        guaranteesOfOrigin.name,
    ] as const;
}

/** Productos de tarjeta con sus uniones, sin condición ni agrupación: base del listado y de los favoritos. */
function catalogRowsQuery() {
    return db
        .select(catalogColumns())
        .from(products)
        .innerJoin(wineries, joinWinery)
        .innerJoin(guaranteesOfOrigin, joinOrigin)
        .innerJoin(productVariants, joinSellableVariant);
}

/**
 * Consulta de los productos de una página del listado, con sus datos agregados: precio mínimo,
 * número de presentaciones y stock total. Se separa de `getCatalogPage` para poder comprobar su
 * SQL sin conectar a la BD.
 *
 * Orden: el más reciente primero (`created_at`), y el id como desempate para que la paginación
 * sea estable cuando dos productos comparten fecha.
 *
 * El `groupBy` incluye todas las columnas que se piden sin agregar (no solo `products.id`): así
 * es válido con `ONLY_FULL_GROUP_BY` aunque el motor (MySQL o TiDB) no deduzca las dependencias
 * funcionales, y el resultado es el mismo.
 *
 * @param params - Página (desde 1) y productos por página.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function catalogItemsQuery({ page, pageSize }: CatalogPageParams) {
    const size = toPositiveInt(pageSize);
    return catalogRowsQuery()
        .where(visibleProductsCondition())
        .groupBy(...catalogGroupBy())
        .orderBy(desc(products.createdAt), desc(products.id))
        .limit(size)
        .offset((toPositiveInt(page) - 1) * size);
}

/**
 * Consulta del total de productos del listado, con las mismas uniones y condiciones que
 * `catalogItemsQuery` pero sin paginar. Alimenta la paginación.
 *
 * @returns La consulta, lista para ejecutar con `await`: una fila con `total`.
 */
export function catalogCountQuery() {
    return db
        .select({ total: countDistinct(products.id) })
        .from(products)
        .innerJoin(wineries, joinWinery)
        .innerJoin(guaranteesOfOrigin, joinOrigin)
        .innerJoin(productVariants, joinSellableVariant)
        .where(visibleProductsCondition());
}

/**
 * Una página del listado de productos (RF4): solo los visibles (`visibleProductsCondition`) y con
 * alguna presentación a la venta, del más reciente al más antiguo.
 *
 * @param params - Página (desde 1) y productos por página.
 * @returns `items` con los productos de la página y sus agregados, y `total` con todos los
 *   productos del listado, para calcular las páginas.
 *
 * @example
 * const { items, total } = await getCatalogPage({ page: 1, pageSize: 12 });
 */
export async function getCatalogPage(params: CatalogPageParams) {
    const [items, [{ total }]] = await Promise.all([
        catalogItemsQuery(params),
        catalogCountQuery(),
    ]);
    return { items, total };
}

/** Una página del listado: los productos con sus agregados y el total para paginar. */
export type CatalogPage = Awaited<ReturnType<typeof getCatalogPage>>;

/** Un producto del listado, con su precio mínimo, número de presentaciones y stock total. */
export type CatalogItem = CatalogPage['items'][number];

/**
 * Consulta de productos al azar para "Nuestros favoritos": los visibles y con alguna presentación
 * a la venta, solo los nuevos o solo los que no lo son. Mismas uniones y columnas que el listado.
 *
 * @param params.onlyNew - `true` para los nuevos; `false` para los que no lo son.
 * @param params.limit - Cuántos como máximo.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function featuredProductsQuery({ onlyNew, limit }: { onlyNew: boolean; limit: number }) {
    const novelty = onlyNew ? isNewCondition() : not(isNewCondition());
    return catalogRowsQuery()
        .where(and(visibleProductsCondition(), novelty) as SQL)
        .groupBy(...catalogGroupBy())
        .orderBy(sql`rand()`)
        .limit(toPositiveInt(limit));
}

/**
 * Productos para "Nuestros favoritos": al azar entre los nuevos y, si no llegan al número pedido,
 * completados al azar con el resto del catálogo. Los nuevos van primero. Cambia en cada llamada.
 *
 * @param params.limit - Cuántos como máximo (8 en la tienda).
 * @returns Hasta `limit` productos con el mismo formato que `getCatalogPage`.
 *
 * @example
 * const favorites = await getFeaturedProducts({ limit: 8 });
 */
export async function getFeaturedProducts({ limit }: { limit: number }) {
    const size = toPositiveInt(limit);
    const fresh = await featuredProductsQuery({ onlyNew: true, limit: size });
    if (fresh.length >= size) return fresh;
    const others = await featuredProductsQuery({ onlyNew: false, limit: size - fresh.length });
    return [...fresh, ...others];
}
