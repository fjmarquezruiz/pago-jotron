/**
 * Escrituras del catálogo de productos del panel (CU9): crear, editar y cambiar el estado de venta.
 * Cada una corre en UNA transacción con su asiento de `audit_logs`, y las reglas de negocio (una
 * referencia que no existe, el stock que cambió mientras se editaba) se devuelven como resultado,
 * sin lanzar: la ruta decide el código HTTP. Solo las llama una ruta que ya exigió el rol.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import {
    categories,
    grapes,
    guaranteesOfOrigin,
    productCategories,
    productGrapes,
    productSteps,
    productTastingTags,
    products,
    productVariants,
    tastingTags,
    typologies,
    wineries,
} from '@/db/schema';
import { changedFields, salesChangeText } from '@/lib/admin/catalog';
import { canReleaseSales } from '@/lib/admin/sales-block';
import { decimalOrNull, splitKnownNames, textOrNull } from '@/lib/admin/product-sheet';
import { auditedCatalogChange, type CatalogTx } from '@/lib/admin/catalog-api';
import { isDuplicateEntryError } from '@/lib/db/errors';
import type { ProductFormValues } from '@/lib/validations/admin-products';
import { slugify } from '@/lib/utils';
import type { AuthorizedUser } from '@/lib/auth/require-role';

export type ProductWriteFailureCode =
    | 'not_found'
    | 'invalid_reference'
    | 'invalid_variant'
    | 'slug_taken'
    | 'duplicate_variant'
    | 'stock_conflict'
    | 'parent_blocked';

export type ProductWriteResult<T> =
    { ok: true; value: T } | { ok: false; code: ProductWriteFailureCode; message: string };

const fail = (code: ProductWriteFailureCode, message: string) =>
    ({ ok: false, code, message }) as const;

/** Nombres con los que la auditoría rotula cada campo que cambia. */
const FIELD_LABELS = {
    name: 'nombre',
    wineryId: 'bodega',
    guaranteeOfOriginId: 'denominación de origen',
    typologyId: 'tipología',
    vintage: 'añada',
    description: 'descripción',
    image: 'imagen',
    grapes: 'uvas',
    variants: 'presentaciones',
    categories: 'categorías',
    tastingTags: 'etiquetas de cata',
    visualNote: 'nota visual',
    aromaNote: 'nota en nariz',
    palateNote: 'nota en boca',
    foodPairing: 'maridaje',
    alcoholContent: 'graduación',
    minTemperature: 'temperatura mínima',
    maxTemperature: 'temperatura máxima',
    agingTime: 'crianza',
    agingMethod: 'método de crianza',
    production: 'producción',
    soilType: 'tipo de suelo',
    vineyardAltitude: 'altitud del viñedo',
    yield: 'rendimiento',
    steps: 'elaboración',
} as const;

/** Un producto reducido a lo que el formulario edita, para comparar antes y después. */
type Snapshot = {
    name: string;
    wineryId: number;
    guaranteeOfOriginId: number;
    typologyId: number;
    vintage: number | null;
    description: string;
    image: string | null;
    grapes: { grapeId: number; percentage: number }[];
    categories: string[];
    tastingTags: string[];
    visualNote: string;
    aromaNote: string;
    palateNote: string;
    foodPairing: string;
    alcoholContent: number | null;
    minTemperature: number | null;
    maxTemperature: number | null;
    agingTime: string;
    agingMethod: string;
    production: string;
    soilType: string;
    vineyardAltitude: number | null;
    yield: number | null;
    steps: { title: string; description: string }[];
    variants: {
        id: number;
        format: string;
        capacity: number;
        capacityUnit: string;
        price: number;
        stock: number;
        isBlocked: boolean;
    }[];
};

/**
 * Comprueba que la bodega, la D.O., la tipología y las uvas elegidas existen.
 *
 * @returns El mensaje de lo que falta, o `null` si todo existe.
 */
