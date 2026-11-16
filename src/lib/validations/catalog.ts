import { z } from 'zod';

/**
 * Parámetros de la URL del listado (`/productos?page=2`). Un valor que no sea un entero >= 1
 * (`abc`, `0`, `-3`, `2.5`, vacío, repetido…) no da error: vale 1. El punto 4 añade aquí los
 * filtros, con la misma idea de que una URL manipulada nunca rompa la página.
 */
export const catalogSearchParamsSchema = z.object({
    page: z.coerce.number().int().min(1).catch(1),
});

/** Parámetros del listado ya validados. */
export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>;
