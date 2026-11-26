import '@/lib/validations/locale';
import { z } from 'zod';
import {
    CLASSIFICATION_VALUES,
    type AdminDenominationFilters,
    type Classification,
} from '@/lib/admin/denominations';

/** Página más alta que se acepta: más allá no hay listado real y evita un `offset` enorme. */
export const ADMIN_DENOMINATIONS_MAX_PAGE = 10_000;

/** Texto de búsqueda máximo (el nombre mide 100 en la columna). */
const SEARCH_MAX = 100;

/** Un parámetro opcional: si no es válido (o viene repetido), no filtra en lugar de dar error. */
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const pageSchema = optional(
    z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .pipe(z.number().int().min(1).max(ADMIN_DENOMINATIONS_MAX_PAGE)),
);

const searchParamsSchema = z.object({
    pagina: pageSchema,
    region: optional(z.string().trim().min(1).max(100)),
    q: optional(z.string().trim().min(1).max(SEARCH_MAX)),
});

/**
 * Lee los `searchParams` de `/admin/denominaciones` (`?pagina=2&region=Málaga&q=sierras`). Nunca
 * falla: lo que no es válido se ignora.
 *
 * @param input - `searchParams` de la página.
 * @returns La página (1 por defecto) y los filtros que sí eran válidos.
 */
export function parseAdminDenominationParams(
    input: Record<string, string | string[] | undefined>,
): AdminDenominationFilters & { page: number } {
    const parsed = searchParamsSchema.parse(input);
    return {
        page: parsed.pagina ?? 1,
        ...(parsed.region && { region: parsed.region }),
        ...(parsed.q && { q: parsed.q }),
    };
}

/**
 * Lee la página de la tabla «Bodegas relacionadas» de una ficha (`?pagina=2`). Nunca falla.
 *
 * @param input - `searchParams` de la página.
 * @returns La página pedida, 1 por defecto.
 */
export function parseRelatedPage(input: Record<string, string | string[] | undefined>): number {
    return z.object({ pagina: pageSchema }).parse(input).pagina ?? 1;
}

/** Texto opcional: sin espacios en los extremos, con un máximo y `null` si queda vacío. */
const optionalText = (label: string, max: number) =>
    z
        .string(`${label}: escribe un texto`)
        .trim()
        .max(max, `${label} admite como mucho ${max} caracteres`)
        .nullish()
        .transform((value) => value || null);

/** Año de fundación opcional: entero de 4 cifras, hasta el año en curso, o vacío (`null`). */
const optionalYear = z
    .union([z.string('El año de fundación: escribe un número'), z.number()])
    .nullish()
    .transform((value) => (value === null || value === undefined ? '' : String(value).trim()))
    .refine((value) => value === '' || /^\d{4}$/.test(value), 'Escribe un año de cuatro cifras')
    .refine(
        (value) => value === '' || Number(value) <= new Date().getFullYear(),
        'El año no puede ser futuro',
    )
    .transform((value) => (value === '' ? null : Number(value)));

/** Dirección web opcional: debe empezar por `http://` o `https://`. */
const optionalWebsite = z
    .string('El sitio web: escribe un texto')
    .trim()
    .max(255, 'El sitio web admite como mucho 255 caracteres')
    .nullish()
    .transform((value) => value ?? '')
    .refine(
        (value) => value === '' || /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(value),
        'Escribe una dirección que empiece por http:// o https://',
    )
    .transform((value) => value || null);

/**
 * Formulario de denominación y cuerpo de `POST /api/admin/denominaciones` y `PATCH
 * /api/admin/denominaciones/[id]` (columnas de `guarantees_of_origin`): el nombre es obligatorio
 * (100, único) y la clasificación es una de las cinco del enum; el resto es opcional y vacío se
 * guarda como `NULL`. Entrada: textos tal como los escribe la persona; salida: lo que se guarda.
 * `is_blocked` NO va aquí: lo cambia solo el administrador con `denominationBlockSchema`.
 */
export const denominationFormSchema = z
    .object({
        name: z
            .string('El nombre: escribe un texto')
            .trim()
            .min(1, 'El nombre de la denominación es obligatorio')
            .max(100, 'El nombre admite como mucho 100 caracteres'),
        foundedYear: optionalYear,
        classification: z
            .union([z.enum(CLASSIFICATION_VALUES), z.literal('')])
            .refine((value): value is Classification => value !== '', 'Elige una clasificación'),
        regulatoryCouncil: optionalText('El consejo regulador', 150),
        region: optionalText('La región geográfica', 100),
        website: optionalWebsite,
        description: optionalText('La descripción', 5000),
    })
    .strict();

/** Lo que escribe la persona en el formulario (todo son textos). */
export type DenominationFormValues = z.input<typeof denominationFormSchema>;

/** Lo que se guarda en `guarantees_of_origin`, ya validado. */
export type DenominationInput = z.output<typeof denominationFormSchema>;

/** Valores de un formulario de alta: todo vacío; la clasificación se elige. */
export const EMPTY_DENOMINATION_FORM: DenominationFormValues = {
    name: '',
    foundedYear: '',
    classification: '',
    regulatoryCouncil: '',
    region: '',
    website: '',
    description: '',
};

/** Cuerpo de `PATCH /api/admin/denominaciones/[id]/ventas`: el estado de venta nuevo (`is_blocked`). */
export const denominationBlockSchema = z.object({ isBlocked: z.boolean() }).strict();
