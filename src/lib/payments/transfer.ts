/** Datos de la cuenta a la que el cliente hace la transferencia. */
export interface TransferDetails {
    /** Titular de la cuenta (`BANK_TRANSFER_HOLDER`). */
    holder: string;
    /** IBAN de la cuenta (`BANK_TRANSFER_IBAN`). */
    iban: string;
}

/**
 * Indica si la transferencia bancaria se ofrece como método de pago. Es una funcionalidad de
 * MVP2: el código está, pero queda oculta (no se pinta la pestaña y la API rechaza el pedido)
 * mientras `BANK_TRANSFER_ENABLED` no valga exactamente `true`. Sin la variable, apagada.
 *
 * @returns `true` solo con `BANK_TRANSFER_ENABLED=true`.
 */
export function isTransferEnabled(): boolean {
    return process.env.BANK_TRANSFER_ENABLED?.trim() === 'true';
}

/**
 * Datos bancarios para pagar un pedido por transferencia (RF7), leídos del entorno
 * (`BANK_TRANSFER_HOLDER` y `BANK_TRANSFER_IBAN`). No hay valores por defecto: son datos reales
 * de la tienda y no deben vivir en el código. Un valor vacío o solo de espacios cuenta como que
 * falta. Con la transferencia apagada (`isTransferEnabled`), siempre `null`.
 *
 * @returns Titular e IBAN, o `null` si la transferencia está apagada o falta alguno de los dos
 * (la transferencia no se puede ofrecer).
 *
 * @example
 * const details = getTransferDetails(); // { holder: 'Bodegas Jotrón S.L.', iban: 'ES00 …' } | null
 */
export function getTransferDetails(): TransferDetails | null {
    if (!isTransferEnabled()) return null;
    const holder = process.env.BANK_TRANSFER_HOLDER?.trim();
    const iban = process.env.BANK_TRANSFER_IBAN?.trim();
    return holder && iban ? { holder, iban } : null;
}