async function missingReference(tx: CatalogTx, input: ProductFormValues): Promise<string | null> {
    const [winery] = await tx
        .select({ id: wineries.id })
        .from(wineries)
        .where(eq(wineries.id, input.wineryId));
    if (!winery) return 'La bodega elegida no existe';
    const [guarantee] = await tx
        .select({ id: guaranteesOfOrigin.id })
        .from(guaranteesOfOrigin)
        .where(eq(guaranteesOfOrigin.id, input.guaranteeOfOriginId));
    if (!guarantee) return 'La denominación de origen elegida no existe';
    const [typology] = await tx
        .select({ id: typologies.id })
        .from(typologies)
        .where(eq(typologies.id, input.typologyId));
    if (!typology) return 'La tipología elegida no existe';
    if (input.grapes.length > 0) {
        const found = await tx
            .select({ id: grapes.id })
            .from(grapes)
            .where(
                inArray(
                    grapes.id,
                    input.grapes.map((grape) => grape.grapeId),
                ),
            );
        if (found.length !== input.grapes.length) return 'Alguna variedad de uva no existe';
    }
    return null;
}

const toDecimal = (value: number) => value.toFixed(2);

/** Columnas de `products` que llegan de la ficha (notas, ficha técnica y datos clave); vacío es `NULL`. */
function sheetColumns(input: ProductFormValues) {
    return {
        visualNote: textOrNull(input.visualNote),
        aromaNote: textOrNull(input.aromaNote),
        palateNote: textOrNull(input.palateNote),
        foodPairing: textOrNull(input.foodPairing),
        alcoholContent: decimalOrNull(input.alcoholContent),
        minTemperature: decimalOrNull(input.minTemperature),
        maxTemperature: decimalOrNull(input.maxTemperature),
        agingTime: textOrNull(input.agingTime),
        agingMethod: textOrNull(input.agingMethod),
        production: textOrNull(input.production),
        soilType: textOrNull(input.soilType),
        vineyardAltitude: input.vineyardAltitude,
        yield: input.yield,
    };
}

/** Nombres ordenados sin distinguir mayúsculas, para comparar antes y después. */
const sortedNames = (names: string[]) => names.map((name) => name.trim().toLowerCase()).sort();

/** Un decimal de la BD (texto) como número, o `null`. */
const numberOrNull = (value: string | null) => (value === null ? null : Number(value));

/**
 * Reemplaza las categorías y las etiquetas de cata del producto por las elegidas. Se eligen por
 * nombre: las que ya existen se enlazan (sin distinguir mayúsculas) y las que no se crean en la
 * misma transacción. Si otra petición crea una a la vez (índice único), se vuelve a leer.
 *
 * @returns Los nombres que se han creado nuevos, ya rotulados para el asiento de auditoría.
 */
async function syncCategoriesAndTags(
    tx: CatalogTx,
    productId: number,
    input: ProductFormValues,
): Promise<string[]> {
    const created: string[] = [];

    async function idsFor(
        table: typeof categories | typeof tastingTags,
        names: string[],
        noun: string,
    ): Promise<number[]> {
        if (names.length === 0) return [];
        const read = () => tx.select({ id: table.id, name: table.name }).from(table);
        const { known, toCreate } = splitKnownNames(names, await read());
        const ids = [...known];
        for (const name of toCreate) {
            try {
                const [inserted] = await tx.insert(table).values({ name });
                ids.push(Number(inserted.insertId));
                created.push(`${noun} nueva: ${name}`);
            } catch (error) {
                if (!isDuplicateEntryError(error, 'name')) throw error;
                const again = splitKnownNames([name], await read());
                if (again.known.length === 0) throw error;
                ids.push(...again.known);
            }
        }
        return ids;
    }

    const categoryIds = await idsFor(categories, input.categories, 'categoría');
    const tagIds = await idsFor(tastingTags, input.tastingTags, 'etiqueta de cata');
    await tx.delete(productCategories).where(eq(productCategories.productId, productId));
    if (categoryIds.length > 0)
        await tx
            .insert(productCategories)
            .values(categoryIds.map((categoryId) => ({ productId, categoryId })));
    await tx.delete(productTastingTags).where(eq(productTastingTags.productId, productId));
    if (tagIds.length > 0)
        await tx
            .insert(productTastingTags)
            .values(tagIds.map((tastingTagId) => ({ productId, tastingTagId })));
    return created;
}

