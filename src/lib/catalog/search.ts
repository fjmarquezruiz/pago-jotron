/**
 * Escapa los caracteres con significado propio en un `LIKE` (`%`, `_` y la barra `\`), para que
 * lo que escribe la persona se busque tal cual: "100%" no es "100 y lo que sea".
 *
 * @param text - Texto de búsqueda.
 * @returns El texto con esos caracteres precedidos de `\`, el escape por defecto de MySQL y TiDB.
 *
 * @example
 * escapeLike('100%_'); // '100\\%\\_'
 */
export function escapeLike(text: string): string {
    return text.replace(/[\\%_]/g, '\\$&');
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
