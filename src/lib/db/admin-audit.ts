import {
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    lt,
    not,
    or,
    sql,
    type SQL,
    type SQLWrapper,
} from 'drizzle-orm';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { AUDIT_KINDS, type AdminAuditFilters } from '@/lib/admin/audit';
import { LIKE_ESCAPE, escapeLike, searchPattern } from '@/lib/catalog/search';

/** `audit_logs.logged_at` como texto `AAAA-MM-DD HH:MM:SS` (UTC), igual que el resto de fechas del panel. */
const loggedAt = sql<string>`date_format(${auditLogs.loggedAt}, '%Y-%m-%d %H:%i:%s')`;

/** Día siguiente a uno `AAAA-MM-DD`, para comparar con `< día + 1` y que `to` entre entero. */
function nextDay(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
}

/** `columna like patrón escape '!'` (ver `LIKE_ESCAPE`). */
function likeEscaped(column: SQLWrapper, pattern: string): SQL {
    return sql`${column} like ${pattern} escape ${sql.raw(`'${LIKE_ESCAPE}'`)}`;
}

/** `action` empieza por el texto (escapado, para que `_` y `%` no valgan de comodín). */
function startsWith(prefix: string): SQL {
    return likeEscaped(auditLogs.action, `${escapeLike(prefix)}%`);
}

/** Condición de un tipo: empieza por uno de sus principios; `Sistema`, por ninguno de los demás. */
function kindCondition(kind: NonNullable<AdminAuditFilters['kind']>): SQL | undefined {
    if (kind === 'Sistema') {
        const known = AUDIT_KINDS.flatMap(({ prefixes }) => prefixes.map(startsWith));
        return not(or(...known)!);
    }
    const prefixes = AUDIT_KINDS.find((item) => item.kind === kind)!.prefixes;
    return or(...prefixes.map(startsWith));
}

/** `WHERE` del listado: fechas, usuario, tipo y búsqueda en la acción y en el detalle. */
function adminAuditCondition({ from, to, userId, kind, q }: AdminAuditFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (from) conditions.push(gte(auditLogs.loggedAt, `${from} 00:00:00`));
    if (to) conditions.push(lt(auditLogs.loggedAt, `${nextDay(to)} 00:00:00`));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (kind) {
        const byKind = kindCondition(kind);
        if (byKind) conditions.push(byKind);
    }
    const pattern = searchPattern(q);
    if (pattern)
        conditions.push(
            or(likeEscaped(auditLogs.action, pattern), likeEscaped(auditLogs.details, pattern))!,
        );
    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Una página del registro de actividad (RF12), del asiento más reciente al más antiguo. Solo
 * lectura.
 *
 * @returns Los asientos de la página, el total con los filtros y el total sin filtros.
 */
export async function getAdminAuditPage({
    page,
    pageSize,
    ...filters
}: { page: number; pageSize: number } & AdminAuditFilters) {
    const where = adminAuditCondition(filters);
    const [items, [counted], [all]] = await Promise.all([
        db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                details: auditLogs.details,
                loggedAt,
            })
            .from(auditLogs)
            .where(where)
            .orderBy(desc(auditLogs.loggedAt), desc(auditLogs.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize),
        db.select({ total: count() }).from(auditLogs).where(where),
        db.select({ total: count() }).from(auditLogs),
    ]);
    return { items, total: counted?.total ?? 0, overall: all?.total ?? 0 };
}

/** Una página del registro, tal como la devuelve `getAdminAuditPage`. */
export type AdminAuditPage = Awaited<ReturnType<typeof getAdminAuditPage>>;

/** Una cuenta que aparece en el registro, para el filtro de usuario. */
export interface AuditUser {
    id: number;
    name: string | null;
    lastName: string | null;
    email: string;
}

/**
 * Las cuentas que han dejado algún asiento (las del equipo, normalmente), para el filtro de
 * usuario, por nombre.
 */
export async function getAuditUsers(): Promise<AuditUser[]> {
    return db
        .selectDistinct({
            id: users.id,
            name: users.name,
            lastName: users.lastName,
            email: users.email,
        })
        .from(auditLogs)
        .innerJoin(users, eq(users.id, auditLogs.userId))
        .orderBy(asc(users.name), asc(users.lastName), asc(users.id));
}
