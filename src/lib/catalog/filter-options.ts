/** Una opción de un select de filtro: el valor que va a la URL (`id`) y lo que se lee (`name`). */
export interface FilterOption {
    id: number;
    name: string;
}

/**
 * Opciones del select de añadas a partir de los años de los productos: el año es a la vez el valor
 * de la URL (`?anada=2023`) y el texto. Los productos sin añada (vinos sin cosecha, pasas) no son
 * una opción. Conserva el orden de entrada y no repite años.
 *
 * @param years - Años de `products.vintage`, con `null` para los que no tienen.
 * @returns Una opción por año distinto, en el orden recibido.
 *
 * @example
 * toVintageOptions([2025, null, 2023]); // [{ id: 2025, name: '2025' }, { id: 2023, name: '2023' }]
 */
export function toVintageOptions(years: readonly (number | null)[]): FilterOption[] {
    const seen = new Set<number>();
    const options: FilterOption[] = [];
    for (const year of years) {
        if (year === null || seen.has(year)) continue;
        seen.add(year);
        options.push({ id: year, name: String(year) });
    }
    return options;
}
