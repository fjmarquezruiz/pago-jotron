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
import { alias, type MySqlSelect } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import type { InvoiceSource } from '@/lib/invoices/build';
import type { InvoiceDocument } from '@/lib/invoices/types';
import type { Cart } from '@/lib/cart/cart';
import { orderLinesByVariantIds } from '@/lib/cart/lines';
import { NEW_PRODUCT_DAYS } from '@/lib/catalog/novelty';
import { toPositiveInt } from '@/lib/catalog/pagination';
import { priceRangeBounds } from '@/lib/catalog/price-range';
import { toVintageOptions, type CatalogFilterOptions } from '@/lib/catalog/filter-options';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';
import type { AddressInput } from '@/lib/validations/address';
import type { ProfileInput } from '@/lib/validations/profile';
import {
    DEFAULT_CATALOG_SORT,
    type CatalogFilters,
    type CatalogSort,
} from '@/lib/validations/catalog';
import {
    addresses,
    auditLogs,
    cancellationTypes,
    cartProducts,
    grapes,
    guaranteesOfOrigin,
    invoices,
    invoiceSeries,
    orderProducts,
    orderStatuses,
    orders,
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

/**
 * Una modalidad de envío por su id, solo si se ofrece (no bloqueada): el checkout cobra el coste
 * que dice la BD, nunca uno que mande el navegador.
 *
 * @param id - `shipping_types.shipping_type_id`.
 * @returns La modalidad, o `null` si no existe o está bloqueada.
 */
export async function getShippingTypeById(id: number) {
    const [row] = await db
        .select()
        .from(shippingTypes)
        .where(and(eq(shippingTypes.id, id), eq(shippingTypes.isBlocked, false)));
    return row ?? null;
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
        /**
         * Id de la presentación si el producto solo tiene una (`variantCount` 1): es la que añade el
         * botón "Añadir" de la tarjeta. Con varias es la de menor id y no se usa: hay que elegir.
         */
        firstVariantId: min(productVariants.id) as SQL<number>,
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
        /** IVA en % de la tipología del producto (`typologies.tax_rate`, `'21.00'`): lo usa el presupuesto del pedido. */
        taxRate: typologies.taxRate,
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
        .innerJoin(typologies, eq(typologies.id, products.typologyId))
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
 *   Ojo con el orden: `added_at` tiene precisión de segundos, así que las líneas que se guardan a
 *   la vez (una fusión, un carrito entero) comparten fecha y salen ordenadas por `variantId`, no
 *   por el orden en que estaban en el carrito del navegador. El carrito puede reordenarse al
 *   recuperarlo en otro dispositivo; no cambia ninguna cantidad. Guardar el orden exigiría una
 *   columna `position` en `cart_products`.
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

/** Columnas de una dirección que se devuelven al cliente: todas menos `user_id` y `is_active`. */
function addressColumns() {
    return {
        id: addresses.id,
        recipientName: addresses.recipientName,
        phone: addresses.phone,
        streetType: addresses.streetType,
        streetName: addresses.streetName,
        number: addresses.number,
        floor: addresses.floor,
        postalCode: addresses.postalCode,
        city: addresses.city,
        province: addresses.province,
        country: addresses.country,
        addressType: addresses.addressType,
    };
}

/**
 * Consulta de las direcciones vigentes de un usuario (`is_active = true`), de la más antigua a la
 * más reciente. Las sustituidas (`is_active = false`) siguen en la BD, porque un pedido antiguo
 * apunta a ellas, pero no se ofrecen. Se separa de `getUserAddresses` para poder comprobar su SQL
 * sin conectar a la BD.
 *
 * @param userId - Id del usuario (`users.user_id`).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function userAddressesQuery(userId: number) {
    return db
        .select(addressColumns())
        .from(addresses)
        .where(and(eq(addresses.userId, userId), eq(addresses.isActive, true)))
        .orderBy(asc(addresses.id));
}

/**
 * Direcciones vigentes de un usuario (RF3, RF7).
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @returns Sus direcciones, de la más antigua a la más reciente; vacío si no tiene ninguna.
 *
 * @example
 * const list = await getUserAddresses(12);
 * // [{ id: 3, recipientName: 'Ana García', streetType: 'Calle', ... }]
 */
export async function getUserAddresses(userId: number) {
    return userAddressesQuery(userId);
}

/** Una dirección vigente tal como se devuelve al cliente. */
export type UserAddress = Awaited<ReturnType<typeof getUserAddresses>>[number];

/**
 * Crea una dirección del usuario (RF3, RF7). Con `replaces`, la dirección anterior pasa a
 * `is_active = false` en la misma transacción: una dirección no se modifica, porque un pedido
 * antiguo apunta a ella y su dirección no puede cambiar. Si `replaces` no es una dirección
 * vigente de este usuario, no se crea nada.
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @param input - Los datos ya validados (`addressSchema`).
 * @param replaces - Id de la dirección vigente a la que sustituye, si se está editando.
 * @returns La dirección creada, o `null` si `replaces` no existe, es de otro usuario o ya estaba
 *   sustituida.
 *
 * @example
 * const created = await createUserAddress(12, input, 3); // sustituye a la 3
 */
export async function createUserAddress(
    userId: number,
    input: AddressInput,
    replaces?: number,
): Promise<UserAddress | null> {
    return db.transaction(async (tx) => {
        if (replaces !== undefined) {
            const [result] = await tx
                .update(addresses)
                .set({ isActive: false })
                .where(
                    and(
                        eq(addresses.id, replaces),
                        eq(addresses.userId, userId),
                        eq(addresses.isActive, true),
                    ),
                );
            if (result.affectedRows === 0) return null;
        }

        const [{ insertId }] = await tx.insert(addresses).values({ ...input, userId });
        const [created] = await tx
            .select(addressColumns())
            .from(addresses)
            .where(eq(addresses.id, insertId));
        return created;
    });
}

/**
 * Una dirección vigente de un usuario por su id. Filtra por usuario: la dirección de otra cuenta
 * no se devuelve aunque exista.
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @param addressId - `addresses.address_id`.
 * @returns La dirección, o `null` si no existe, es de otro usuario o ya fue sustituida.
 */
export async function getUserAddress(
    userId: number,
    addressId: number,
): Promise<UserAddress | null> {
    const [row] = await db
        .select(addressColumns())
        .from(addresses)
        .where(
            and(
                eq(addresses.id, addressId),
                eq(addresses.userId, userId),
                eq(addresses.isActive, true),
            ),
        );
    return row ?? null;
}

/** Columnas del perfil de contacto de una cuenta: nunca la contraseña, el rol ni la fecha de nacimiento. */
function profileColumns() {
    return {
        name: users.name,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        idCard: users.idCard,
    };
}

/**
 * Consulta del perfil de contacto de un usuario. Se separa de `getUserProfile` para poder
 * comprobar su SQL sin conectar a la BD.
 *
 * @param userId - Id del usuario (`users.user_id`).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function userProfileQuery(userId: number) {
    return db.select(profileColumns()).from(users).where(eq(users.id, userId));
}

/**
 * Perfil de contacto de una cuenta (RF3): nombre, apellidos, correo, teléfono y NIF. Los datos
 * que no se han rellenado salen como `null`.
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @returns El perfil, o `null` si la cuenta ya no existe.
 */
export async function getUserProfile(userId: number) {
    const [row] = await userProfileQuery(userId);
    return row ?? null;
}

/** El perfil de contacto de una cuenta tal como se devuelve al cliente. */
export type UserProfile = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;

/**
 * Consulta que actualiza los datos de contacto de un usuario. No toca el correo: no se puede
 * cambiar desde el perfil.
 *
 * @param userId - Id del usuario (`users.user_id`).
 * @param input - Los datos ya validados (`profileSchema`).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function updateUserProfileQuery(userId: number, input: ProfileInput) {
    return db
        .update(users)
        .set({
            name: input.name,
            lastName: input.lastName,
            phone: input.phone,
            idCard: input.idCard,
        })
        .where(eq(users.id, userId));
}

/**
 * Guarda los datos de contacto de una cuenta (RF3) y devuelve el perfil resultante.
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @param input - Los datos ya validados (`profileSchema`).
 * @returns El perfil guardado, o `null` si la cuenta no existe.
 * @throws El error de MySQL `ER_DUP_ENTRY` si el NIF ya es de otra cuenta (`isDuplicateEntryError`).
 */
export async function updateUserProfile(userId: number, input: ProfileInput) {
    await updateUserProfileQuery(userId, input);
    // Se relee en vez de fiarse de `affectedRows`: MySQL cuenta 0 filas si los datos no cambian.
    return getUserProfile(userId);
}

/**
 * Lo que necesitan las consultas del pedido: el cliente de BD o una transacción
 * (`db.transaction`), para construirlas con el ejecutor que toque.
 */
type OrderWriter = Pick<typeof db, 'insert' | 'delete' | 'update'>;

/**
 * Consulta de un pedido por el PaymentIntent con el que se pagó (`orders.payment_intent_id`,
 * único): sirve para no duplicar un pedido si la confirmación llega dos veces.
 *
 * @param paymentIntentId - Id del PaymentIntent (`pi_…`).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function orderByPaymentIntentQuery(paymentIntentId: string) {
    return db
        .select({
            id: orders.id,
            userId: orders.userId,
            status: orderStatuses.name,
            paymentMethod: orders.paymentMethod,
        })
        .from(orders)
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .where(eq(orders.paymentIntentId, paymentIntentId));
}

/**
 * Pedido ya creado para un PaymentIntent.
 *
 * @param paymentIntentId - Id del PaymentIntent (`pi_…`).
 * @returns `{ id, userId, status, paymentMethod }`, o `null` si no hay pedido con ese pago.
 */
export async function getOrderByPaymentIntent(paymentIntentId: string) {
    const [row] = await orderByPaymentIntentQuery(paymentIntentId);
    return row ?? null;
}

/**
 * Id de un estado de pedido por su nombre (`order_statuses.name`, sembrado: 'Confirmado',
 * 'Pendiente de pago'…).
 *
 * @param name - Nombre del estado.
 * @returns El `status_id`, o `null` si no existe.
 */
export async function getOrderStatusId(name: string): Promise<number | null> {
    const [row] = await db
        .select({ id: orderStatuses.id })
        .from(orderStatuses)
        .where(eq(orderStatuses.name, name));
    return row?.id ?? null;
}

/**
 * Consulta que descuenta stock de forma atómica: `stock = stock - cantidad` solo si quedan
 * unidades suficientes (`stock >= cantidad`). Si otro cliente compró entre medias, no cambia
 * ninguna fila (`affectedRows = 0`) y el stock nunca queda negativo.
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param variantId - `product_variants.variant_id`.
 * @param quantity - Unidades a descontar (entero >= 1).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function decrementStockQuery(writer: OrderWriter, variantId: number, quantity: number) {
    return writer
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${quantity}` })
        .where(and(eq(productVariants.id, variantId), gte(productVariants.stock, quantity)));
}

/**
 * Consulta que devuelve al stock las unidades de una línea de un pedido que se anula: `stock =
 * stock + cantidad`. Es la inversa de `decrementStockQuery` y no necesita comprobar nada: sumar
 * nunca deja el stock negativo.
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param variantId - `product_variants.variant_id`.
 * @param quantity - Unidades a devolver (entero >= 1).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function restoreStockQuery(writer: OrderWriter, variantId: number, quantity: number) {
    return writer
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${quantity}` })
        .where(eq(productVariants.id, variantId));
}

/** Columnas de `orders` que pueden cambiar a la vez que el estado (anulación, desbloqueo). */
export interface OrderStatusExtras {
    cancelledBy?: 'Cliente' | 'Administrador';
    cancellationTypeId?: number;
    /** `null` borra el estado de origen de un bloqueo (al salir de Bloqueado). */
    blockedFromStatusId?: number | null;
}

/**
 * Consulta que marca un pedido con un estado nuevo (`status_id` y `status_updated_at`). Se usa
 * para anularlo cuando falla el cobro de la tarjeta y en todos los cambios de estado. Solo cambia
 * el pedido que está en `fromStatusId`: si otro proceso ya lo movió a otro estado, no pisa ese
 * cambio (`affectedRows = 0`).
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param orderId - `orders.order_id`.
 * @param fromStatusId - Estado en el que debe estar ahora.
 * @param toStatusId - Estado al que pasa.
 * @param extras - Otras columnas que cambian en el mismo `UPDATE` (quién anula y por qué, o el
 * estado de origen de un bloqueo).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function changeOrderStatusQuery(
    writer: OrderWriter,
    orderId: number,
    fromStatusId: number,
    toStatusId: number,
    extras: OrderStatusExtras = {},
) {
    return writer
        .update(orders)
        .set({ statusId: toStatusId, statusUpdatedAt: sql`CURRENT_TIMESTAMP`, ...extras })
        .where(and(eq(orders.id, orderId), eq(orders.statusId, fromStatusId)));
}

/**
 * Estados de pedido sembrados, por nombre: lo que hace falta para pasar del nombre al id y al
 * revés en una sola consulta.
 *
 * @returns Los pares `{ id, name }` de `order_statuses`.
 */
export async function getOrderStatuses() {
    return db.select({ id: orderStatuses.id, name: orderStatuses.name }).from(orderStatuses);
}

/**
 * Lo necesario de un pedido para cambiarle el estado, sin filtrar por cuenta: quien llama decide
 * si es el dueño (cliente) o tiene el rol (administración).
 *
 * @param orderId - `orders.order_id`.
 * @returns El pedido, o `null` si no existe.
 */
export async function getOrderForStatusChange(orderId: number) {
    const [row] = await db
        .select({
            id: orders.id,
            userId: orders.userId,
            statusId: orders.statusId,
            paymentMethod: orders.paymentMethod,
            paymentIntentId: orders.paymentIntentId,
            createdAt: orders.createdAt,
            statusUpdatedAt: orders.statusUpdatedAt,
            blockedFromStatusId: orders.blockedFromStatusId,
        })
        .from(orders)
        .where(eq(orders.id, orderId));
    return row ?? null;
}

/**
 * Consulta de las unidades de cada presentación de un pedido, por orden de presentación: lo que
 * se devuelve al stock al anularlo. Se lee con el mismo cliente que escribe (la transacción).
 *
 * @param reader - El cliente de BD o la transacción en la que se ejecuta.
 * @param orderId - `orders.order_id`.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function orderStockLinesQuery(reader: Pick<typeof db, 'select'>, orderId: number) {
    return reader
        .select({ variantId: orderProducts.variantId, quantity: orderProducts.quantity })
        .from(orderProducts)
        .where(eq(orderProducts.orderId, orderId))
        .orderBy(asc(orderProducts.variantId));
}

/**
 * Id de un motivo de cancelación por su descripción: no depende del orden del seed.
 *
 * @param description - Texto exacto de `cancellation_types.description`.
 * @returns El id, o `null` si no existe.
 */
export async function getCancellationTypeIdByDescription(
    description: string,
): Promise<number | null> {
    const [row] = await db
        .select({ id: cancellationTypes.id })
        .from(cancellationTypes)
        .where(eq(cancellationTypes.description, description));
    return row?.id ?? null;
}

/**
 * Indica si existe un motivo de cancelación.
 *
 * @param id - `cancellation_types.cancellation_type_id`.
 * @returns `true` si existe.
 */
export async function cancellationTypeExists(id: number): Promise<boolean> {
    const [row] = await db
        .select({ id: cancellationTypes.id })
        .from(cancellationTypes)
        .where(eq(cancellationTypes.id, id));
    return row !== undefined;
}

/**
 * Consulta que anota una acción en la auditoría (`audit_logs`, RF12): es lo que hace que un
 * fallo que no ve el cliente, como un pedido anulado por no poder cobrarlo, lo vea quien
 * administra la tienda.
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param entry - Usuario afectado (o `null`), qué pasó y el detalle para localizarlo.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function insertAuditLogQuery(
    writer: OrderWriter,
    entry: { userId: number | null; action: string; details: string },
) {
    return writer.insert(auditLogs).values(entry);
}

/** Lo que se guarda de un pedido al crearlo: los importes ya van como texto decimal (`'33.45'`). */
export interface NewOrder {
    userId: number;
    shippingAddressId: number;
    billingAddressId: number;
    paymentMethod: 'Tarjeta' | 'Transferencia';
    shippingTypeId: number;
    shippingCost: string;
    total: string;
    statusId: number;
    paymentIntentId: string | null;
}

/**
 * Consulta que inserta un pedido.
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param order - Los datos del pedido.
 * @returns La consulta, lista para ejecutar con `await`; su resultado trae el `insertId`.
 */
export function insertOrderQuery(writer: OrderWriter, order: NewOrder) {
    return writer.insert(orders).values(order);
}

/** Una línea de pedido: el precio y el IVA van fijados tal como estaban al comprar. */
export interface NewOrderLine {
    variantId: number;
    quantity: number;
    unitPrice: string;
    taxRate: string;
}

/**
 * Consulta que inserta las líneas de un pedido (un solo `insert`); no puede estar vacío.
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param orderId - `orders.order_id`.
 * @param lines - Las líneas, con precio e IVA del momento de la compra.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function insertOrderLinesQuery(
    writer: OrderWriter,
    orderId: number,
    lines: readonly NewOrderLine[],
) {
    return writer.insert(orderProducts).values(lines.map((line) => ({ orderId, ...line })));
}

/**
 * Consulta que vacía el carrito guardado de un usuario (`cart_products`).
 *
 * @param writer - El cliente de BD o la transacción en la que se ejecuta.
 * @param userId - Id del usuario (`users.user_id`).
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function clearUserCartQuery(writer: OrderWriter, userId: number) {
    return writer.delete(cartProducts).where(eq(cartProducts.userId, userId));
}

/** Cliente de BD o transacción con lo que necesita la emisión de una factura. */
export type InvoiceTx = Pick<typeof db, 'select' | 'insert' | 'update'>;

/**
 * Reserva el siguiente número de factura del año (RF8). Tiene que llamarse DENTRO de la transacción
 * que emite la factura: crea la fila del año si no existe, la bloquea con `SELECT … FOR UPDATE`
 * (dos emisiones a la vez se esperan una a otra), le suma 1 y devuelve el nuevo valor. Si la
 * transacción se deshace, el contador también, así que la numeración no deja huecos (un
 * `AUTO_INCREMENT` sí los deja).
 *
 * @param tx - La transacción en la que se emite la factura.
 * @param year - Año de la serie (el de la fecha de expedición, hora de Madrid).
 * @returns El número de orden dentro del año, empezando en 1.
 */
export async function reserveInvoiceSequence(tx: InvoiceTx, year: number): Promise<number> {
    await tx.insert(invoiceSeries).values({ year, lastNumber: 0 }).onDuplicateKeyUpdate({
        set: { year },
    });
    const [row] = await tx
        .select({ lastNumber: invoiceSeries.lastNumber })
        .from(invoiceSeries)
        .where(eq(invoiceSeries.year, year))
        .for('update');
    const next = row.lastNumber + 1;
    await tx.update(invoiceSeries).set({ lastNumber: next }).where(eq(invoiceSeries.year, year));
    return next;
}

/** Lo que se guarda al emitir una factura. Los importes van como texto decimal (`'33.45'`). */
export interface NewInvoice {
    orderId: number;
    number: string;
    /** `datetime` de la BD (UTC): la misma fecha que lleva el documento. */
    issueDate: string;
    taxBase: string;
    taxAmount: string;
    total: string;
    kind: 'Completa' | 'Simplificada';
    snapshot: InvoiceDocument;
}

/**
 * Consulta que inserta una factura. `invoices.order_id` es único: un pedido no puede tener dos.
 *
 * @param writer - La transacción en la que se emite.
 * @param invoice - La factura.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function insertInvoiceQuery(writer: InvoiceTx, invoice: NewInvoice) {
    return writer.insert(invoices).values(invoice);
}

/**
 * Lo necesario para emitir la factura de un pedido: el cliente (nombre y NIF), la dirección de
 * facturación, el envío y las líneas con el precio y el IVA guardados en el pedido.
 *
 * @param orderId - `orders.order_id`.
 * @returns La fuente de la factura, o `null` si el pedido no existe.
 */
export async function getInvoiceSource(orderId: number): Promise<InvoiceSource | null> {
    const [row] = await db
        .select({
            orderId: orders.id,
            name: users.name,
            lastName: users.lastName,
            idCard: users.idCard,
            shippingCost: orders.shippingCost,
            shippingName: shippingTypes.name,
            billingRecipientName: addresses.recipientName,
            streetType: addresses.streetType,
            streetName: addresses.streetName,
            number: addresses.number,
            floor: addresses.floor,
            postalCode: addresses.postalCode,
            city: addresses.city,
            province: addresses.province,
            country: addresses.country,
            hasBilling: orders.billingAddressId,
        })
        .from(orders)
        .innerJoin(users, eq(users.id, orders.userId))
        .innerJoin(shippingTypes, eq(shippingTypes.id, orders.shippingTypeId))
        .leftJoin(addresses, eq(addresses.id, orders.billingAddressId))
        .where(eq(orders.id, orderId));
    if (!row) return null;

    const lines = await orderLinesQuery(orderId);
    return {
        orderId: row.orderId,
        user: { name: row.name, lastName: row.lastName, idCard: row.idCard },
        billingAddress:
            row.hasBilling === null
                ? null
                : {
                      recipientName: row.billingRecipientName,
                      streetType: row.streetType,
                      streetName: row.streetName,
                      number: row.number,
                      floor: row.floor,
                      postalCode: row.postalCode,
                      city: row.city,
                      province: row.province,
                      country: row.country,
                  },
        shippingCost: row.shippingCost,
        shippingName: row.shippingName,
        lines: lines.map(
            ({ name, vintage, format, capacity, capacityUnit, quantity, unitPrice, taxRate }) => ({
                name,
                vintage,
                format,
                capacity,
                capacityUnit,
                quantity,
                unitPrice,
                taxRate,
            }),
        ),
    };
}

/**
 * La factura de un pedido de un usuario, con el estado del pedido: para descargarla (CU8). Filtra
 * por usuario: la factura de otra cuenta no se devuelve aunque exista.
 *
 * @param userId - Id del usuario, el de la sesión.
 * @param orderId - `orders.order_id`.
 * @returns El estado del pedido y el documento congelado al emitir la factura, o `null` si el
 * pedido no existe, es de otra cuenta o aún no tiene factura.
 */
export async function getUserInvoice(
    userId: number,
    orderId: number,
): Promise<{ status: string; document: InvoiceDocument } | null> {
    const [row] = await db
        .select({ status: orderStatuses.name, snapshot: invoices.snapshot })
        .from(invoices)
        .innerJoin(orders, eq(orders.id, invoices.orderId))
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
    return row ? { status: row.status, document: row.snapshot as InvoiceDocument } : null;
}

/** `order_statuses` por segunda vez: el estado del que venía un pedido Bloqueado. */
const blockedFromStatus = alias(orderStatuses, 'blocked_from_status');

/**
 * Consulta de un pedido de un usuario con su estado, su tipo de envío y su dirección de envío.
 * Filtra por usuario: el pedido de otra cuenta no se devuelve aunque exista. La dirección se lee
 * aunque ya esté sustituida (`is_active = false`): el pedido conserva la suya.
 *
 * @param userId - Id del usuario, el de la sesión.
 * @param orderId - `orders.order_id`.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function userOrderQuery(userId: number, orderId: number) {
    return db
        .select({
            id: orders.id,
            status: orderStatuses.name,
            paymentMethod: orders.paymentMethod,
            createdAt: orders.createdAt,
            /** Cuándo entró en el estado actual. */
            statusUpdatedAt: orders.statusUpdatedAt,
            /** Estado que tenía al bloquearse; `null` si no está Bloqueado. */
            blockedFrom: blockedFromStatus.name,
            /** Número de su factura (`F-2026-0001`); `null` si aún no tiene. */
            invoiceNumber: invoices.number,
            /** Quién anuló el pedido; `null` si no está anulado o lo anuló el sistema (cobro fallido). */
            cancelledBy: orders.cancelledBy,
            shippingCost: orders.shippingCost,
            shippingTypeName: shippingTypes.name,
            minDeliveryDays: shippingTypes.minDeliveryDays,
            maxDeliveryDays: shippingTypes.maxDeliveryDays,
            recipientName: addresses.recipientName,
            streetType: addresses.streetType,
            streetName: addresses.streetName,
            number: addresses.number,
            floor: addresses.floor,
            postalCode: addresses.postalCode,
            city: addresses.city,
            province: addresses.province,
            country: addresses.country,
            phone: addresses.phone,
        })
        .from(orders)
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .leftJoin(blockedFromStatus, eq(blockedFromStatus.id, orders.blockedFromStatusId))
        .leftJoin(invoices, eq(invoices.orderId, orders.id))
        .innerJoin(shippingTypes, eq(shippingTypes.id, orders.shippingTypeId))
        .leftJoin(addresses, eq(addresses.id, orders.shippingAddressId))
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
}

