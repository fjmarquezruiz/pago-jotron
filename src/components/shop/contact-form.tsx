'use client';

import { useFormContext } from 'react-hook-form';
import {
    Field,
    FieldControl,
    FieldDescription,
    FieldLabel,
    FieldMessage,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import type { DatosFormValues } from '@/lib/validations/checkout-form';

/**
 * Prefijo del teléfono: solo España (decisión de la tienda, igual que `phoneSchema`). Figma lo
 * dibuja como "+34" sin bandera, y el desplegable no ofrece otros.
 */
export const SPAIN_PREFIX = [{ value: '+34', label: '+34' }];

/** El prefijo de Figma mide 120 px (`w-30`); el selector compacto del sistema es `w-auto`. */
export const PHONE_PREFIX_WIDTH = '[&_button]:w-30';

/** Etiqueta de los campos de contacto: `muted-foreground` y el indicador "Opcional" pegado a la derecha (Figma: FormLabel). */
const labelClassName = 'w-full text-muted-foreground [&>span]:ml-auto';

/** Un teléfono con prefijo fijo: el selector existe porque el diseño lo dibuja, pero no cambia nada. */
function noop() {}

interface ContactFieldsProps {
    /** Correo de la cuenta. Se enseña pero no se puede editar. */
    email: string;
}

/**
 * Campos del bloque "Información de contacto" (Figma: Frame 2116:41372): nombre, apellidos,
 * correo, teléfono y CIF/NIF (opcional), en dos columnas desde `sm` y en una por debajo. Hay que
 * pintarlo dentro de un `FormProvider` con `DatosFormValues`.
 *
 * El correo es el de la cuenta (`GET /api/cuenta/perfil`) y NO es editable: es el identificador de
 * acceso y `PATCH /api/cuenta/perfil` lo ignora. Por eso va deshabilitado (estado `disabled` del
 * sistema) y fuera del formulario: no se valida ni se envía.
 *
 * @example
 * <FormProvider {...form}><ContactFields email="juan@ejemplo.com" /></FormProvider>
 */
export function ContactFields({ email }: ContactFieldsProps) {
    const {
        register,
        formState: { errors },
    } = useFormContext<DatosFormValues>();

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field size="lg" invalid={!!errors.name}>
                <FieldLabel className={labelClassName}>Nombre</FieldLabel>
                <FieldControl>
                    <Input
                        size="lg"
                        autoComplete="given-name"
                        placeholder="p.ej. Juan"
                        {...register('name')}
                    />
                </FieldControl>
                <FieldMessage>{errors.name?.message}</FieldMessage>
            </Field>

            <Field size="lg" invalid={!!errors.lastName}>
                <FieldLabel className={labelClassName}>Apellidos</FieldLabel>
                <FieldControl>
                    <Input
                        size="lg"
                        autoComplete="family-name"
                        placeholder="p.ej. García"
                        {...register('lastName')}
                    />
                </FieldControl>
                <FieldMessage>{errors.lastName?.message}</FieldMessage>
            </Field>

            <Field size="lg" disabled>
                <FieldLabel className={labelClassName}>Correo electrónico</FieldLabel>
                <FieldControl>
                    <Input
                        size="lg"
                        type="email"
                        autoComplete="email"
                        placeholder="p.ej. juan.garcia@ejemplo.com"
                        value={email}
                        disabled
                        readOnly
                    />
                </FieldControl>
            </Field>

            <Field size="lg" invalid={!!errors.phone}>
                <FieldLabel className={labelClassName}>Teléfono</FieldLabel>
                <FieldControl>
                    <PhoneInput
                        size="lg"
                        prefix="+34"
                        onPrefixChange={noop}
                        prefixes={SPAIN_PREFIX}
                        className={PHONE_PREFIX_WIDTH}
                        placeholder="000-000-000"
                        {...register('phone')}
                    />
                </FieldControl>
                <FieldMessage>{errors.phone?.message}</FieldMessage>
            </Field>

            <Field size="lg" invalid={!!errors.idCard}>
                <FieldLabel indicator="optional" className={labelClassName}>
                    CIF/NIF
                </FieldLabel>
                <FieldDescription size="xs">Solo si quieres factura completa.</FieldDescription>
                <FieldControl>
                    <Input
                        size="lg"
                        autoComplete="off"
                        placeholder="ES00 000 000"
                        {...register('idCard')}
                    />
                </FieldControl>
                <FieldMessage>{errors.idCard?.message}</FieldMessage>
            </Field>
        </div>
    );
}
