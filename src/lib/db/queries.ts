import {
    and,
    asc,
    count,
    desc,
    eq,
    exists,
    gte,
    inArray,
    isNotNull,
    lt,
    min,
    ne,
    not,
    notInArray,
    or,
    sql,
    sum,
    type SQL,
    type SQLWrapper,
} from 'drizzle-orm';
import type { MySqlSelect } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import type { Cart } from '@/lib/cart/cart';
import { orderLinesByVariantIds } from '@/lib/cart/lines';
import { NEW_PRODUCT_DAYS } from '@/lib/catalog/novelty';
import { toPositiveInt } from '@/lib/catalog/pagination';
import { priceRangeBounds } from '@/lib/catalog/price-range';
import { toVintageOptions, type CatalogFilterOptions } from '@/lib/catalog/filter-options';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';
import {
    DEFAULT_CATALOG_SORT,
    type CatalogFilters,
    type CatalogSort,
} from '@/lib/validations/catalog';
import {
    cartProducts,
    grapes,
    guaranteesOfOrigin,
    productGrapes,
    productVariants,
    products,
    shippingTypes,
    typologies,
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

/** Parámetros del listado: página (desde 1), productos por página, filtros y orden (RF5). */
export interface CatalogPageParams {
    page: number;
    pageSize: number;
    /** Búsqueda y filtros ya validados (`catalogSearchParamsSchema`). Sin ellos, el catálogo entero. */
    filters?: CatalogFilters;
    /** Criterio de orden ya validado. Por defecto, los más recientes primero. */
    orden?: CatalogSort;
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
 * `columna like patrón escape '!'`. Drizzle no deja declarar el `escape` en su `like()`, y no se
 * usa la barra por defecto para no depender del `sql_mode` (ver `LIKE_ESCAPE`).
 */
function likeEscaped(column: SQLWrapper, pattern: string): SQL {
    return sql`${column} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`;
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
 *   el nombre o la descripción. Los comodines de `like` que escriba la persona se escapan, y la
 *   consulta declara el carácter de escape (`escape '!'`) para no depender del `sql_mode`.
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
        pattern
            ? or(likeEscaped(products.name, pattern), likeEscaped(products.description, pattern))
            : undefined,
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
 * Cláusulas `order by` del listado para un criterio de `?orden=`. Todas terminan en el id del
 * producto como desempate: sin él, dos productos con el mismo precio, nombre o fecha podrían
 * cambiar de orden entre una consulta y otra y repetirse o saltarse al paginar.
 *
 * - `recientes`: `created_at` descendente (el más nuevo primero) y id descendente.
 * - `precio-asc` y `precio-desc`: el precio mínimo de sus presentaciones a la venta
 *   (`min(price)`, el mismo que enseña la tarjeta y que filtra `precio`) y id ascendente.
 * - `nombre`: A→Z según la collation de la columna y id ascendente.
 *
 * @param orden - Criterio ya validado; si no es ninguno de los conocidos, vale `recientes`.
 * @returns Las expresiones, en orden, para `orderBy(...catalogOrderBy(orden))`.
 *
 * @example
 * query.orderBy(...catalogOrderBy('precio-asc'));
 */
export function catalogOrderBy(orden: CatalogSort = DEFAULT_CATALOG_SORT): SQL[] {
    switch (orden) {
        case 'precio-asc':
            return [asc(min(productVariants.price)), asc(products.id)];
        case 'precio-desc':
            return [desc(min(productVariants.price)), asc(products.id)];
        case 'nombre':
            return [asc(products.name), asc(products.id)];
        default:
            return [desc(products.createdAt), desc(products.id)];
    }
}

/**
 * Consulta de los productos de una página del listado, con sus datos agregados: precio mínimo,
 * número de presentaciones y stock total. Se separa de `getCatalogPage` para poder comprobar su
 * SQL sin conectar a la BD.
 *
 * Filtra con `catalogConditions` y ordena con `catalogOrderBy`; el id va siempre como desempate
 * para que la paginación sea estable.
 *
 * El `groupBy` incluye todas las columnas que se piden sin agregar (no solo `products.id`): así
 * es válido con `ONLY_FULL_GROUP_BY` aunque el motor (MySQL o TiDB) no deduzca las dependencias
 * funcionales, y el resultado es el mismo.
 *
 * @param params - Página (desde 1), productos por página, filtros y orden.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function catalogItemsQuery({ page, pageSize, filters, orden }: CatalogPageParams) {
    const size = toPositiveInt(pageSize);
    const { where, having } = catalogConditions(filters);
    return catalogRowsQuery()
        .where(where)
        .groupBy(...catalogGroupBy())
        .having(having)
        .orderBy(...catalogOrderBy(orden))
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
 * con alguna presentación a la venta que cumplan la búsqueda y los filtros, en el orden pedido
 * (por defecto, del más reciente al más antiguo).
 *
 * @param params - Página (desde 1), productos por página, filtros y orden.
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
 * Deja la consulta de una lista de opciones con las mismas uniones y la misma regla que el
 * listado: bodega, D.O. y solo las presentaciones a la venta, más `visibleProductsCondition`. Así
 * una opción solo aparece si al elegirla el listado devuelve algún producto.
 *
 * Es genérica sobre la consulta en modo dinámico (`$dynamic()`) para no repetir las uniones en
 * cada lista.
 *
 * @param query - Consulta `from(products)` en modo dinámico.
 * @param extra - Condición adicional que se une a la de visibilidad con `and`.
 */
function withVisibleProducts<T extends MySqlSelect>(query: T, extra?: SQL) {
    return query
        .innerJoin(wineries, joinWinery)
        .innerJoin(guaranteesOfOrigin, joinOrigin)
        .innerJoin(productVariants, joinSellableVariant)
        .where(and(visibleProductsCondition(), extra));
}

/**
 * Las cinco consultas de las opciones de los selects, sin ejecutar. Se separan de
 * `getCatalogFilterOptions` para poder comprobar su SQL sin conectar a la BD.
 *
 * Todas son `select distinct` sobre los productos visibles (`withVisibleProducts`), así que solo
 * salen valores con al menos un producto visible y a la venta. Las uvas y las tipologías añaden su
 * `join` (con `product_grapes` y `grapes`, y con `typologies`): aquí solo se pide la lista, sin
 * agregados que un `join` multiplicaría, así que no hace falta un `exists`.
 *
 * El `order by` va siempre sobre columnas que están en el `select`, que `distinct` exige.
 *
 * @returns Una consulta por lista; `typologies` trae además `filterOrder` y `vintages` trae `year`.
 */
export function catalogFilterOptionsQueries() {
    return {
        origins: withVisibleProducts(
            db
                .selectDistinct({ id: guaranteesOfOrigin.id, name: guaranteesOfOrigin.name })
                .from(products)
                .$dynamic(),
        ).orderBy(asc(guaranteesOfOrigin.name), asc(guaranteesOfOrigin.id)),

        wineries: withVisibleProducts(
            db.selectDistinct({ id: wineries.id, name: wineries.name }).from(products).$dynamic(),
        ).orderBy(asc(wineries.name), asc(wineries.id)),

        grapes: withVisibleProducts(
            db
                .selectDistinct({ id: grapes.id, name: grapes.name })
                .from(products)
                .innerJoin(productGrapes, eq(productGrapes.productId, products.id))
                .innerJoin(grapes, eq(grapes.id, productGrapes.grapeId))
                .$dynamic(),
        ).orderBy(asc(grapes.name), asc(grapes.id)),

        typologies: withVisibleProducts(
            db
                .selectDistinct({
                    id: typologies.id,
                    name: typologies.name,
                    filterOrder: typologies.filterOrder,
                })
                .from(products)
                .innerJoin(typologies, eq(typologies.id, products.typologyId))
                .$dynamic(),
        ).orderBy(asc(typologies.filterOrder), asc(typologies.name), asc(typologies.id)),

        vintages: withVisibleProducts(
            db.selectDistinct({ year: products.vintage }).from(products).$dynamic(),
            isNotNull(products.vintage),
        ).orderBy(desc(products.vintage)),
    };
}

/**
 * Opciones de los selects de filtro del listado (RF5): denominaciones de origen, bodegas, uvas,
 * tipologías y añadas. Solo valores que tengan al menos un producto visible y a la venta, es
 * decir, los que al elegirlos no dejan el listado vacío. No dependen de los filtros activos.
 *
 * @returns Cada lista con `{ id, name }`: por nombre, salvo las tipologías (por `filter_order`)
 *   y las añadas (la más reciente primero; `id` es el año y `name` el año como texto).
 *
 * @example
 * const { origins, wineries, grapes, typologies, vintages } = await getCatalogFilterOptions();
 */
export async function getCatalogFilterOptions(): Promise<CatalogFilterOptions> {
    const queries = catalogFilterOptionsQueries();
    const [origins, wineryRows, grapeRows, typologyRows, vintageRows] = await Promise.all([
        queries.origins,
        queries.wineries,
        queries.grapes,
        queries.typologies,
        queries.vintages,
    ]);
    return {
        origins,
        wineries: wineryRows,
        grapes: grapeRows,
        typologies: typologyRows.map(({ id, name }) => ({ id, name })),
        vintages: toVintageOptions(vintageRows.map(({ year }) => year)),
    };
}

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

/** Columnas de una línea del carrito: la presentación con lo mínimo de su producto para pintarla. */
function cartLineColumns() {
    return {
        variantId: productVariants.id,
        productId: products.id,
        slug: products.slug,
        name: products.name,
        image: products.image,
        vintage: products.vintage,
        /** Nombre de la D.O.: el carrito lo pinta bajo el nombre, como la tarjeta del listado. */
        originName: guaranteesOfOrigin.name,
        /** Formato, capacidad y unidad: `formatPresentation` los convierte en "Botella 75 cl". */
        format: productVariants.format,
        capacity: productVariants.capacity,
        capacityUnit: productVariants.capacityUnit,
        /** Precio vigente, como texto (`decimal`): el carrito no guarda precios, se lee siempre de aquí. */
        price: productVariants.price,
        /** Unidades disponibles: 0 = agotada. El carrito limita sus cantidades a este número. */
        stock: productVariants.stock,
    };
}

/**
 * Consulta de las presentaciones que se pueden comprar de entre unos ids: sin bloquear ellas
 * (`product_variants.is_blocked`) y con la regla de visibilidad del catálogo
 * (`visibleProductsCondition`: ni su producto, ni su bodega, ni su D.O. bloqueados). Mismas
 * uniones que el listado.
 *
 * @param variantIds - Ids de presentaciones (`product_variants.variant_id`), sin repetir y no vacío.
 * @returns La consulta, lista para ejecutar con `await`; sin orden definido.
 */
export function cartLinesQuery(variantIds: readonly number[]) {
    return db
        .select(cartLineColumns())
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .innerJoin(wineries, joinWinery)
        .innerJoin(guaranteesOfOrigin, joinOrigin)
        .where(
            and(
                inArray(productVariants.id, [...variantIds]),
                eq(productVariants.isBlocked, false),
                visibleProductsCondition(),
            ) as SQL,
        );
}

/**
 * Líneas del carrito (RF6): para cada presentación pedida, su producto, su precio y su stock de
 * ahora. El carrito del cliente solo guarda ids y cantidades, así que el precio y el stock salen
 * siempre de aquí.
 *
 * Descarta lo que no se puede comprar (`cartLinesQuery`): presentaciones bloqueadas, de productos,
 * bodegas o D.O. bloqueados, o que no existen. Las agotadas sí vuelven, con `stock: 0`, para que
 * el carrito las marque como agotadas. Quien llama debe quitar de su carrito los ids que no
 * vuelvan.
 *
 * @param variantIds - Ids de presentaciones, en el orden del carrito. Los repetidos se juntan.
 * @returns Las líneas, en el orden de `variantIds`.
 *
 * @example
 * const lines = await getCartLines([4, 7]);
 * // [{ variantId: 4, name: 'Tinto Roble', format: 'Botella', price: '9.50', stock: 12, ... }]
 */
export async function getCartLines(variantIds: readonly number[]) {
    const ids = Array.from(new Set(variantIds));
    if (ids.length === 0) return [];
    return orderLinesByVariantIds(ids, await cartLinesQuery(ids));
}

/** Una línea del carrito con su producto, su precio y su stock actuales. */
export type CartLine = Awaited<ReturnType<typeof getCartLines>>[number];

/**
 * Consulta de las líneas guardadas del carrito de un usuario (`cart_products`), de la más antigua
 * a la más reciente: `added_at` y, de desempate, `variant_id`, para que el orden sea estable.
 * Se separa de `getUserCart` para poder comprobar su SQL sin conectar a la BD.
 *
 * @param userId - Id del usuario (`users.user_id`).
 * @returns La consulta, lista para ejecutar con `await`: filas `{ variantId, quantity }`.
 */
export function userCartQuery(userId: number) {
    return db
        .select({ variantId: cartProducts.variantId, quantity: cartProducts.quantity })
        .from(cartProducts)
        .where(eq(cartProducts.userId, userId))
        .orderBy(asc(cartProducts.addedAt), asc(cartProducts.variantId));
}

/**
 * Carrito guardado de un usuario (RF6), tal como está en `cart_products`: sin comprobar si las
 * presentaciones siguen a la venta ni si hay stock. Para eso, `getCartLines` o `mergeWithSaved`.
 *
 * @param userId - Id del usuario (`users.user_id`).
 * @returns Sus líneas `{ variantId, quantity }`, de la más antigua a la más reciente; vacío si no tiene carrito.
 *
 * @example
 * const saved = await getUserCart(12);
 * // [{ variantId: 4, quantity: 2 }, { variantId: 9, quantity: 1 }]
 */
export async function getUserCart(userId: number): Promise<Cart> {
    return userCartQuery(userId);
}

/**
 * Lo que necesitan las consultas de escritura del carrito: `insert` y `delete` del cliente de BD
 * o de una transacción (`db.transaction`). Así se construyen con el ejecutor que toque y se
 * pueden comprobar sin conectar.
 */
type CartWriter = Pick<typeof db, 'insert' | 'delete'>;

/**
 * Consulta que guarda las líneas de un carrito: un solo `insert` con todas, que si la línea ya
 * existe (clave `(user_id, variant_id)`) solo le cambia la cantidad (`on duplicate key update
 * quantity = values(quantity)`). Así `added_at` de las que ya estaban se conserva, y el orden del
 * carrito con él. `values()` es válido en MySQL y en TiDB.
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param userId - Id del usuario (`users.user_id`).
 * @param items - Líneas a guardar; no puede estar vacío (un `insert` sin filas no es SQL válido).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function upsertCartItemsQuery(writer: CartWriter, userId: number, items: Cart) {
    return writer
        .insert(cartProducts)
        .values(items.map(({ variantId, quantity }) => ({ userId, variantId, quantity })))
        .onDuplicateKeyUpdate({
            // Sin tabla (`values(quantity)`), la forma canónica en MySQL y TiDB: con la columna
            // dentro de `sql`, Drizzle escribiría `values(cart_products.quantity)`.
            set: { quantity: sql`values(${sql.identifier(cartProducts.quantity.name)})` },
        });
}

/**
 * Consulta que borra las líneas guardadas de un usuario que ya no están en su carrito. Con
 * `items` vacío borra todas, sin `not in ()` (SQL inválido con la lista vacía).
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param userId - Id del usuario (`users.user_id`).
 * @param items - El carrito que debe quedar; solo importan sus `variantId`.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function deleteMissingCartItemsQuery(writer: CartWriter, userId: number, items: Cart) {
    const keep = Array.from(new Set(items.map(({ variantId }) => variantId)));
    return writer
        .delete(cartProducts)
        .where(
            and(
                eq(cartProducts.userId, userId),
                keep.length > 0 ? notInArray(cartProducts.variantId, keep) : undefined,
            ),
        );
}

/**
 * Reemplaza el carrito guardado de un usuario por `items` (RF6), en una sola transacción: guarda
 * cada línea (las que ya estaban solo cambian de cantidad y conservan `added_at`) y borra las que
 * ya no están. Si algo falla no cambia nada: el carrito guardado queda como estaba. Con `items`
 * vacío, borra el carrito.
 *
 * El llamador debe haber saneado `items`: presentaciones que existan, se puedan comprar y con
 * cantidades dentro del stock (`normalizeCart` en `src/lib/cart/server.ts`). Aquí no se comprueba:
 * la clave foránea `fk_cartproduct_variant` rechaza los ids que no existen (la transacción falla y
 * no se guarda nada), pero no el stock ni el bloqueo.
 *
 * @param userId - Id del usuario (`users.user_id`).
 * @param items - El carrito que debe quedar guardado: sin presentaciones repetidas y con cantidades >= 1.
 *
 * @example
 * await saveUserCart(12, [{ variantId: 4, quantity: 3 }]);
 * // deja en `cart_products` solo la 4 (con 3 unidades) y borra el resto de líneas del usuario 12
 */
export async function saveUserCart(userId: number, items: Cart): Promise<void> {
    await db.transaction(async (tx) => {
        if (items.length > 0) await upsertCartItemsQuery(tx, userId, items);
        await deleteMissingCartItemsQuery(tx, userId, items);
    });
}
