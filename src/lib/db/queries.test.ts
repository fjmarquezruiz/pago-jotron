import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { describe, expect, it, vi } from 'vitest';
import { visibleProductsCondition } from './queries';

// `queries.ts` importa el cliente de BD; aquí solo se construye SQL, sin conectar.
vi.mock('@/db', () => ({ db: {} }));

describe('visibleProductsCondition', () => {
    it('exige que no estén bloqueados el producto, su bodega ni su D.O.', () => {
        const { sql, params } = new MySqlDialect().sqlToQuery(visibleProductsCondition());

        expect(sql).toBe(
            '(`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?)',
        );
        expect(params).toEqual([false, false, false]);
    });
});
