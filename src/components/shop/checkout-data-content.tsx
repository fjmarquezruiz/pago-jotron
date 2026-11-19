'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { ArrowRight } from 'lucide-react';
import { AddressFormFields } from '@/components/shop/address-form';
import { AddressCardGroup } from '@/components/shop/address-card';
import { CheckoutSection } from '@/components/shop/checkout-section';
import { CheckoutSteps } from '@/components/shop/checkout-steps';
import { CheckoutSummary, type ShippingChoice } from '@/components/shop/checkout-summary';
import { ContactFields } from '@/components/shop/contact-form';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HelperText } from '@/components/ui/helper-text';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    apiFieldErrors,
    contactDefaults,
    contactUnchanged,
    resolveBillingAddressId,
    resolveShippingAddressId,
    resolveShippingTypeId,
    selectionProblems,
} from '@/lib/checkout/datos';
import { formatDeliveryDate, estimatedDeliveryDate } from '@/lib/orders/delivery';
import { quoteOrder, type QuoteLineInput } from '@/lib/orders/quote';
import { provinceFromPostalCode } from '@/lib/geo/provinces';
import type { UserAddress } from '@/lib/db/queries';
import type { CheckoutProfile } from '@/lib/validations/checkout-state';
import {
    DATOS_FORM_DEFAULTS,
    toAddressRequest,
    validateDatosForm,
    type DatosFormValues,
} from '@/lib/validations/checkout-form';
import { useCheckoutStore } from '@/stores/checkout';

/** Id del `<form>`: el botón del resumen está fuera de él y lo envía con el atributo `form`. */
const FORM_ID = 'checkout-data-form';

/** Campos de la dirección nueva: se limpian sus errores al cerrar el formulario. */
const ADDRESS_FIELDS = [
    'streetType',
    'streetName',
    'number',
    'floor',
    'postalCode',
    'city',
    'province',
    'country',
    'addressPhone',
    'addressType',
] as const satisfies readonly (keyof DatosFormValues)[];

/** Campo de `PATCH /api/cuenta/perfil` → campo del formulario. */
const PROFILE_API_FIELDS = {
    name: 'name',
    lastName: 'lastName',
    phone: 'phone',
    idCard: 'idCard',
} as const;

/** Campo de `POST /api/cuenta/direcciones` → campo del formulario (la API no tiene `addressPhone`). */
const ADDRESS_API_FIELDS = {
    streetType: 'streetType',
    streetName: 'streetName',
    number: 'number',
    floor: 'floor',
    postalCode: 'postalCode',
    city: 'city',
    country: 'country',
    phone: 'addressPhone',
    addressType: 'addressType',
} as const;

const CONNECTION_ERROR =
    'No se ha podido conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const VALIDATION_BANNER = 'Corrige los errores de abajo para continuar.';

/** Pasa el error por campo de `validateDatosForm` al formato de React Hook Form. */
function toFieldErrors(errors: Partial<Record<keyof DatosFormValues, string>>) {
    return Object.fromEntries(
        Object.entries(errors).map(([field, message]) => [field, { type: 'validation', message }]),
    ) as FieldErrors<DatosFormValues>;
}

/** Lleva el foco al primer control de un grupo de tarjetas (radio o, si no hay tarjetas, su botón). */
function focusGroup(id: string) {
    document.getElementById(id)?.querySelector<HTMLElement>('[role="radio"], button')?.focus();
}

/** Lee el cuerpo de una respuesta JSON sin lanzar. */
async function readJson(response: Response): Promise<Record<string, unknown> | null> {
    const body: unknown = await response.json().catch(() => null);
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
}

interface CheckoutDataContentProps {
    /** Datos de contacto de la cuenta (`GET /api/cuenta/perfil`). */
    profile: CheckoutProfile;
    /** Direcciones vigentes de la cuenta. */
    addresses: readonly UserAddress[];
    /** Modalidades de envío con plazo (`deliveryOptions`). */
    shippingOptions: readonly ShippingChoice[];
    /** Líneas del carrito con el precio y el IVA que da el servidor, para el presupuesto. */
    quoteLines: readonly QuoteLineInput[];
}

