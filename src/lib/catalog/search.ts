/**
 * Carácter de escape de los `LIKE` del catálogo (`... like ? escape '!'`). Se declara en la
 * consulta en vez de usar la barra `\`, que solo escapa con el `sql_mode` por defecto: con
 * `NO_BACKSLASH_ESCAPES` la barra pasa a ser un carácter normal y el `LIKE` buscaría otra cosa en
 * silencio. `!` no tiene significado especial en ningún modo.
 */
export const LIKE_ESCAPE = '!';

/**
 * Escapa los caracteres con significado propio en un `LIKE` (`%`, `_` y el propio carácter de
 * escape), para que lo que escribe la persona se busque tal cual: "100%" no es "100 y lo que
 * sea". La consulta debe llevar `escape '!'` (`LIKE_ESCAPE`).
 *
 * @param text - Texto de búsqueda.
 * @returns El texto con esos caracteres precedidos de `!`.
 *
 * @example
 * escapeLike('100%_!'); // '100!%!_!!'
 */
export function escapeLike(text: string): string {
    return text.replace(/[!%_]/g, `${LIKE_ESCAPE}$&`);
}

/**
 * Patrón de `LIKE` que busca el texto en cualquier parte (`%texto%`). El texto se recorta y se
 * escapa; la comparación no distingue mayúsculas ni acentos si la collation de la columna tampoco
 * lo hace (`utf8mb4_0900_ai_ci`).
 *
 * @param text - Texto de búsqueda, normalmente `q` ya validado.
 * @returns El patrón, o `undefined` si no hay nada que buscar (vacío o solo espacios).
 *
 * @example
 * searchPattern(' tinto '); // '%tinto%'
 * searchPattern('   ');     // undefined
 */
export function searchPattern(text: string | undefined): string | undefined {
    const trimmed = text?.trim();
    return trimmed ? `%${escapeLike(trimmed)}%` : undefined;
}
