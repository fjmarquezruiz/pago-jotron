import {
    and,
    asc,
    count,
    desc,
    eq,
    notInArray,
    or,
    sql,
    sum,
    type SQL,
    type SQLWrapper,
} from 'drizzle-orm';
import { db } from '@/db';
import { addresses, orders, orderStatuses, users } from '@/db/schema';
import type { AdminUserFilters } from '@/lib/admin/users';
import { LIKE_ESCAPE, searchPattern } from '@/lib/catalog/search';
import { NO_REVENUE_STATUSES } from '@/lib/admin/dashboard';
import type { Role } from '@/types/auth';

/** `users.registration_date` como texto `AAAA-MM-DD HH:MM:SS` (UTC), igual que el resto de fechas del panel. */
const registeredAt = sql<string>`date_format(${users.registrationDate}, '%Y-%m-%d %H:%i:%s')`;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** `columna like patrón escape '!'` (ver `LIKE_ESCAPE`). */
function likeEscaped(column: SQLWrapper, pattern: string): SQL {
    return sql`${column} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`;
}

/** `WHERE` del listado: rol, estado y búsqueda por nombre, apellidos o correo. */
function adminUsersCondition({ role, status, q }: AdminUserFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (role) conditions.push(eq(users.role, role));
    if (status) conditions.push(eq(users.isActive, status === 'Activo'));
    const pattern = searchPattern(q);
    if (pattern)
        conditions.push(
            or(
                likeEscaped(users.email, pattern),
                likeEscaped(users.name, pattern),
                likeEscaped(users.lastName, pattern),
                // «Nombre Apellidos» seguido, como se ve en la tabla.
                likeEscaped(sql`concat_ws(' ', ${users.name}, ${users.lastName})`, pattern),
            )!,
        );
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Una página del listado de usuarios del panel (CU12), de la cuenta más reciente a la más antigua.
 *
 * @returns Los usuarios de la página, el total con los filtros y el total sin filtros.
 */
export async function getAdminUsersPage({
    page,
    pageSize,
    ...filters
}: { page: number; pageSize: number } & AdminUserFilters) {
    const where = adminUsersCondition(filters);
    const [items, [counted], [all]] = await Promise.all([
        db
            .select({
                id: users.id,
                name: users.name,
                lastName: users.lastName,
                email: users.email,
                role: users.role,
                isActive: users.isActive,
                registrationDate: registeredAt,
            })
            .from(users)
            .where(where)
            .orderBy(desc(users.registrationDate), desc(users.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(users).where(where),
        db.select({ total: count() }).from(users),
    ]);
    return { items, total: counted?.total ?? 0, overall: all?.total ?? 0 };
}

/** Una página del listado, tal como la devuelve `getAdminUsersPage`. */
export type AdminUsersPage = Awaited<ReturnType<typeof getAdminUsersPage>>;

/** Pedidos que enseña la ficha: los más recientes. */
export const USER_ORDERS_LIMIT = 50;

/**
 * La ficha de una cuenta (CU12), en solo lectura: sus datos, sus direcciones vigentes, sus pedidos
 * (los más recientes) y el total de pedidos y el gasto. Sin el hash de la contraseña.
 *
 * El gasto no cuenta los pedidos Anulados ni los Pendientes de pago (`NO_REVENUE_STATUSES`), igual
 * que los ingresos del panel de control.
 *
 * @param userId - `users.user_id`.
 * @returns La ficha, o `null` si no existe.
 */
export async function getAdminUser(userId: number) {
    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            lastName: users.lastName,
            email: users.email,
            phone: users.phone,
            idCard: users.idCard,
            birthDate: users.birthDate,
            role: users.role,
            isActive: users.isActive,
            registrationDate: registeredAt,
        })
        .from(users)
        .where(eq(users.id, userId));
    if (!user) return null;

    const [[totals], [spent], userOrders, userAddresses, [admins]] = await Promise.all([
        db.select({ orders: count() }).from(orders).where(eq(orders.userId, userId)),
        db
            .select({ spent: sum(orders.total) })
            .from(orders)
            .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
            .where(
                and(
                    eq(orders.userId, userId),
                    notInArray(orderStatuses.name, [...NO_REVENUE_STATUSES]),
                ),
            ),
        db
            .select({
                id: orders.id,
                createdAt: orders.createdAt,
                total: orders.total,
                status: orderStatuses.name,
            })
            .from(orders)
            .innerJoin(orderStatuses, eq(orderStatuses.id, orders.statusId))
            .where(eq(orders.userId, userId))
            .orderBy(desc(orders.createdAt), desc(orders.id))
            .limit(USER_ORDERS_LIMIT),
        db
            .select({
                id: addresses.id,
                type: addresses.addressType,
                recipientName: addresses.recipientName,
                streetType: addresses.streetType,
                streetName: addresses.streetName,
                number: addresses.number,
                floor: addresses.floor,
                postalCode: addresses.postalCode,
                city: addresses.city,
                province: addresses.province,
                country: addresses.country,
            })
            .from(addresses)
            .where(and(eq(addresses.userId, userId), eq(addresses.isActive, true)))
            .orderBy(asc(addresses.id)),
        db
            .select({ total: count() })
            .from(users)
            .where(and(eq(users.role, 'Administrador'), eq(users.isActive, true))),
    ]);
    return {
        user,
        orderCount: totals?.orders ?? 0,
        spent: spent?.spent ?? '0.00',
        orders: userOrders,
        addresses: userAddresses,
        /** Es el único administrador activo: no se le puede degradar ni desactivar. */
        isLastAdmin: user.role === 'Administrador' && user.isActive && admins?.total === 1,
    };
}

/** La ficha de una cuenta, tal como la devuelve `getAdminUser`. */
export type AdminUser = NonNullable<Awaited<ReturnType<typeof getAdminUser>>>;

/**
 * Ids de todas las cuentas que ahora son Administrador y están activas, BLOQUEADAS hasta el final
 * de la transacción (`SELECT … FOR UPDATE`): dos cambios a la vez sobre administradores esperan uno
 * al otro en vez de dejar entre los dos la tienda sin ninguno.
 *
 * @param tx - La transacción en la que se ejecuta.
 */
export async function lockActiveAdminIds(tx: Tx): Promise<number[]> {
    const rows = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'Administrador'), eq(users.isActive, true)))
        .for('update');
    return rows.map(({ id }) => id);
}

/**
 * Rol y estado actuales de una cuenta, con su fila bloqueada hasta el final de la transacción.
 *
 * @param tx - La transacción en la que se ejecuta.
 * @param userId - `users.user_id`.
 * @returns La cuenta, o `null` si no existe.
 */
export async function lockUserAccess(
    tx: Tx,
    userId: number,
): Promise<{ id: number; role: Role; isActive: boolean } | null> {
    const [row] = await tx
        .select({ id: users.id, role: users.role, isActive: users.isActive })
        .from(users)
        .where(eq(users.id, userId))
        .for('update');
    return row ?? null;
}

/** Cambia el rol y/o el estado de una cuenta dentro de la transacción. */
export async function updateUserAccess(
    tx: Tx,
    userId: number,
    set: { role?: Role; isActive?: boolean },
): Promise<void> {
    await tx.update(users).set(set).where(eq(users.id, userId));
}