/**
 * Contenido de la página "Datos" (Figma: checkout-2-datos, -v2 y -error), ya con todo cargado:
 * pasos, título, formulario (contacto y dirección) y resumen del pedido.
 *
 * - **Contacto**: precargado de la cuenta y editable. Al continuar se guarda con
 *   `PATCH /api/cuenta/perfil` si ha cambiado; un 409 (NIF ya registrado) es un error del campo.
 * - **Direcciones**: la de envío se elige entre las guardadas (`selectShippingAddress`). La casilla
 *   "misma que la de envío" (marcada por defecto) usa la de envío también para facturar; si se
 *   desmarca, se elige entre las de tipo Facturación. "Añadir nueva dirección" abre el formulario
 *   (sin botones): al continuar se valida, se crea (`POST /api/cuenta/direcciones`) y se elige según
 *   su tipo. Con 0 direcciones guardadas el formulario sale abierto.
 * - **Resumen**: el envío elegido (por defecto el más barato) se guarda en el almacén; el
 *   subtotal y el total salen del presupuesto con los precios del servidor (`quoteOrder`), y la
 *   entrega estimada del plazo máximo de ese envío.
 * - **Errores**: banner "Corrige los errores…" con el paso Datos en rojo, mensaje bajo cada campo
 *   (`aria-invalid`/`aria-describedby` los pone `Field`) y foco en el primer error.
 *
 * Si todo es válido: guarda el perfil, crea la dirección si procede y va a `/checkout/pago`.
 *
 * @example
 * <CheckoutDataContent profile={profile} addresses={addresses} shippingOptions={options} quoteLines={lines} />
 */
