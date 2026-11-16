/**
 * Días desde el alta (`products.created_at`) durante los que un producto cuenta como nuevo: lleva
 * el badge "¡NUEVO!" y es candidato a "Nuestros favoritos". La regla vive en SQL
 * (`isNewCondition` en `src/lib/db/queries.ts`) para usar la hora de la BD, la misma que pone
 * `created_at`; esta constante es el único sitio donde se cambia el plazo.
 */
export const NEW_PRODUCT_DAYS = 30;