/** Reemplaza los pasos de elaboración del producto; la posición es el lugar en la lista (1…n). */
async function syncSteps(tx: CatalogTx, productId: number, input: ProductFormValues) {
    await tx.delete(productSteps).where(eq(productSteps.productId, productId));
    if (input.steps.length > 0)
        await tx.insert(productSteps).values(
            input.steps.map((step, index) => ({
                productId,
                position: index + 1,
                title: step.title,
                description: textOrNull(step.description),
            })),
        );
}

/**
 * Crea un producto con sus uvas y presentaciones (CU9). El slug sale del nombre y la añada
 * (`tinto-roble-2023`).
 *
 * @param actor - Cuenta de la sesión.
 * @param input - Datos validados con `productFormSchema`.
 * @returns El id y el slug, o por qué no se pudo: `invalid_reference`, `slug_taken` (ya hay otro
 * producto con ese nombre y añada) o `duplicate_variant`.
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function createProduct(
    actor: AuthorizedUser,
    input: ProductFormValues,
): Promise<ProductWriteResult<{ id: number; slug: string }>> {
    const slug = slugify(`${input.name} ${input.vintage ?? ''}`);
    if (slug === '') return fail('invalid_reference', 'El nombre debe llevar letras o números');
    try {
        return await auditedCatalogChange<ProductWriteResult<{ id: number; slug: string }>>(
            async (tx) => {
                const missing = await missingReference(tx, input);
                if (missing) return { result: fail('invalid_reference', missing), audit: null };
                const [inserted] = await tx.insert(products).values({
                    name: input.name,
                    slug,
                    wineryId: input.wineryId,
                    guaranteeOfOriginId: input.guaranteeOfOriginId,
                    typologyId: input.typologyId,
                    vintage: input.vintage,
                    image: input.image,
                    description: input.description || null,
                    ...sheetColumns(input),
                });
                const id = Number(inserted.insertId);
                if (input.grapes.length > 0)
                    await tx.insert(productGrapes).values(
                        input.grapes.map((grape) => ({
                            productId: id,
                            grapeId: grape.grapeId,
                            percentage: toDecimal(grape.percentage),
                        })),
                    );
                await tx.insert(productVariants).values(
                    input.variants.map((variant) => ({
                        productId: id,
                        format: variant.format,
                        capacity: variant.capacity,
                        capacityUnit: variant.capacityUnit,
                        price: toDecimal(variant.price),
                        stock: variant.stock,
                        isBlocked: variant.isBlocked,
                    })),
                );
                const createdNames = await syncCategoriesAndTags(tx, id, input);
                await syncSteps(tx, id, input);
                return {
                    result: { ok: true, value: { id, slug } },
                    audit: {
                        entity: 'product',
                        id,
                        name: input.name,
                        actor,
                        changes: ['creado', ...createdNames],
                    },
                };
            },
        );
    } catch (error) {
        if (isDuplicateEntryError(error, 'slug'))
            return fail('slug_taken', 'Ya existe un producto con ese nombre y añada');
        if (isDuplicateEntryError(error, 'uq_variant_format'))
            return fail('duplicate_variant', 'Ya hay una presentación con ese formato y capacidad');
        throw error;
    }
}

/**
 * Edita un producto (CU9). Las uvas se reemplazan por las enviadas. Las presentaciones con `id` se
 * actualizan y las nuevas se crean; una presentación que no llega no se borra (las presentaciones
 * se dan de baja con `isBlocked`, porque los pedidos las referencian).
 *
 * **Stock con control optimista:** de una presentación que ya existe, `stock` solo se escribe si
 * difiere de `loadedStock` (lo que leyó el formulario) y la fila aún tiene ese valor; si no lo
 * tiene (una compra o un ajuste lo cambió mientras se editaba) no se guarda NADA y se devuelve
 * `stock_conflict`. Si el formulario no tocó el stock no se escribe, para no pisar las compras.
 * La fila se bloquea (`FOR UPDATE`), así la comprobación y la escritura no se separan.
 *
 * El slug no cambia aunque cambie el nombre: la URL de la ficha debe seguir siendo la misma.
 *
 * @param actor - Cuenta de la sesión.
 * @param productId - `products.product_id`.
 * @param input - Datos validados con `productFormSchema`.
 * @returns Si cambió algo, o por qué no se pudo guardar.
 * @throws Errores inesperados de la BD (la ruta responde 500).
 */
