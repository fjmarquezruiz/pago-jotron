import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

/** Pool de conexiones a MySQL, compartido entre recargas en desarrollo. */
export const pool =
    globalForDb.pool ??
    mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 5,
        ssl:
            process.env.DATABASE_SSL === 'true'
                ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
                : undefined,
    });
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

/**
 * Cliente Drizzle con el esquema tipado.
 *
 * `mode: 'planetscale'` no significa que usemos PlanetScale: es el modo de la API relacional
 * (`db.query`) que resuelve los `with` de tipo `many` con subconsultas correlacionadas. El modo
 * `'default'` usa `LATERAL JOIN`, que MySQL 8.4 admite pero TiDB no. Así el mismo SQL funciona
 * en local (MySQL) y en producción (TiDB). Solo cambia el SQL generado, no los resultados.
 */
export const db = drizzle(pool, { schema, mode: 'planetscale' });
