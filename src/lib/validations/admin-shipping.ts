import '@/lib/validations/locale';
import { z } from 'zod';

/** Mayor `shipping_types.cost` (`decimal(10,2)`). */
export const SHIPPING_COST_MAX = 99_999_999.99;

/** Mayor plazo en días (`tinyint unsigned`). */
export const SHIPPING_DAYS_MAX = 255;

const days = (what: string) =>
    z
        .number({ error: `El plazo ${what} debe ser un número` })
        .int(`El plazo ${what} debe ser un número entero`)
        .min(0, `El plazo ${what} no puede ser negativo`)
        .max(SHIPPING_DAYS_MAX, `El plazo ${what} no puede pasar de ${SHIPPING_DAYS_MAX} días`)
        .nullable();

/**
 * Cuerpo de `POST /api/admin/envios` y `PATCH /api/admin/envios/[id]`. Los campos son los de
 * `shipping_types`: nombre (`varchar(50)` único), coste en euros (`decimal(10,2)`, no negativo, dos
 * decimales como mucho; 0 = gratis), plazos mínimo y máximo en días (opcionales; la recogida no
 * tiene) y `isBlocked` (un tipo bloqueado no se ofrece en el checkout).
 */
export const shippingTypeSchema = z
    .object({
        name: z
            .string({ error: 'Escribe el nombre del tipo de envío' })
            .trim()
            .min(1, 'Escribe el nombre del tipo de envío')
            .max(50, 'El nombre no puede pasar de 50 caracteres'),
        cost: z
            .number({ error: 'El precio debe ser un número' })
            .min(0, 'El precio no puede ser negativo')
            .max(SHIPPING_COST_MAX, 'El precio es demasiado alto')
            .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
                message: 'El precio admite dos decimales como mucho',
            }),
        minDeliveryDays: days('mínimo'),
        maxDeliveryDays: days('máximo'),
        isBlocked: z.boolean({ error: 'Indica si el tipo de envío está activo' }),
    })
    .strict()
    .refine(
        ({ minDeliveryDays: min, maxDeliveryDays: max }) =>
            min === null || max === null || min <= max,
        {
            message: 'El plazo máximo debe ser igual o mayor que el mínimo',
            path: ['maxDeliveryDays'],
        },
    );

export type ShippingTypeInput = z.infer<typeof shippingTypeSchema>;

/** Valores del formulario del modal: lo que escribe la persona, como texto. */
export interface ShippingFormValues {
    name: string;
    cost: string;
    minDeliveryDays: string;
    maxDeliveryDays: string;
    isActive: boolean;
}

/** Errores del formulario por campo. */
export type ShippingFormErrors = Partial<Record<keyof ShippingFormValues, string>>;

/** Texto → número; vacío → `null`; la coma decimal vale como punto. `NaN` si no es un número. */
function toNumber(text: string): number | null {
    const trimmed = text.trim().replace(',', '.');
    return trimmed === '' ? null : Number(trimmed);
}

/**
 * Convierte lo que escribe la persona en el cuerpo de la API y lo valida con `shippingTypeSchema`.
 * El precio vacío vale 0 (envío gratis) y un plazo vacío, ninguno.
 *
 * @param values - Valores del formulario.
 * @returns El cuerpo validado, o el primer error de cada campo.
 */
export function parseShippingForm(
    values: ShippingFormValues,
): { data: ShippingTypeInput } | { errors: ShippingFormErrors } {
    const parsed = shippingTypeSchema.safeParse({
        name: values.name,
        cost: toNumber(values.cost) ?? 0,
        minDeliveryDays: toNumber(values.minDeliveryDays),
        maxDeliveryDays: toNumber(values.maxDeliveryDays),
        isBlocked: !values.isActive,
    });
    if (parsed.success) return { data: parsed.data };
    const fieldOf: Record<string, keyof ShippingFormValues> = {
        name: 'name',
        cost: 'cost',
        minDeliveryDays: 'minDeliveryDays',
        maxDeliveryDays: 'maxDeliveryDays',
        isBlocked: 'isActive',
    };
    const errors: ShippingFormErrors = {};
    for (const issue of parsed.error.issues) {
        const field = fieldOf[String(issue.path[0])];
        if (field && !errors[field]) errors[field] = issue.message;
    }
    return { errors };
}
