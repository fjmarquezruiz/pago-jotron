import {
    and,
    asc,
    count,
    desc,
    eq,
    exists,
    gte,
    like,
    lt,
    min,
    ne,
    not,
    or,
    sql,
    sum,
    type SQL,
} from 'drizzle-orm';
import { db } from '@/db';
import { NEW_PRODUCT_DAYS } from '@/lib/catalog/novelty';
import { toPositiveInt } from '@/lib/catalog/pagination';
import { priceRangeBounds } from '@/lib/catalog/price-range';
import { searchPattern } from '@/lib/catalog/search';
import type { CatalogFilters } from '@/lib/validations/catalog';
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

/** Parámetros del listado: página (desde 1), productos por página y filtros (RF5). */
export interface CatalogPageParams {
    page: number;
    pageSize: number;
    /** Búsqueda y filtros ya validados (`catalogSearchParamsSchema`). Sin ellos, el catálogo entero. */
    filters?: CatalogFilters;
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

/** Condiciones SQL del listado: las que van en `where` y la que va en `having`. */
export interface CatalogConditions {
    where: SQL;
    having: SQL | undefined;
}

/**
 * Las condiciones del listado en un solo sitio (RF4, RF5): la consulta de productos y la del total
 * las usan tal cual, así no pueden contar cosas distintas.
 *
 * `where` lleva la regla de visibilidad (`visibleProductsCondition`) y los filtros que se evalúan
 * por fila de producto, todos unidos con `and`:
 * - `q`: `like` sin distinguir mayúsculas ni acentos (lo hace la collation de las columnas) sobre
 *   el nombre o la descripción. Los comodines de `like` que escriba la persona se escapan.
 * - `do`, `bodega`, `tipologia` y `anada`: igualdad con `guarantee_of_origin_id`, `winery_id`,
 *   `typology_id` y `vintage`.
 * - `uva`: `exists` sobre `product_grapes`, en vez de otro `join`, que repetiría el producto
 *   (y su precio y su stock) una vez por cada uva.
 *
 * `having` lleva `precio` porque se mide sobre un agregado: el precio mínimo de las presentaciones
 * a la venta, el mismo que enseña la tarjeta ("Desde X €"). No existe sin `group by`.
 *
 * @param filters - Filtros ya validados; vacío o sin campos = ningún filtro.
 * @returns `where`, y `having` solo si hay filtro de precio.
 *
 * @example
 * const { where, having } = catalogConditions({ tipologia: 1, precio: '10-15' });
 */
export function catalogConditions(filters: CatalogFilters = {}): CatalogConditions {
    const { q, do: guaranteeOfOriginId, bodega, uva, tipologia, precio, anada } = filters;

    const pattern = searchPattern(q);
    const conditions: (SQL | undefined)[] = [
        visibleProductsCondition(),
        pattern ? or(like(products.name, pattern), like(products.description, pattern)) : undefined,
        guaranteeOfOriginId === undefined
            ? undefined
            : eq(products.guaranteeOfOriginId, guaranteeOfOriginId),
        bodega === undefined ? undefined : eq(products.wineryId, bodega),
        tipologia === undefined ? undefined : eq(products.typologyId, tipologia),
        anada === undefined ? undefined : eq(products.vintage, anada),
        uva === undefined
            ? undefined
            : exists(
                  db
                      .select({ one: sql`1` })
                      .from(productGrapes)
                      .where(
                          and(
                              eq(productGrapes.productId, products.id),
                              eq(productGrapes.grapeId, uva),
                          ),
                      ),
              ),
    ];

    const { from, to } = precio ? priceRangeBounds(precio) : {};
    const minPrice = min(productVariants.price);
    const having = and(
        from === undefined ? undefined : gte(minPrice, from),
        to === undefined ? undefined : lt(minPrice, to),
    );

    return { where: and(...conditions) as SQL, having };
}

/**
 * Consulta de los productos de una página del listado, con sus datos agregados: precio mínimo,
 * número de presentaciones y stock total. Se separa de `getCatalogPage` para poder comprobar su
 * SQL sin conectar a la BD.
 *
 * Filtra con `catalogConditions`. Orden: el más reciente primero (`created_at`), y el id como
 * desempate para que la paginación sea estable cuando dos productos comparten fecha.
 *
 * El `groupBy` incluye todas las columnas que se piden sin agregar (no solo `products.id`): así
 * es válido con `ONLY_FULL_GROUP_BY` aunque el motor (MySQL o TiDB) no deduzca las dependencias
 * funcionales, y el resultado es el mismo.
 *
 * @param params - Página (desde 1), productos por página y filtros.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function catalogItemsQuery({ page, pageSize, filters }: CatalogPageParams) {
    const size = toPositiveInt(pageSize);
    const { where, having } = catalogConditions(filters);
    return catalogRowsQuery()
        .where(where)
        .groupBy(...catalogGroupBy())
        .having(having)
        .orderBy(desc(products.createdAt), desc(products.id))
        .limit(size)
        .offset((toPositiveInt(page) - 1) * size);
}

/**
 * Consulta del total de productos del listado, con las mismas uniones y condiciones
 * (`catalogConditions`) que `catalogItemsQuery` pero sin paginar. Alimenta la paginación.
 *
 * Cuenta las filas de una subconsulta agrupada por producto, no los productos con `count(distinct)`:
 * el filtro de precio es un `having` sobre el precio mínimo y solo existe tras agrupar.
 *
 * @param filters - Búsqueda y filtros; los mismos que se pasan a `catalogItemsQuery`.
 * @returns La consulta, lista para ejecutar con `await`: una fila con `total`.
 */
export function catalogCountQuery(filters?: CatalogFilters) {
    const { where, having } = catalogConditions(filters);
    const matching = db
        .select({ id: products.id })
        .from(products)
        .innerJoin(wineries, joinWinery)
        .innerJoin(guaranteesOfOrigin, joinOrigin)
        .innerJoin(productVariants, joinSellableVariant)
        .where(where)
        .groupBy(products.id)
        .having(having)
        .as('matching');
    return db.select({ total: count() }).from(matching);
}

/**
 * Una página del listado de productos (RF4, RF5): solo los visibles (`visibleProductsCondition`) y
 * con alguna presentación a la venta que cumplan la búsqueda y los filtros, del más reciente al
 * más antiguo.
 *
 * @param params - Página (desde 1), productos por página y filtros.
 * @returns `items` con los productos de la página y sus agregados, y `total` con todos los
 *   productos que cumplen los filtros, para calcular las páginas.
 *
 * @example
 * const { items, total } = await getCatalogPage({ page: 1, pageSize: 12, filters: { tipologia: 1 } });
 */
export async function getCatalogPage(params: CatalogPageParams) {
    const [items, [{ total }]] = await Promise.all([
        catalogItemsQuery(params),
        catalogCountQuery(params.filters),
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

/** Producto de la ficha respecto al que se buscan recomendados. */
export interface RelatedProductsParams {
    /** Id del producto de la ficha: no se recomienda a sí mismo. */
    productId: number;
    wineryId: number;
    typologyId: number;
    /** Cuántos como máximo (4 en la tienda). */
    limit: number;
}

/**
 * Consulta de recomendados de una ficha: productos visibles y con alguna presentación a la venta
 * (mismas uniones y condiciones que el listado), sin el propio producto, ordenados por afinidad y
 * al azar dentro de cada nivel de afinidad:
 *
 * 1. De la misma bodega.
 * 2. De la misma tipología (Tinto, Dulce, Pasa moscatel…), de otra bodega.
 * 3. El resto del catálogo.
 *
 * Con `limit` en una sola consulta, los niveles se rellenan por orden: si la bodega no llega al
 * número pedido, se completa con su tipología y después con el resto.
 *
 * @param params - El producto de la ficha y cuántos recomendados.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function relatedProductsQuery({
    productId,
    wineryId,
    typologyId,
    limit,
}: RelatedProductsParams) {
    const affinity = sql`case when ${products.wineryId} = ${wineryId} then 2 when ${products.typologyId} = ${typologyId} then 1 else 0 end`;
    return catalogRowsQuery()
        .where(and(visibleProductsCondition(), ne(products.id, productId)) as SQL)
        .groupBy(...catalogGroupBy(), products.wineryId, products.typologyId)
        .orderBy(desc(affinity), sql`rand()`)
        .limit(toPositiveInt(limit));
}

/**
 * Productos de "También te puede gustar" de una ficha: al azar entre los de la misma bodega y,
 * si no hay suficientes, completados con los de la misma tipología y después con el resto del
 * catálogo. Nunca incluye el propio producto. Cambia en cada llamada.
 *
 * @param params - El producto de la ficha y cuántos recomendados.
 * @returns Hasta `limit` productos con el mismo formato que `getCatalogPage`.
 *
 * @example
 * const related = await getRelatedProducts({ productId: 3, wineryId: 1, typologyId: 2, limit: 4 });
 */
export async function getRelatedProducts(params: RelatedProductsParams) {
    return relatedProductsQuery(params);
}
