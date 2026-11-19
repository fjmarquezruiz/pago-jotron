'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCityLine, formatPhone, formatStreetLine } from '@/lib/checkout/address';
import type { UserAddress } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

const cardBase =
    'relative flex min-h-54 min-w-0 flex-1 rounded-sm border border-border bg-background p-6 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring';
/**
 * Seleccionada: borde de 2 px `ring` (Figma). El segundo píxel es un anillo interior (`ring-inset`),
 * que no ocupa sitio: el contenido no se mueve al seleccionar.
 */
const cardSelected = 'border-ring ring-1 ring-ring ring-inset';

interface AddressCardProps {
    /** La dirección que enseña la tarjeta. */
    address: UserAddress;
    /** `true` si es la dirección elegida: borde de 2 px `ring`. */
    selected?: boolean;
}

/**
 * Tarjeta de una dirección guardada (Figma: saved-address-card). Va dentro de un `RadioGroup`
 * (`AddressCardGroup`): la cabecera tiene la insignia del tipo (Envío o Facturación) a la izquierda
 * y el radio a la derecha, y el radio se estira sobre toda la tarjeta, así que se puede pulsar en
 * cualquier punto y las flechas del teclado cambian de tarjeta. El nombre y la dirección son la
 * descripción accesible del radio.
 *
 * @example
 * <RadioGroup value="3" onValueChange={...}>
 *     <AddressCard address={address} selected />
 * </RadioGroup>
 */
export function AddressCard({ address, selected = false }: AddressCardProps) {
    const id = React.useId();
    const nameId = `${id}-name`;
    const bodyId = `${id}-body`;
    return (
        <div
            data-selected={selected || undefined}
            className={cn(cardBase, selected && cardSelected)}
        >
            <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Badge tone="neutral" variant="solid" size="sm">
                        {address.addressType}
                    </Badge>
                    <RadioGroupItem
                        size="lg"
                        value={String(address.id)}
                        aria-labelledby={nameId}
                        aria-describedby={bodyId}
                        className="after:absolute after:inset-0 after:rounded-sm after:content-['']"
                    />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <p id={nameId} className="text-base font-medium">
                            {address.recipientName}
                        </p>
                        <div id={bodyId} className="text-sm text-muted-foreground">
                            <p>{formatStreetLine(address)}</p>
                            <p>{formatCityLine(address)}</p>
                            <p>{address.country}</p>
                        </div>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                        T: {formatPhone(address.phone)}
                    </p>
                </div>
            </div>
        </div>
    );
}

interface AddAddressCardProps {
    /** `true` si el formulario de nueva dirección está abierto: borde sólido de 2 px `ring`. */
    active?: boolean;
    /** Se llama al pulsar la tarjeta. */
    onClick: () => void;
}

/**
 * Tarjeta "Añadir nueva dirección" (Figma: Frame con borde discontinuo): un `IconButton` "+" y el
 * texto. En reposo, borde discontinuo de 1 px; con `active`, sólido de 2 px `ring`. El botón se
 * estira sobre toda la tarjeta y lleva `aria-pressed`: pulsado = el formulario está abierto.
 *
 * @example
 * <AddAddressCard active={adding} onClick={() => setAdding((value) => !value)} />
 */
export function AddAddressCard({ active = false, onClick }: AddAddressCardProps) {
    return (
        <div
            className={cn(
                'relative flex min-h-54 min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-sm border p-6 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                active ? cardSelected : 'border-dashed border-border',
            )}
        >
            <IconButton
                variant="ghost"
                type="button"
                size="lg"
                aria-label="Añadir nueva dirección"
                aria-pressed={active}
                onClick={onClick}
                // El botón cubre toda la tarjeta; el foco lo pinta la tarjeta (`has-[:focus-visible]`).
                className="after:absolute after:inset-0 after:rounded-sm after:content-[''] focus-visible:outline-none"
            >
                <Plus aria-hidden="true" />
            </IconButton>
            <p aria-hidden="true" className="text-base font-medium text-muted-foreground">
                Añadir nueva dirección
            </p>
        </div>
    );
}

interface AddressCardGroupProps {
    /** Direcciones guardadas, en el orden en que se enseñan. */
    addresses: readonly UserAddress[];
    /** Id de la dirección elegida; `null` si no hay ninguna (o se está añadiendo una nueva). */
    value: number | null;
    /** Se llama con el id de la dirección que el usuario elige. */
    onValueChange: (id: number) => void;
    /** Si se pasa, añade al final la tarjeta "Añadir nueva dirección". */
    onAdd?: () => void;
    /** `true` si el formulario de nueva dirección está abierto (marca la tarjeta de añadir). */
    adding?: boolean;
    /** Nombre accesible del grupo, por ejemplo "Dirección de envío". */
    'aria-label': string;
    className?: string;
}

/**
 * Fila de tarjetas de dirección (Figma: saved-addresses-row): un grupo de radios (`RadioGroup`, con
 * flechas y foco itinerante de Radix) con una tarjeta por dirección y, opcionalmente, la de añadir
 * una nueva. Tres columnas en escritorio (`xl`), dos en `sm` y una debajo.
 *
 * La tarjeta "Añadir" no es un radio sino un botón de alternar, pero va dentro de la misma rejilla
 * para que ocupe su sitio en la fila.
 *
 * @example
 * <AddressCardGroup
 *     aria-label="Dirección de envío"
 *     addresses={addresses}
 *     value={shippingAddressId}
 *     onValueChange={selectShippingAddress}
 *     onAdd={() => setAdding(true)}
 *     adding={adding}
 * />
 */
export function AddressCardGroup({
    addresses,
    value,
    onValueChange,
    onAdd,
    adding = false,
    className,
    ...props
}: AddressCardGroupProps) {
    return (
        <RadioGroup
            aria-label={props['aria-label']}
            orientation="horizontal"
            value={value === null ? '' : String(value)}
            onValueChange={(next) => onValueChange(Number(next))}
            className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', className)}
        >
            {addresses.map((address) => (
                <AddressCard key={address.id} address={address} selected={address.id === value} />
            ))}
            {onAdd && <AddAddressCard active={adding} onClick={onAdd} />}
        </RadioGroup>
    );
}
