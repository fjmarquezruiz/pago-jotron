import '@/lib/validations/locale';
import { z } from 'zod';
import type { AdminWineryFilters } from '@/lib/admin/wineries';
import { WINERY_DEFAULT_COUNTRY } from '@/lib/admin/wineries';

/** Página más alta que se acepta: más allá no hay listado real y evita un `offset` enorme. */
export const ADMIN_WINERIES_MAX_PAGE = 10_000;

/** Texto de búsqueda máximo (un nombre de bodega cabe de sobra: la columna mide 100). */
const SEARCH_MAX = 100;

/** Un parámetro opcional: si no es válido (o viene repetido), no filtra en lugar de dar error. */
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const searchParamsSchema = z.object({
    pagina: optional(
        z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().int().min(1).max(ADMIN_WINERIES_MAX_PAGE)),
    ),
    region: optional(z.string().trim().min(1).max(100)),
    q: optional(z.string().trim().min(1).max(SEARCH_MAX)),
});

/**
 * Lee los `searchParams` de `/admin/bodegas` (`?pagina=2&region=Ronda&q=lustau`). Nunca falla: lo
 * que no es válido (página `0`, un parámetro repetido, una búsqueda vacía o demasiado larga) se
 * ignora.
 *
 * @param input - `searchParams` de la página.
 * @returns La página (1 por defecto) y los filtros que sí eran válidos.
 */
export function parseAdminWineryParams(
    input: Record<string, string | string[] | undefined>,
): AdminWineryFilters & { page: number } {
    const parsed = searchParamsSchema.parse(input);
    return {
        page: parsed.pagina ?? 1,
        ...(parsed.region && { region: parsed.region }),
        ...(parsed.q && { q: parsed.q }),
    };
}

/**
 * Texto opcional: sin espacios en los extremos, con un máximo (el de la columna) y `null` si queda
 * vacío (las columnas aceptan `NULL`).
 */
const optionalText = (label: string, max: number) =>
    z
        .string(`${label}: escribe un texto`)
        .trim()
        .max(max, `${label} admite como mucho ${max} caracteres`)
        .nullish()
        .transform((value) => value || null);

/** Teléfono español de 9 dígitos, con o sin prefijo, o vacío (`null`). Se guarda con el prefijo `+34`. */
const optionalPhone = z
    .string('El teléfono: escribe un texto')
    .trim()
    .nullish()
    .transform((value) => value ?? '')
    .transform((value) => value.replace(/[\s.-]/g, '').replace(/^(\+34|0034)/, ''))
    .refine(
        (value) => value === '' || /^[6-9]\d{8}$/.test(value),
        'Introduce un teléfono español de 9 dígitos',
    )
    .transform((value) => (value ? `+34${value}` : null));

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

/** Correo opcional (la columna mide 100). */
const optionalEmail = z
    .string('El correo: escribe un texto')
    .trim()
    .max(100, 'El correo admite como mucho 100 caracteres')
    .nullish()
    .transform((value) => value ?? '')
    .refine(
        (value) => value === '' || z.email().safeParse(value).success,
        'Introduce un correo electrónico válido',
    )
    .transform((value) => value || null);

/**
 * Formulario de bodega y cuerpo de `POST /api/admin/bodegas` y `PATCH /api/admin/bodegas/[id]`
 * (columnas de `wineries`): el nombre es obligatorio (100, único); el resto es opcional y vacío se
 * guarda como `NULL`, menos el país, que por defecto es España. Entrada: textos tal como los
 * escribe la persona (los opcionales admiten también `null` o faltar); salida: lo que se guarda. `is_blocked` NO va aquí: lo cambia solo el
 * administrador con `wineryBlockSchema`. Un campo que no existe se rechaza.
 */
export const wineryFormSchema = z
    .object({
        name: z
            .string('El nombre: escribe un texto')
            .trim()
            .min(1, 'El nombre de la bodega es obligatorio')
            .max(100, 'El nombre admite como mucho 100 caracteres'),
        description: optionalText('La descripción', 5000),
        address: optionalText('La dirección', 255),
        city: optionalText('La ciudad', 100),
        province: optionalText('La provincia', 100),
        country: z
            .string('El país: escribe un texto')
            .trim()
            .max(100, 'El país admite como mucho 100 caracteres')
            .nullish()
            .transform((value) => value || WINERY_DEFAULT_COUNTRY),
        phone: optionalPhone,
        email: optionalEmail,
        website: optionalWebsite,
    })
    .strict();

/** Lo que escribe la persona en el formulario (todo son textos). */
export type WineryFormValues = z.input<typeof wineryFormSchema>;

/** Lo que se guarda en `wineries`, ya validado. */
export type WineryInput = z.output<typeof wineryFormSchema>;

/** Valores de un formulario de alta: todo vacío y España de país. */
export const EMPTY_WINERY_FORM: WineryFormValues = {
    name: '',
    description: '',
    address: '',
    city: '',
    province: '',
    country: WINERY_DEFAULT_COUNTRY,
    phone: '',
    email: '',
    website: '',
};

/** Cuerpo de `PATCH /api/admin/bodegas/[id]/ventas`: el estado de venta nuevo (`is_blocked`). */
export const wineryBlockSchema = z.object({ isBlocked: z.boolean() }).strict();