/**
 * Consulta de las líneas de un pedido con su producto, de la primera a la última presentación
 * (`variant_id`). El precio y el IVA son los guardados en `order_products`, no los vigentes.
 *
 * @param orderId - `orders.order_id`.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function orderLinesQuery(orderId: number) {
    return db
        .select({
            variantId: orderProducts.variantId,
            name: products.name,
            vintage: products.vintage,
            /** Imagen del producto (id de Cloudinary), como en las tarjetas; puede faltar. */
            image: products.image,
            /** Nombre de la D.O.: lo que el catálogo pinta bajo el nombre. */
            originName: guaranteesOfOrigin.name,
            format: productVariants.format,
            capacity: productVariants.capacity,
            capacityUnit: productVariants.capacityUnit,
            quantity: orderProducts.quantity,
            unitPrice: orderProducts.unitPrice,
            taxRate: orderProducts.taxRate,
        })
        .from(orderProducts)
        .innerJoin(productVariants, eq(productVariants.id, orderProducts.variantId))
        .innerJoin(products, eq(products.id, productVariants.productId))
        .innerJoin(guaranteesOfOrigin, eq(guaranteesOfOrigin.id, products.guaranteeOfOriginId))
        .where(eq(orderProducts.orderId, orderId))
        .orderBy(asc(orderProducts.variantId));
}

