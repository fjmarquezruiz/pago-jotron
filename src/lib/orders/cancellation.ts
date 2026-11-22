/**
 * Motivo (`cancellation_types.description`) con el que se anota la anulación hecha por el cliente.
 * Se busca por esta descripción y no por el id, que depende del orden en que se sembró la tabla.
 * El seed (`src/db/seed.ts`) inserta el mismo texto: cambiarlo aquí cambia las dos cosas.
 */
export const CUSTOMER_CANCELLATION_DESCRIPTION =
    'El cliente decidió cancelar el pedido antes de que se enviara.';
