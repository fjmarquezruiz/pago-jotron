/** Datos de la cuenta a la que el cliente hace la transferencia. */
export interface TransferDetails {
    /** Titular de la cuenta (`BANK_TRANSFER_HOLDER`). */
    holder: string;
    /** IBAN de la cuenta (`BANK_TRANSFER_IBAN`). */
    iban: string;
}

/**
 * Datos bancarios para pagar un pedido por transferencia (RF7), leídos del entorno
 * (`BANK_TRANSFER_HOLDER` y `BANK_TRANSFER_IBAN`). No hay valores por defecto: son datos reales
 * de la tienda y no deben vivir en el código. Un valor vacío o solo de espacios cuenta como que
 * falta.
 *
 * @returns Titular e IBAN, o `null` si falta alguno de los dos (la transferencia no se puede ofrecer).
 *
 * @example
 * const details = getTransferDetails(); // { holder: 'Bodegas Jotrón S.L.', iban: 'ES00 …' } | null
 */
export function getTransferDetails(): TransferDetails | null {
    const holder = process.env.BANK_TRANSFER_HOLDER?.trim();
    const iban = process.env.BANK_TRANSFER_IBAN?.trim();
    return holder && iban ? { holder, iban } : null;
}