/**
 * Un pedido de un usuario con sus líneas (RF8).
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @param orderId - `orders.order_id`.
 * @returns `{ order, lines }`, o `null` si el pedido no existe o es de otra cuenta.
 */
export async function getUserOrder(userId: number, orderId: number) {
    const [order] = await userOrderQuery(userId, orderId);
    if (!order) return null;
    return { order, lines: await orderLinesQuery(orderId) };
}

/** Un pedido con sus líneas tal como lo devuelve `getUserOrder`. */
export type UserOrder = NonNullable<Awaited<ReturnType<typeof getUserOrder>>>;

/** Filtros del historial de pedidos (ya validados, ver `parseOrderHistoryParams`). */
export interface OrderHistoryFilters {
    /** Nombre del estado (`order_statuses.name`). */
    status?: string;
    /** Primer día incluido, `AAAA-MM-DD`. */
    from?: string;
    /** Último día incluido, `AAAA-MM-DD`. */
    to?: string;
}

/** Día siguiente a uno `AAAA-MM-DD`, para comparar con `< día + 1` y que `to` entre entero. */
function nextDay(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
}

/** Condición `WHERE` del historial: del usuario y, si se piden, por estado y por fecha de alta. */
function userOrdersCondition(userId: number, { status, from, to }: OrderHistoryFilters): SQL {
    const conditions: SQL[] = [eq(orders.userId, userId)];
    if (status) conditions.push(eq(orderStatuses.name, status));
    if (from) conditions.push(gte(orders.createdAt, `${from} 00:00:00`));
    if (to) conditions.push(lt(orders.createdAt, `${nextDay(to)} 00:00:00`));
    return and(...conditions)!;
}

