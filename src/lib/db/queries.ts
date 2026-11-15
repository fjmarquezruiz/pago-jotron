import { and, asc, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import {
    guaranteesOfOrigin,
    productGrapes,
    productVariants,
    products,
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
