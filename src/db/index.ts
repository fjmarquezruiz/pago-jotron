import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

/** Conexión de callbacks de `mysql2`, la que llega en el evento `connection` del pool. */
type CallbackConnection = import('mysql2').Connection;

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

/**
 * Crea el pool y fuerza la hora de cada conexión a UTC. Las columnas `datetime` llegan como texto
 * sin zona y `status.ts` las lee como UTC (plazo de 24 h, bloqueo a los 15 días): si la sesión de
 * MySQL o de TiDB estuviera en otra zona, `CURRENT_TIMESTAMP` se guardaría en esa hora y los
 * plazos se desplazarían.
 */
function createPool(): mysql.Pool {
    const created = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 5,
        ssl:
            process.env.DATABASE_SSL === 'true'
                ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
                : undefined,
    });
    // Se ejecuta antes de que la conexión se entregue: sus consultas ya la ven en UTC. En
    // ejecución el evento trae la conexión de callbacks de `mysql2`, aunque los tipos de
    // `mysql2/promise` digan que es la de promesas.
    created.on('connection', (connection) => {
        (connection as unknown as CallbackConnection).query("SET time_zone = '+00:00'", (error) => {
            if (error)
                console.error('No se pudo fijar la zona horaria de la conexión a UTC', error);
        });
    });
    return created;
}

/** Pool de conexiones a MySQL, compartido entre recargas en desarrollo. */
export const pool = globalForDb.pool ?? createPool();
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
