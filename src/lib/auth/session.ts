import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { MAX_ID } from '@/lib/validations/ids';
import type { Role } from '@/types/auth';

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
 * @returns El id del usuario, o `null` si no hay sesión o su id no es válido.
 *
 * @example
 * const userId = await getSessionUserId();
 * if (userId === null) return NextResponse.json({ message: 'Inicia sesión' }, { status: 401 });
 */
export async function getSessionUserId(): Promise<number | null> {
    const session = await getServerSession(authOptions);
    // Con la sesión de otra versión o a medias, `user` o `id` podrían faltar aunque el tipo diga que no.
    const id = Number(session?.user?.id);
    return Number.isInteger(id) && id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * Usuario de la sesión con su rol, leídos de la sesión JWT en el servidor. Para las rutas que
 * comprueban el rol por su cuenta (RNF3): el middleware ya filtra, pero una API no debe fiarse
 * solo de eso.
 *
 * @returns `{ id, role }`, o `null` si no hay sesión, su id no es válido o falta el rol.
 */
export async function getSessionUser(): Promise<{ id: number; role: Role } | null> {
    const session = await getServerSession(authOptions);
    const id = Number(session?.user?.id);
    const role = session?.user?.role;
    if (!Number.isInteger(id) || id < 1 || id > MAX_ID) return null;
    if (role !== 'Cliente' && role !== 'Editor' && role !== 'Administrador') return null;
    return { id, role };
}
