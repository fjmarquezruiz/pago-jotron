/** Lo que la ficha necesita de una presentación (fila de `product_variants`). */
export interface PresentationInput {
    format: string;
    capacity: number;
    capacityUnit: 'ml' | 'g';
}

const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

/**
 * Texto de una presentación como lo pinta la ficha: formato y capacidad. Los mililitros pasan a
 * centilitros (`750` → `75 cl`, `375` → `37,5 cl`) y los gramos se dejan como están.
 *
 * @param presentation - Formato, capacidad y unidad de la presentación.
 * @returns El texto, por ejemplo `Botella 75 cl` o `Caja 500 g`.
 *
 * @example
 * formatPresentation({ format: 'Media botella', capacity: 375, capacityUnit: 'ml' });
 * // 'Media botella 37,5 cl'
 */
export function formatPresentation({ format, capacity, capacityUnit }: PresentationInput): string {
    const amount =
        capacityUnit === 'ml'
            ? `${numberFormat.format(capacity / 10)} cl`
            : `${numberFormat.format(capacity)} g`;
    return `${format} ${amount}`;
}

/**
 * Presentación que queda seleccionada al abrir la ficha: la primera con stock. Si todas están
 * agotadas, la primera, para que la ficha se vea como agotada en lugar de vacía.
 *
 * @param variants - Presentaciones en el orden en que se muestran.
 * @returns La presentación elegida, o `undefined` si la lista está vacía.
 *
 * @example
 * pickDefaultVariant([{ stock: 0 }, { stock: 4 }]); // { stock: 4 }
 */
export function pickDefaultVariant<T extends { stock: number }>(
    variants: readonly T[],
): T | undefined {
    return variants.find((variant) => variant.stock > 0) ?? variants[0];
}

/**
 * Aviso que acompaña a una presentación agotada. Si queda otra con stock, invita a elegirla;
 * si no queda ninguna, dice que no hay nada ahora mismo. No promete avisos de reposición, que
 * no existen.
 *
 * @param variants - Todas las presentaciones a la venta del producto.
 * @returns El texto del aviso.
 *
 * @example
 * soldOutMessage([{ stock: 0 }, { stock: 3 }]);
 * // 'Esta presentación está agotada. Elige otro formato o vuelve más adelante.'
 */
export function soldOutMessage(variants: readonly { stock: number }[]): string {
    return variants.some((variant) => variant.stock > 0)
        ? 'Esta presentación está agotada. Elige otro formato o vuelve más adelante.'
        : 'Ahora mismo no nos queda. Vuelve más adelante.';
}
