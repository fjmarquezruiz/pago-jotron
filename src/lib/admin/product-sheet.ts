/**
 * Reglas puras de la ficha del producto del panel (CU9, punto 3b): categorías y etiquetas de cata
 * que se eligen por nombre, y los textos y números opcionales que llegan del formulario. Sin acceso
 * a la BD, para poder probarlas.
 */

/** Clave con la que se comparan dos nombres: sin mayúsculas ni espacios de los extremos. */
export function nameKey(name: string): string {
    return name.trim().toLowerCase();
}

/**
 * Separa los nombres elegidos en los que ya existen y los que hay que crear. La comparación no
 * distingue mayúsculas (igual que el índice único de la BD).
 *
 * @param chosen - Nombres que envía el formulario.
 * @param existing - Filas que ya hay (`id` y `name`).
 * @returns `known`: ids de los que existen (sin repetir, en el orden recibido); `toCreate`: nombres
 * nuevos tal como los escribió la persona.
 */
export function splitKnownNames(
    chosen: readonly string[],
    existing: readonly { id: number; name: string }[],
): { known: number[]; toCreate: string[] } {
    const byKey = new Map(existing.map((row) => [nameKey(row.name), row.id]));
    const known: number[] = [];
    const toCreate: string[] = [];
    const seen = new Set<string>();
    for (const name of chosen) {
        const key = nameKey(name);
        if (seen.has(key)) continue;
        seen.add(key);
        const id = byKey.get(key);
        if (id === undefined) toCreate.push(name.trim());
        else known.push(id);
    }
    return { known, toCreate };
}

/** Un texto opcional del formulario como columna: vacío es `NULL`. */
export function textOrNull(value: string): string | null {
    const text = value.trim();
    return text === '' ? null : text;
}

/** Un decimal opcional del formulario como columna `DECIMAL(5,2)`: `null` es `NULL`. */
export function decimalOrNull(value: number | null): string | null {
    return value === null ? null : value.toFixed(2);
}
