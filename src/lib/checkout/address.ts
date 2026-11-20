import type { UserAddress } from '@/lib/db/queries';

/** Lo que necesita pintar una dirección: un subconjunto de `UserAddress`. */
export type AddressLike = Pick<
    UserAddress,
    | 'recipientName'
    | 'phone'
    | 'streetType'
    | 'streetName'
    | 'number'
    | 'floor'
    | 'postalCode'
    | 'city'
    | 'country'
>;

/**
 * Teléfono para mostrar, con el prefijo y en grupos de tres cifras (`+34 600 000 000`). Si no son
 * 9 dígitos (no debería pasar: se guarda normalizado), lo devuelve tal cual.
 *
 * @param phone - Los 9 dígitos guardados (`'600000000'`).
 * @returns El teléfono con prefijo.
 *
 * @example
 * formatPhone('600000000'); // '+34 600 000 000'
 */
export function formatPhone(phone: string): string {
    return /^\d{9}$/.test(phone) ? `+34 ${phone.replace(/(\d{3})(?=\d)/g, '$1 ')}` : phone;
}

/**
 * Línea de la calle de la tarjeta de dirección (Figma: `Calle de Alcalá, 12`); el piso, si lo hay,
 * va detrás.
 *
 * @param address - La dirección.
 * @returns La calle, el número y el piso.
 *
 * @example
 * formatStreetLine({ streetType: 'Calle', streetName: 'de Alcalá', number: '12', floor: '3º B' });
 * // 'Calle de Alcalá, 12, 3º B'
 */
export function formatStreetLine(
    address: Pick<AddressLike, 'streetType' | 'streetName' | 'number' | 'floor'>,
): string {
    const { streetType, streetName, number, floor } = address;
    return [`${streetType} ${streetName}`, number, floor].filter(Boolean).join(', ');
}

/**
 * Línea de localidad de la tarjeta de dirección (Figma: `Madrid, 28014`).
 *
 * @example
 * formatCityLine({ city: 'Madrid', postalCode: '28014' }); // 'Madrid, 28014'
 */
export function formatCityLine(address: Pick<AddressLike, 'city' | 'postalCode'>): string {
    return `${address.city}, ${address.postalCode}`;
}

/**
 * Las dos líneas de dirección del bloque "Entrega a" de la confirmación (Figma: `Calle de la
 * Encina 12, 4B` y `29001 Málaga, España`).
 *
 * @param address - La dirección.
 * @returns La calle con número y piso, y el código postal con localidad y país.
 *
 * @example
 * formatDeliveryAddress({ streetType: 'Calle', streetName: 'de la Encina', number: '12', floor: '4B',
 *     postalCode: '29001', city: 'Málaga', country: 'España' });
 * // { street: 'Calle de la Encina 12, 4B', locality: '29001 Málaga, España' }
 */
export function formatDeliveryAddress(
    address: Pick<
        AddressLike,
        'streetType' | 'streetName' | 'number' | 'floor' | 'postalCode' | 'city' | 'country'
    >,
): { street: string; locality: string } {
    const { streetType, streetName, number, floor, postalCode, city, country } = address;
    return {
        street: `${streetType} ${streetName} ${number}${floor ? `, ${floor}` : ''}`,
        locality: `${postalCode} ${city}, ${country}`,
    };
}
