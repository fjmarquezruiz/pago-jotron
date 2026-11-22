import type { InvoiceIssuer } from './types';

export type { InvoiceIssuer };

const VARIABLES = {
    name: 'INVOICE_ISSUER_NAME',
    taxId: 'INVOICE_ISSUER_TAX_ID',
    address: 'INVOICE_ISSUER_ADDRESS',
} as const;

/**
 * Datos fiscales de la tienda para las facturas (Real Decreto 1619/2012), leídos del entorno
 * (`INVOICE_ISSUER_NAME`, `INVOICE_ISSUER_TAX_ID` e `INVOICE_ISSUER_ADDRESS`). Solo se lee AL EMITIR una
 * factura (`changeOrderStatus`, al pasar a Entregado): desde ahí el emisor vive dentro de la factura
 * (`InvoiceDocument.issuer`) y descargarla no vuelve a mirar el entorno. No hay valores por
 * defecto: son datos reales de la tienda y no deben vivir en el código. Un valor vacío o solo de
 * espacios cuenta como que falta.
 *
 * @returns Nombre, NIF y domicilio del emisor.
 * @throws {Error} Si falta alguna variable; el mensaje nombra las que faltan, nunca sus valores.
 *
 * @example
 * const issuer = getInvoiceIssuer(); // { name: 'Bodegas Jotrón S.L.', taxId: 'B…', address: 'Calle …' }
 */
export function getInvoiceIssuer(): InvoiceIssuer {
    const values = {
        name: process.env[VARIABLES.name]?.trim(),
        taxId: process.env[VARIABLES.taxId]?.trim(),
        address: process.env[VARIABLES.address]?.trim(),
    };
    const missing = (Object.keys(VARIABLES) as (keyof typeof VARIABLES)[])
        .filter((key) => !values[key])
        .map((key) => VARIABLES[key]);
    if (missing.length > 0)
        throw new Error(
            `Faltan los datos fiscales del emisor de las facturas: ${missing.join(', ')}`,
        );
    return values as InvoiceIssuer;
}
