import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { describe, expect, it, vi } from 'vitest';
import { catalogCountQuery, catalogItemsQuery, visibleProductsCondition } from './queries';

// `queries.ts` importa el cliente de BD; aquí solo se construye SQL, sin conectar.
vi.mock('@/db', async () => {
    const { drizzle } = await import('drizzle-orm/mysql2');
    return { db: drizzle.mock() };
});

describe('visibleProductsCondition', () => {
    it('exige que no estén bloqueados el producto, su bodega ni su D.O.', () => {
        const { sql, params } = new MySqlDialect().sqlToQuery(visibleProductsCondition());

        expect(sql).toBe(
            '(`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?)',
        );
        expect(params).toEqual([false, false, false]);
    });
});

describe('catalogItemsQuery', () => {
    const { sql, params } = catalogItemsQuery({ page: 3, pageSize: 12 }).toSQL();

    it('une bodega, D.O. y solo las presentaciones sin bloquear', () => {
        expect(sql).toContain(
            'inner join `wineries` on `wineries`.`winery_id` = `products`.`winery_id`',
        );
        expect(sql).toContain(
            'inner join `guarantees_of_origin` on `guarantees_of_origin`.`guarantee_of_origin_id` = `products`.`guarantee_of_origin_id`',
        );
        expect(sql).toContain(
            'inner join `product_variants` on (`product_variants`.`product_id` = `products`.`product_id` and `product_variants`.`is_blocked` = ?)',
        );
    });

    it('aplica la regla de visibilidad y las tres condiciones de bloqueo', () => {
        expect(sql).toContain(
            'where (`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?)',
        );
        // presentación sin bloquear + producto, bodega y D.O. sin bloquear
        expect(params.slice(0, 4)).toEqual([false, false, false, false]);
    });

    it('pide los agregados: precio mínimo, nº de presentaciones y stock total', () => {
        expect(sql).toContain('min(`product_variants`.`price`)');
        expect(sql).toContain('count(`product_variants`.`variant_id`)');
        expect(sql).toContain('sum(`product_variants`.`stock`)');
    });

    it('agrupa por producto', () => {
        expect(sql).toMatch(/group by `products`\.`product_id`/);
    });

    it('ordena del más reciente al más antiguo, con el id de desempate', () => {
        expect(sql).toContain(
            'order by `products`.`created_at` desc, `products`.`product_id` desc',
        );
    });

    it('pagina con limit y offset: página 3 de 12 → offset 24', () => {
        expect(sql).toMatch(/limit \? offset \?$/);
        expect(params.slice(-2)).toEqual([12, 24]);
    });

    // Tras las 4 condiciones de bloqueo vienen `limit` y, si no es 0, `offset`.
    const limitAndOffset = (args: { page: number; pageSize: number }) => {
        const [limit, offset = 0] = catalogItemsQuery(args).toSQL().params.slice(4);
        return [limit, offset];
    };

    it.each([
        [{ page: 1, pageSize: 12 }, [12, 0]],
        [{ page: 2, pageSize: 5 }, [5, 5]],
        [{ page: 0, pageSize: 12 }, [12, 0]],
        [{ page: -4, pageSize: 12 }, [12, 0]],
        [{ page: 2.9, pageSize: 10.5 }, [10, 10]],
        [{ page: Number.NaN, pageSize: 12 }, [12, 0]],
        [{ page: 1, pageSize: 0 }, [1, 0]],
    ])('normaliza %j a limit/offset %j', (args, expected) => {
        expect(limitAndOffset(args)).toEqual(expected);
    });
});

describe('catalogCountQuery', () => {
    const { sql, params } = catalogCountQuery().toSQL();

    it('cuenta productos distintos con las mismas uniones y condiciones, sin paginar', () => {
        expect(sql).toContain('count(distinct `products`.`product_id`)');
        expect(sql).toContain('inner join `wineries`');
        expect(sql).toContain('inner join `guarantees_of_origin`');
        expect(sql).toContain('inner join `product_variants`');
        expect(sql).toContain(
            'where (`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?)',
        );
        expect(sql).not.toMatch(/limit|offset|order by|group by/);
        expect(params).toEqual([false, false, false, false]);
    });
});
