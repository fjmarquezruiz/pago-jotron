'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { PHONE_PREFIX_WIDTH, SPAIN_PREFIX } from '@/components/shop/contact-form';
import { Field, FieldControl, FieldLabel, FieldMessage } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ADDRESS_COUNTRY, ADDRESS_TYPES, STREET_TYPES } from '@/lib/validations/address';
import type { DatosFormValues } from '@/lib/validations/checkout-form';

/** Etiqueta de los campos de la dirección: 14/20 medium `muted-foreground` (Figma: Field size md). */
const labelClassName = 'text-muted-foreground';

/** Identificador del grupo de radios "Tipo de dirección" (lo enlaza su etiqueta). */
const TYPE_LABEL_ID = 'new-address-type-label';

function noop() {}

/**
 * Formulario de nueva dirección (Figma: frame v2, fieldset 2296:23220). Rejilla de 4 columnas desde
 * `md` (una por debajo), campos de 40 px (`size="md"`, más pequeños que los de contacto) y el
 * orden visual de la spec: tipo de vía, nombre de la vía, número, piso y puerta, código postal,
 * ciudad, provincia, país, teléfono y tipo de dirección (radios Envío / Facturación).
 *
 * No lleva botones: se guarda al pulsar "Continuar pago" en el resumen (`DatosContent`). Hay que
 * pintarlo dentro de un `FormProvider` con `DatosFormValues`.
 *
 * - **Número y teléfono**: Figma los marca "Opcional", pero la API los exige, así que son
 *   obligatorios y no llevan el indicador.
 * - **Provincia**: es visible y editable como en el diseño, pero el servidor la recalcula del
 *   código postal (`provinceFromPostalCode`): lo que se escriba aquí no se envía.
 * - **País**: solo España.
 * - **Tipo de vía**: desplegable con los tipos que acepta la API (`STREET_TYPES`), no texto libre.
 *
 * @example
 * <FormProvider {...form}><AddressFormFields /></FormProvider>
 */
export function AddressFormFields() {
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<DatosFormValues>();

    return (
        <fieldset className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-4">
            <legend className="sr-only">Nueva dirección</legend>

            <Field size="md" invalid={!!errors.streetType} className="md:col-span-2">
                <FieldLabel className={labelClassName}>Tipo de vía</FieldLabel>
                <Controller
                    control={control}
                    name="streetType"
                    render={({ field }) => (
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                            <FieldControl>
                                <SelectTrigger ref={field.ref} onBlur={field.onBlur} size="md">
                                    <SelectValue placeholder="p. ej., Calle" />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent>
                                {STREET_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                <FieldMessage>{errors.streetType?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.streetName} className="md:col-span-2">
                <FieldLabel className={labelClassName}>Nombre de la vía</FieldLabel>
                <FieldControl>
                    <Input
                        size="md"
                        autoComplete="address-line1"
                        placeholder="p. ej., Larios"
                        {...register('streetName')}
                    />
                </FieldControl>
                <FieldMessage>{errors.streetName?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.number} className="md:col-span-2">
                <FieldLabel className={labelClassName}>Número</FieldLabel>
                <FieldControl>
                    <Input size="md" placeholder="00" {...register('number')} />
                </FieldControl>
                <FieldMessage>{errors.number?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.floor}>
                <FieldLabel
                    indicator="optional"
                    className={`${labelClassName} w-full [&>span]:ml-auto`}
                >
                    Piso y puerta
                </FieldLabel>
                <FieldControl>
                    <Input
                        size="md"
                        autoComplete="address-line2"
                        placeholder="p. ej., 3º B"
                        {...register('floor')}
                    />
                </FieldControl>
                <FieldMessage>{errors.floor?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.postalCode}>
                <FieldLabel className={labelClassName}>Código postal</FieldLabel>
                <FieldControl>
                    <Input
                        size="md"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000"
                        {...register('postalCode')}
                    />
                </FieldControl>
                <FieldMessage>{errors.postalCode?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.city} className="md:col-span-2">
                <FieldLabel className={labelClassName}>Ciudad</FieldLabel>
                <FieldControl>
                    <Input
                        size="md"
                        autoComplete="address-level2"
                        placeholder="p.ej. Málaga"
                        {...register('city')}
                    />
                </FieldControl>
                <FieldMessage>{errors.city?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.province}>
                <FieldLabel className={labelClassName}>Provincia</FieldLabel>
                <FieldControl>
                    <Input
                        size="md"
                        autoComplete="address-level1"
                        placeholder="p.ej. Málaga"
                        {...register('province')}
                    />
                </FieldControl>
                <FieldMessage>{errors.province?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.country}>
                <FieldLabel className={labelClassName}>País</FieldLabel>
                <Controller
                    control={control}
                    name="country"
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FieldControl>
                                <SelectTrigger ref={field.ref} onBlur={field.onBlur} size="md">
                                    <SelectValue />
                                </SelectTrigger>
                            </FieldControl>
                            <SelectContent>
                                <SelectItem value={ADDRESS_COUNTRY}>{ADDRESS_COUNTRY}</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                <FieldMessage>{errors.country?.message}</FieldMessage>
            </Field>

            <Field size="md" invalid={!!errors.addressPhone} className="md:col-span-2">
                <FieldLabel className={labelClassName}>Teléfono</FieldLabel>
                <FieldControl>
                    <PhoneInput
                        size="md"
                        prefix="+34"
                        onPrefixChange={noop}
                        prefixes={SPAIN_PREFIX}
                        className={PHONE_PREFIX_WIDTH}
                        placeholder="000-000-000"
                        {...register('addressPhone')}
                    />
                </FieldControl>
                <FieldMessage>{errors.addressPhone?.message}</FieldMessage>
            </Field>

            <div className="flex flex-col gap-2 md:col-span-2 md:col-start-1">
                <p id={TYPE_LABEL_ID} className="text-sm font-medium text-muted-foreground">
                    Tipo de dirección
                </p>
                <Controller
                    control={control}
                    name="addressType"
                    render={({ field }) => (
                        <RadioGroup
                            aria-labelledby={TYPE_LABEL_ID}
                            orientation="horizontal"
                            value={field.value}
                            onValueChange={field.onChange}
                            className="gap-x-6"
                        >
                            {ADDRESS_TYPES.map((type) => (
                                <div key={type} className="flex min-h-6 items-center gap-2">
                                    <RadioGroupItem
                                        size="md"
                                        id={`new-address-type-${type}`}
                                        value={type}
                                        ref={type === ADDRESS_TYPES[0] ? field.ref : undefined}
                                    />
                                    <Label htmlFor={`new-address-type-${type}`}>{type}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                />
            </div>
        </fieldset>
    );
}
