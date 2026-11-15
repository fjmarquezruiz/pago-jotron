/** Lo que la ficha técnica necesita de un producto. Los `decimal` llegan como texto desde Drizzle. */
export interface SpecSheetInput {
    winery: { name: string };
    guaranteeOfOrigin: {
        name: string;
        classification: string;
        region: string | null;
    };
    grapes: readonly { percentage: string | null; grape: { name: string } }[];
    alcoholContent: string | null;
    agingTime: string | null;
    minTemperature: string | null;
    maxTemperature: string | null;
    production: string | null;
    vineyardAltitude: number | null;
    soilType: string | null;
    /** Rendimiento del viñedo en kg/ha. */
    yield: number | null;
    /** Presentaciones a la venta (sin las bloqueadas): de ellas sale el formato de botella. */
    variants: readonly { capacity: number; capacityUnit: 'ml' | 'g' }[];
}

/** Fila de la ficha técnica: lo que se pinta como título y como valor. */
export interface SpecRow {
    label: string;
    value: string;
}

const alcoholFormat = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
});
const temperatureFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const percentageFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
// `useGrouping: true` agrupa siempre los miles (`4.500`); por defecto, en español, solo desde 5 cifras.
const thousandsFormat = new Intl.NumberFormat('es-ES', { useGrouping: true });

/** Texto sin espacios sobrantes, o `null` si no tiene contenido. */
function clean(text: string | null): string | null {
    const trimmed = text?.trim();
    return trimmed ? trimmed : null;
}

/** `Tintilla de Rota (50%)`; sin porcentaje, solo el nombre. */
function grapeText({ percentage, grape }: SpecSheetInput['grapes'][number]): string {
    return percentage === null
        ? grape.name
        : `${grape.name} (${percentageFormat.format(Number(percentage))}%)`;
}

/** `14–16°C` con las dos temperaturas, `14°C` si son iguales o solo hay una; `null` si no hay ninguna. */
function temperatureText(min: string | null, max: string | null): string | null {
    const values = [min, max]
        .filter((value): value is string => value !== null)
        .map((value) => temperatureFormat.format(Number(value)));
    const unique = values.filter((value, index) => values.indexOf(value) === index);
    return unique.length === 0 ? null : `${unique.join('–')}°C`;
}

/**
 * Capacidades de las presentaciones en mililitros, de menor a mayor y sin repetir, como las
 * pinta el diseño: `375ml, 750ml`. Las presentaciones en gramos (pasas) no cuentan. `null` si no
 * queda ninguna.
 */
function bottleFormatText(variants: SpecSheetInput['variants']): string | null {
    const capacities = variants
        .filter((variant) => variant.capacityUnit === 'ml')
        .map((variant) => variant.capacity)
        .sort((a, b) => a - b)
        .filter((capacity, index, list) => list.indexOf(capacity) === index);
    return capacities.length === 0
        ? null
        : capacities.map((capacity) => `${capacity}ml`).join(', ');
}

/** `850 m`, `4.500 kg/ha`: un entero con miles agrupados y su unidad; `null` si no hay dato. */
function measureText(value: number | null, unit: string): string | null {
    return value === null ? null : `${thousandsFormat.format(value)} ${unit}`;
}

/**
 * Filas de la ficha técnica: bodega, denominación de origen y región; uvas, graduación, crianza,
 * temperatura de servicio y producción (el orden del diseño); altitud, suelo y rendimiento del
 * viñedo, y formato de botella al final. Las filas sin dato no se incluyen (por ejemplo, las
 * pasas no tienen graduación ni uvas, y como van en gramos tampoco formato).
 *
 * La bodega y la denominación (`DO Sierras de Málaga`) no están en el diseño: se añadieron a
 * petición del producto. Altitud, suelo y rendimiento tampoco; el rendimiento se da en kg/ha.
 *
 * El formato de botella no está en `products`: se saca de las capacidades en ml de las
 * presentaciones a la venta.
 *
 * @param product - Los datos del producto que usa la ficha técnica.
 * @returns Las filas con dato, en orden.
 *
 * @example
 * buildSpecRows(product); // [{ label: 'Graduación alcohólica', value: '14,0% vol.' }, ...]
 */
export function buildSpecRows(product: SpecSheetInput): SpecRow[] {
    const alcohol =
        product.alcoholContent === null
            ? null
            : `${alcoholFormat.format(Number(product.alcoholContent))}% vol.`;

    const rows: { label: string; value: string | null }[] = [
        { label: 'Bodega', value: clean(product.winery.name) },
        {
            label: 'Denominación de origen',
            value: clean(
                `${product.guaranteeOfOrigin.classification} ${product.guaranteeOfOrigin.name}`,
            ),
        },
        { label: 'Región', value: clean(product.guaranteeOfOrigin.region) },
        {
            label: 'Variedades de uva',
            value: product.grapes.length > 0 ? product.grapes.map(grapeText).join(', ') : null,
        },
        { label: 'Graduación alcohólica', value: alcohol },
        { label: 'Crianza', value: clean(product.agingTime) },
        {
            label: 'Temperatura de servicio',
            value: temperatureText(product.minTemperature, product.maxTemperature),
        },
        { label: 'Producción', value: clean(product.production) },
        { label: 'Altitud del viñedo', value: measureText(product.vineyardAltitude, 'm') },
        { label: 'Tipo de suelo', value: clean(product.soilType) },
        { label: 'Rendimiento', value: measureText(product.yield, 'kg/ha') },
        { label: 'Formato de botella', value: bottleFormatText(product.variants) },
    ];

    return rows.filter((row): row is SpecRow => row.value !== null);
}
