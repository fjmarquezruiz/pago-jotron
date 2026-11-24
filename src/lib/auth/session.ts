import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserAccess } from '@/lib/db/queries';
import { MAX_ID } from '@/lib/validations/ids';
import type { Role } from '@/types/auth';

/** Id de la sesión como entero válido de la BD, o `null` si falta o no es un id posible. */
function parseSessionId(rawId: unknown): number | null {
    // Con la sesión de otra versión o a medias, `user` o `id` podrían faltar aunque el tipo diga que no.
    const id = Number(rawId);
    return Number.isInteger(id) && id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * Id del usuario con sesión iniciada, leído de la sesión JWT en el servidor (la única fuente de
 * confianza: nunca de lo que mande el navegador). Para las rutas de la API y las páginas del
 * servidor que trabajan con los datos de la cuenta, como el carrito guardado (RF6).
 *
 * `session.user.id` es un texto (`String(users.user_id)`, ver `auth-options.ts`); aquí se
 * convierte en el número que usa la BD y se exige que sea un entero entre 1 y el máximo de un
 * `int` de MySQL (`MAX_ID`). Cualquier otra cosa (sin id, vacío, `0`, decimal, texto no numérico)
 * cuenta como sin sesión.
 *
 * El JWT sigue vigente aunque se desactive la cuenta, así que se consulta `users.is_active`: una
 * cuenta desactivada o borrada cuenta como sin sesión y no puede comprar ni ver sus pedidos (RF12).
 *
 * @returns El id del usuario, o `null` si no hay sesión, su id no es válido o la cuenta no está activa.
 *
 * @example
 * const userId = await getSessionUserId();
 * if (userId === null) return NextResponse.json({ message: 'Inicia sesión' }, { status: 401 });
 */
export async function getSessionUserId(): Promise<number | null> {
    const session = await getServerSession(authOptions);
    const id = parseSessionId(session?.user?.id);
    if (id === null) return null;
    const account = await getUserAccess(id);
    return account?.isActive ? id : null;
}

/**
 * Usuario de la sesión con su rol, para las rutas que comprueban el rol por su cuenta (RNF3): el
 * middleware ya filtra, pero una API no debe fiarse solo de eso.
 *
 * El id sale del JWT, pero el rol y el estado se leen de la BD en cada llamada: el token sigue
 * diciendo lo que decía al iniciar sesión, y si se desactiva la cuenta o se cambia su rol (RF12)
 * ha de valer el cambio, no el token.
 *
 * @returns `{ id, role }` con el rol de la BD, o `null` si no hay sesión, su id no es válido, la
 * cuenta no existe o está desactivada.
 */
export async function getSessionUser(): Promise<{ id: number; role: Role } | null> {
    const session = await getServerSession(authOptions);
    const id = parseSessionId(session?.user?.id);
    if (id === null) return null;
    const account = await getUserAccess(id);
    if (!account?.isActive) return null;
    const { role } = account;
    if (role !== 'Cliente' && role !== 'Editor' && role !== 'Administrador') return null;
    return { id, role };
}
