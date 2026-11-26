import { getTableName, sql, type SQL } from 'drizzle-orm';
import type { MySqlColumn } from 'drizzle-orm/mysql-core';

/**
 * La columna de la consulta de fuera, con su tabla delante, para usarla dentro de una subconsulta
 * correlacionada. Drizzle pinta `${columna}` sin tabla cuando la consulta tiene una sola; si la
 * subconsulta tiene una columna con el mismo nombre (`winery_id` en `wineries` y en `products`),
 * MySQL la resuelve contra la tabla de dentro y la condición es siempre verdadera (todas las filas
 * cuentan todos los productos). Calificada, apunta a la fila de fuera.
 *
 * @param column - Columna de la tabla del `FROM` de fuera.
 * @returns `` `tabla`.`columna` ``.
 *
 * @example
 * sql`(select count(*) from ${products} where ${products.wineryId} = ${outerColumn(wineries.id)})`
 */
export function outerColumn(column: MySqlColumn): SQL {
    return sql.raw(`\`${getTableName(column.table)}\`.\`${column.name}\``);
}