export async function updateProduct(
    actor: AuthorizedUser,
    productId: number,
    input: ProductFormValues,
): Promise<ProductWriteResult<{ changed: boolean }>> {
    try {
        return await auditedCatalogChange<ProductWriteResult<{ changed: boolean }>>(async (tx) => {
            const [current] = await tx
                .select()
                .from(products)
                .where(eq(products.id, productId))
                .for('update');
            if (!current)
                return { result: fail('not_found', 'El producto no existe'), audit: null };

            const missing = await missingReference(tx, input);
            if (missing) return { result: fail('invalid_reference', missing), audit: null };

            const existingVariants = await tx
                .select()
                .from(productVariants)
                .where(eq(productVariants.productId, productId))
                .for('update');
            const existingGrapes = await tx
                .select()
                .from(productGrapes)
                .where(eq(productGrapes.productId, productId));
            const existingCategories = await tx
                .select({ name: categories.name })
                .from(productCategories)
                .innerJoin(categories, eq(categories.id, productCategories.categoryId))
                .where(eq(productCategories.productId, productId));
            const existingTags = await tx
                .select({ name: tastingTags.name })
                .from(productTastingTags)
                .innerJoin(tastingTags, eq(tastingTags.id, productTastingTags.tastingTagId))
                .where(eq(productTastingTags.productId, productId));
            const existingSteps = await tx
                .select({
                    title: productSteps.title,
                    description: productSteps.description,
                })
                .from(productSteps)
                .where(eq(productSteps.productId, productId))
                .orderBy(asc(productSteps.position));

            const byId = new Map(existingVariants.map((variant) => [variant.id, variant]));
            const seenIds = new Set<number>();
            const finalStock = new Map<number, number>();
            for (const variant of input.variants) {
                if (variant.variantId === undefined) continue;
                const row = byId.get(variant.variantId);
                if (!row || seenIds.has(variant.variantId) || variant.loadedStock === undefined)
                    return {
                        result: fail(
                            'invalid_variant',
                            'Una presentación no pertenece al producto',
                        ),
                        audit: null,
                    };
                seenIds.add(variant.variantId);
                if (variant.stock === variant.loadedStock) {
                    finalStock.set(variant.variantId, row.stock);
                } else if (row.stock !== variant.loadedStock) {
                    return {
                        result: fail(
                            'stock_conflict',
                            'Las existencias han cambiado mientras editabas. Se han recargado los datos: revisa las cantidades y vuelve a guardar.',
                        ),
                        audit: null,
                    };
                } else {
                    finalStock.set(variant.variantId, variant.stock);
                }
            }

            const before: Snapshot = {
                name: current.name,
                wineryId: current.wineryId,
                guaranteeOfOriginId: current.guaranteeOfOriginId,
                typologyId: current.typologyId,
                vintage: current.vintage,
                description: current.description ?? '',
                image: current.image,
                grapes: existingGrapes
                    .map((grape) => ({
                        grapeId: grape.grapeId,
                        percentage: Number(grape.percentage),
                    }))
                    .sort((a, b) => a.grapeId - b.grapeId),
                categories: sortedNames(existingCategories.map((row) => row.name)),
                tastingTags: sortedNames(existingTags.map((row) => row.name)),
                visualNote: current.visualNote ?? '',
                aromaNote: current.aromaNote ?? '',
                palateNote: current.palateNote ?? '',
                foodPairing: current.foodPairing ?? '',
                alcoholContent: numberOrNull(current.alcoholContent),
                minTemperature: numberOrNull(current.minTemperature),
                maxTemperature: numberOrNull(current.maxTemperature),
                agingTime: current.agingTime ?? '',
                agingMethod: current.agingMethod ?? '',
                production: current.production ?? '',
                soilType: current.soilType ?? '',
                vineyardAltitude: current.vineyardAltitude,
                yield: current.yield,
                steps: existingSteps.map((step) => ({
                    title: step.title,
                    description: step.description ?? '',
                })),
                variants: existingVariants
                    .map((variant) => ({
                        id: variant.id,
                        format: variant.format,
                        capacity: variant.capacity,
                        capacityUnit: variant.capacityUnit,
                        price: Number(variant.price),
                        stock: variant.stock,
                        isBlocked: variant.isBlocked,
                    }))
                    .sort((a, b) => a.id - b.id),
            };

            // Primero las presentaciones que ya existen: si dos se intercambian formato, el UNIQUE
            // lo dice (`duplicate_variant`) y se deshace todo.
            for (const variant of input.variants) {
                const variantId = variant.variantId;
                if (variantId === undefined) continue;
                await tx
                    .update(productVariants)
                    .set({
                        format: variant.format,
                        capacity: variant.capacity,
                        capacityUnit: variant.capacityUnit,
                        price: toDecimal(variant.price),
                        isBlocked: variant.isBlocked,
                        ...(finalStock.get(variantId) !== byId.get(variantId)?.stock && {
                            stock: finalStock.get(variantId),
                        }),
                    })
                    .where(
                        and(
                            eq(productVariants.id, variantId),
                            eq(productVariants.productId, productId),
                        ),
                    );
            }
            const created = input.variants.filter((variant) => variant.variantId === undefined);
            const createdIds: number[] = [];
            for (const variant of created) {
                const [inserted] = await tx.insert(productVariants).values({
                    productId,
                    format: variant.format,
                    capacity: variant.capacity,
                    capacityUnit: variant.capacityUnit,
                    price: toDecimal(variant.price),
                    stock: variant.stock,
                    isBlocked: variant.isBlocked,
                });
                createdIds.push(Number(inserted.insertId));
            }

            await tx.delete(productGrapes).where(eq(productGrapes.productId, productId));
            if (input.grapes.length > 0)
                await tx.insert(productGrapes).values(
                    input.grapes.map((grape) => ({
                        productId,
                        grapeId: grape.grapeId,
                        percentage: toDecimal(grape.percentage),
                    })),
                );

            await tx
                .update(products)
                .set({
                    name: input.name,
                    wineryId: input.wineryId,
                    guaranteeOfOriginId: input.guaranteeOfOriginId,
                    typologyId: input.typologyId,
                    vintage: input.vintage,
                    image: input.image,
                    description: input.description || null,
                    ...sheetColumns(input),
                })
                .where(eq(products.id, productId));
            const createdNames = await syncCategoriesAndTags(tx, productId, input);
            await syncSteps(tx, productId, input);

            let nextCreated = 0;
            const after: Snapshot = {
                name: input.name,
                wineryId: input.wineryId,
                guaranteeOfOriginId: input.guaranteeOfOriginId,
                typologyId: input.typologyId,
                vintage: input.vintage,
                description: input.description,
                image: input.image,
                grapes: input.grapes
                    .map((grape) => ({ grapeId: grape.grapeId, percentage: grape.percentage }))
                    .sort((a, b) => a.grapeId - b.grapeId),
                categories: sortedNames(input.categories),
                tastingTags: sortedNames(input.tastingTags),
                visualNote: input.visualNote,
                aromaNote: input.aromaNote,
                palateNote: input.palateNote,
                foodPairing: input.foodPairing,
                alcoholContent: input.alcoholContent,
                minTemperature: input.minTemperature,
                maxTemperature: input.maxTemperature,
                agingTime: input.agingTime,
                agingMethod: input.agingMethod,
                production: input.production,
                soilType: input.soilType,
                vineyardAltitude: input.vineyardAltitude,
                yield: input.yield,
                steps: input.steps,
                variants: [
                    ...input.variants.map((variant) => ({
                        id: variant.variantId ?? createdIds[nextCreated++],
                        format: variant.format,
                        capacity: variant.capacity,
                        capacityUnit: variant.capacityUnit,
                        price: variant.price,
                        stock:
                            variant.variantId === undefined
                                ? variant.stock
                                : finalStock.get(variant.variantId)!,
                        isBlocked: variant.isBlocked,
                    })),
                    // Las que no llegaron se quedan como estaban.
                    ...before.variants.filter((variant) => !seenIds.has(variant.id)),
                ].sort((a, b) => a.id - b.id),
            };

            const changes = [...changedFields(before, after, FIELD_LABELS), ...createdNames];
            return {
                result: { ok: true, value: { changed: changes.length > 0 } },
                audit:
                    changes.length > 0
                        ? { entity: 'product', id: productId, name: input.name, actor, changes }
                        : null,
            };
        });
    } catch (error) {
        if (isDuplicateEntryError(error, 'uq_variant_format'))
            return fail('duplicate_variant', 'Ya hay una presentación con ese formato y capacidad');
        throw error;
    }
}