/**
 * Consulta de una página del historial de pedidos de un cliente: número, fecha, total y estado,
 * del más reciente al más antiguo (`order_id` desempata). Una sola consulta, sin líneas.
 *
 * @param userId - Id del usuario, el de la sesión (`getSessionUserId`).
 * @param params - Página (desde 1), tamaño y filtros.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function userOrdersPageQuery(
    userId: number,
    { page, pageSize, ...filters }: { page: number; pageSize: number } & OrderHistoryFilters,
) {
    return db
        .select({
            id: orders.id,
            createdAt: orders.createdAt,
            total: orders.total,
            status: orderStatuses.name,
        })
        .from(orders)
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .where(userOrdersCondition(userId, filters))
        .orderBy(desc(orders.createdAt), desc(orders.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);
}

/**
 * Consulta que cuenta los pedidos de un cliente que cumplen los filtros del historial.
 *
 * @param userId - Id del usuario, el de la sesión.
 * @param filters - Estado y rango de fechas.
 * @returns La consulta, lista para ejecutar con `await`.
 */
export function userOrdersCountQuery(userId: number, filters: OrderHistoryFilters = {}) {
    return db
        .select({ total: count() })
        .from(orders)
        .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
        .where(userOrdersCondition(userId, filters));
}

/**
 * Una página del historial de pedidos de un cliente (RF8).
 *
 * @param userId - Id del usuario, el de la sesión.
 * @param params - Página (desde 1), tamaño de página y filtros.
 * @returns Los pedidos de la página y el total que cumple los filtros (para paginar).
 */
export async function getUserOrdersPage(
    userId: number,
    params: { page: number; pageSize: number } & OrderHistoryFilters,
) {
    const { status, from, to } = params;
    const [items, [counted]] = await Promise.all([
        userOrdersPageQuery(userId, params),
        userOrdersCountQuery(userId, { status, from, to }),
    ]);
    return { items, total: counted?.total ?? 0 };
}

/** Una página del historial, tal como la devuelve `getUserOrdersPage`. */
export type UserOrdersPage = Awaited<ReturnType<typeof getUserOrdersPage>>;