export function CheckoutDataContent({
    profile,
    addresses,
    shippingOptions,
    quoteLines,
}: CheckoutDataContentProps) {
    const router = useRouter();

    const storedShippingType = useCheckoutStore((state) => state.shippingTypeId);
    const storedShippingAddress = useCheckoutStore((state) => state.shippingAddressId);
    const billingSame = useCheckoutStore((state) => state.billingSameAsShipping);
    const storedBillingAddress = useCheckoutStore((state) => state.billingAddressId);
    const setShippingType = useCheckoutStore((state) => state.setShippingType);
    const selectShippingAddress = useCheckoutStore((state) => state.selectShippingAddress);
    const setBillingSame = useCheckoutStore((state) => state.setBillingSame);
    const selectBillingAddress = useCheckoutStore((state) => state.selectBillingAddress);

    // Lo que se enseña sale de lo guardado ya saneado (existe, es del tipo que toca): así no hay un
    // primer pintado con una elección que desaparece. El efecto lo escribe de vuelta en el almacén.
    // Las direcciones recién creadas aún no están en `addresses` (se recargan al volver a Datos):
    // sin contarlas, este saneado borraría la elección justo antes de pasar a Pago, y Pago devolvería
    // al cliente a Datos.
    const createdAddresses = useRef<Pick<UserAddress, 'id' | 'addressType'>[]>([]);
    const knownAddresses = [
        ...addresses,
        ...createdAddresses.current.filter(({ id }) => !addresses.some((a) => a.id === id)),
    ];
    const shippingTypeId = resolveShippingTypeId(shippingOptions, storedShippingType);
    const shippingAddressId = resolveShippingAddressId(knownAddresses, storedShippingAddress);
    const billingAddressId = resolveBillingAddressId(knownAddresses, storedBillingAddress);
    useEffect(() => {
        if (shippingTypeId !== storedShippingType) setShippingType(shippingTypeId);
        if (shippingAddressId !== storedShippingAddress) selectShippingAddress(shippingAddressId);
        // La de facturación solo cuenta con la casilla desmarcada: marcada se deja como está.
        if (!billingSame && billingAddressId !== storedBillingAddress)
            selectBillingAddress(billingAddressId);
    }, [
        shippingTypeId,
        shippingAddressId,
        billingAddressId,
        billingSame,
        storedShippingType,
        storedShippingAddress,
        storedBillingAddress,
        setShippingType,
        selectShippingAddress,
        selectBillingAddress,
    ]);

    const [adding, setAdding] = useState(addresses.length === 0);
    const [attempted, setAttempted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    // El perfil guardado hasta ahora: si el usuario vuelve a intentarlo tras un fallo posterior,
    // no se repite el PATCH.
    const savedProfile = useRef(profile);

    // El esquema depende de si el formulario de dirección está abierto; el resolver lo lee al validar.
    const addingRef = useRef(adding);
    addingRef.current = adding;
    const resolver: Resolver<DatosFormValues> = async (values) => {
        const result = validateDatosForm(values, { adding: addingRef.current });
        return result.success
            ? { values, errors: {} }
            : { values: {}, errors: toFieldErrors(result.errors) };
    };
    const form = useForm<DatosFormValues>({
        defaultValues: contactDefaults(profile, DATOS_FORM_DEFAULTS),
        resolver,
    });
    const {
        handleSubmit,
        setError,
        clearErrors,
        setValue,
        watch,
        formState: { errors, dirtyFields },
    } = form;

    // La provincia se rellena sola con el código postal mientras el usuario no la toque; el
    // servidor la recalcula igualmente.
    const postalCode = watch('postalCode');
    const provinceTouched = !!dirtyFields.province;
    useEffect(() => {
        if (provinceTouched) return;
        const code = postalCode.trim();
        setValue('province', /^\d{5}$/.test(code) ? (provinceFromPostalCode(code) ?? '') : '');
    }, [postalCode, provinceTouched, setValue]);

    const newAddressType = watch('addressType');
    const problems = selectionProblems({
        adding,
        newAddressType,
        addresses,
        shippingTypeId,
        hasShippingOptions: shippingOptions.length > 0,
        shippingAddressId,
        billingSameAsShipping: billingSame,
        billingAddressId,
    });
    const shownProblems = attempted ? problems : {};
    const hasErrors =
        attempted && (Object.keys(errors).length > 0 || Object.keys(problems).length > 0);
    const bannerTitle = serverError ?? (hasErrors ? VALIDATION_BANNER : null);

    const shippingOption = shippingOptions.find((option) => option.id === shippingTypeId);
    const quote = useMemo(
        () => quoteOrder(quoteLines, shippingOption?.cost ?? '0'),
        [quoteLines, shippingOption],
    );
    const estimatedDelivery = shippingOption
        ? formatDeliveryDate(
              estimatedDeliveryDate(
                  new Date(),
                  shippingOption.maxDeliveryDays ?? shippingOption.minDeliveryDays ?? 0,
              ),
          )
        : null;

    const billingAddresses = addresses.filter((address) => address.addressType === 'Facturación');

    function closeNewAddress() {
        setAdding(false);
        clearErrors([...ADDRESS_FIELDS]);
    }

    /** Elige una dirección guardada de envío: cierra el formulario de nueva dirección sin guardar. */
    function chooseShipping(id: number) {
        selectShippingAddress(id);
        closeNewAddress();
    }

    function toggleNewAddress() {
        // Sin direcciones guardadas el formulario es la única opción: no se cierra.
        if (addresses.length === 0) return;
        if (adding) closeNewAddress();
        else setAdding(true);
    }

    /** Guarda el perfil si ha cambiado. `false` si hay que parar (el error ya está pintado). */
    async function saveProfile(contact: Parameters<typeof contactUnchanged>[1]): Promise<boolean> {
        if (contactUnchanged(savedProfile.current, contact)) return true;
        const response = await fetch('/api/cuenta/perfil', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contact),
        });
        if (response.ok) {
            savedProfile.current = { ...savedProfile.current, ...contact };
            return true;
        }
        const body = await readJson(response);
        if (response.status === 401) {
            router.push('/auth/login?callbackUrl=%2Fcheckout');
        } else if (response.status === 409) {
            setError(
                'idCard',
                { message: 'Ese NIF ya está registrado en otra cuenta' },
                { shouldFocus: true },
            );
        } else {
            const fieldErrors = apiFieldErrors(body?.errors, PROFILE_API_FIELDS);
            const entries = Object.entries(fieldErrors);
            if (response.status === 400 && entries.length > 0) {
                entries.forEach(([field, message], index) =>
                    setError(
                        field as keyof DatosFormValues,
                        { message },
                        { shouldFocus: index === 0 },
                    ),
                );
            } else {
                setServerError(
                    'No se han podido guardar tus datos de contacto. Inténtalo de nuevo.',
                );
            }
        }
        return false;
    }

    /** Crea la dirección y la elige según su tipo. `false` si hay que parar (el error ya está pintado). */
    async function createAddress(
        body: ReturnType<typeof toAddressRequest>,
        type: DatosFormValues['addressType'],
    ): Promise<boolean> {
        const response = await fetch('/api/cuenta/direcciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await readJson(response);
        const created = (json?.address as { id?: unknown } | undefined)?.id;
        if (response.status === 201 && typeof created === 'number') {
            createdAddresses.current.push({
                id: created,
                addressType: type === 'Facturación' ? 'Facturación' : 'Envío',
            });
            if (type === 'Facturación') {
                // Es una dirección de facturación: se usa para facturar, y la casilla "misma" ya no aplica.
                setBillingSame(false);
                selectBillingAddress(created);
            } else {
                selectShippingAddress(created);
            }
            return true;
        }
        if (response.status === 401) {
            router.push('/auth/login?callbackUrl=%2Fcheckout');
            return false;
        }
        const fieldErrors = apiFieldErrors(json?.errors, ADDRESS_API_FIELDS);
        const entries = Object.entries(fieldErrors);
        if (response.status === 400 && entries.length > 0) {
            entries.forEach(([field, message], index) =>
                setError(field as keyof DatosFormValues, { message }, { shouldFocus: index === 0 }),
            );
        } else {
            setServerError('No se ha podido guardar la dirección. Inténtalo de nuevo.');
        }
        return false;
    }

    async function onValid(values: DatosFormValues) {
        if (Object.keys(problems).length > 0) {
            // Los campos están bien pero falta elegir algo: el foco va a lo primero que falta.
            if (problems.shippingAddress) focusGroup('checkout-shipping-addresses');
            else if (problems.billingAddress) focusGroup('checkout-billing-addresses');
            else if (shippingOptions[0])
                // Los radios del selector de envío son de `CheckoutSummary`: `checkout-shipping-{id}`.
                document.getElementById(`checkout-shipping-${shippingOptions[0].id}`)?.focus();
            return;
        }
        const result = validateDatosForm(values, { adding });
        if (!result.success) return;

        setSaving(true);
        let navigating = false;
        try {
            if (!(await saveProfile(result.contact))) return;
            if (result.address) {
                const request = toAddressRequest(result.address, result.contact);
                if (!(await createAddress(request, result.address.addressType))) return;
            } else if (billingSame) {
                // La facturación es la dirección de envío: no se guarda otra distinta.
                selectBillingAddress(null);
            }
            navigating = true;
            router.push('/checkout/pago');
        } catch {
            setServerError(CONNECTION_ERROR);
        } finally {
            // Si se navega, el botón sigue ocupado hasta que cambie la página.
            if (!navigating) setSaving(false);
        }
    }

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        if (saving) {
            event.preventDefault();
            return;
        }
        setAttempted(true);
        setServerError(null);
        return handleSubmit(onValid)(event);
    }

    return (
        <div className="flex flex-col gap-12">
            <CheckoutSteps current={1} errorStep={bannerTitle ? 1 : undefined} />
            <div className="flex min-h-12 items-baseline gap-4">
                <h1 className="font-display text-4xl">Datos</h1>
                <p className="text-base text-muted-foreground">(Contacto y envío)</p>
            </div>
            <div className="grid gap-x-16 gap-y-12 xl:grid-cols-3">
                <FormProvider {...form}>
                    <form
                        id={FORM_ID}
                        noValidate
                        onSubmit={onSubmit}
                        className="flex min-w-0 flex-col gap-12 xl:col-span-2"
                    >
                        {bannerTitle && <Alert type="error" size="md" title={bannerTitle} />}

                        <CheckoutSection title="Información de contacto">
                            <ContactFields email={profile.email} />
                        </CheckoutSection>

                        <CheckoutSection title="Dirección de envío">
                            <div className="flex min-h-6 items-center gap-2.5">
                                <Checkbox
                                    size="lg"
                                    id="checkout-billing-same"
                                    checked={billingSame}
                                    onCheckedChange={(checked) => setBillingSame(checked === true)}
                                />
                                <Label
                                    htmlFor="checkout-billing-same"
                                    className="text-sm font-medium"
                                >
                                    La dirección de facturación es la misma que la de envío
                                </Label>
                            </div>

                            <div id="checkout-shipping-addresses" className="flex flex-col gap-4">
                                <AddressCardGroup
                                    aria-label="Dirección de envío"
                                    addresses={addresses}
                                    // Con el formulario abierto no hay ninguna tarjeta elegida (Figma: v2).
                                    value={adding ? null : shippingAddressId}
                                    onValueChange={chooseShipping}
                                    onAdd={toggleNewAddress}
                                    adding={adding}
                                />
                                {shownProblems.shippingAddress && (
                                    <HelperText type="error" size="md" showIcon role="alert">
                                        {shownProblems.shippingAddress}
                                    </HelperText>
                                )}
                            </div>

                            {!billingSame && (
                                <div
                                    id="checkout-billing-addresses"
                                    className="flex flex-col gap-4"
                                >
                                    <p
                                        id="checkout-billing-label"
                                        className="text-sm font-medium text-muted-foreground"
                                    >
                                        Dirección de facturación
                                    </p>
                                    {billingAddresses.length > 0 && (
                                        <AddressCardGroup
                                            aria-label="Dirección de facturación"
                                            addresses={billingAddresses}
                                            value={billingAddressId}
                                            onValueChange={selectBillingAddress}
                                        />
                                    )}
                                    {shownProblems.billingAddress ? (
                                        <HelperText type="error" size="md" showIcon role="alert">
                                            {shownProblems.billingAddress}
                                        </HelperText>
                                    ) : (
                                        billingAddresses.length === 0 && (
                                            <HelperText size="md">
                                                No tienes ninguna dirección de facturación. Añade
                                                una nueva con el tipo «Facturación».
                                            </HelperText>
                                        )
                                    )}
                                </div>
                            )}

                            {adding && (
                                <>
                                    <Separator />
                                    <AddressFormFields />
                                </>
                            )}
                        </CheckoutSection>
                    </form>
                </FormProvider>

                <CheckoutSummary
                    quote={quote}
                    shippingOptions={shippingOptions}
                    shippingTypeId={shippingTypeId}
                    onShippingChange={setShippingType}
                    estimatedDelivery={estimatedDelivery}
                    note={
                        shownProblems.shippingType && (
                            <HelperText type="error" size="md" showIcon role="alert">
                                {shownProblems.shippingType}
                            </HelperText>
                        )
                    }
                    cta={
                        <Button
                            type="submit"
                            form={FORM_ID}
                            variant="brand"
                            size="lg"
                            className="w-full"
                            loading={saving}
                        >
                            Continuar pago
                            <ArrowRight aria-hidden="true" />
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