/**
 * Bloquea las ventas de un producto o lo pone a la venta (RF4: la baja es lógica). Un cambio que
 * no cambia nada responde `changed: false` y no deja asiento.
 *
 * @param actor - Cuenta de la sesión.
 * @param productId - `products.product_id`.
 * @param isBlocked - Estado nuevo (`is_blocked`).
 * @returns Si cambió algo, o `not_found`.
 */
export async function setProductBlocked(
    actor: AuthorizedUser,
    productId: number,
    isBlocked: boolean,
): Promise<ProductWriteResult<{ changed: boolean }>> {
    return auditedCatalogChange<ProductWriteResult<{ changed: boolean }>>(async (tx) => {
        const [current] = await tx
            .select({
                name: products.name,
                isBlocked: products.isBlocked,
                wineryId: products.wineryId,
                denominationId: products.guaranteeOfOriginId,
            })
            .from(products)
            .where(eq(products.id, productId))
            .for('update');
        if (!current) return { result: fail('not_found', 'El producto no existe'), audit: null };
        if (current.isBlocked === isBlocked)
            return { result: { ok: true, value: { changed: false } }, audit: null };
        if (!isBlocked) {
            // Poner a la venta: su bodega y su D.O. deben estarlo (se leen bloqueadas contra un
            // bloqueo que llegue a la vez).
            const [winery] = await tx
                .select({ isBlocked: wineries.isBlocked })
                .from(wineries)
                .where(eq(wineries.id, current.wineryId))
                .for('update');
            const [denomination] = await tx
                .select({ isBlocked: guaranteesOfOrigin.isBlocked })
                .from(guaranteesOfOrigin)
                .where(eq(guaranteesOfOrigin.id, current.denominationId))
                .for('update');
            const release = canReleaseSales({
                wineryBlocked: winery?.isBlocked ?? false,
                denominationBlocked: denomination?.isBlocked ?? false,
            });
            if (!release.ok)
                return { result: fail('parent_blocked', release.message), audit: null };
        }
        await tx.update(products).set({ isBlocked }).where(eq(products.id, productId));
        return {
            result: { ok: true, value: { changed: true } },
            audit: {
                entity: 'product',
                id: productId,
                name: current.name,
                actor,
                changes: [salesChangeText(isBlocked)],
            },
        };
    });
}
