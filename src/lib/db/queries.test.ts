import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { describe, expect, it, vi } from 'vitest';
import {
    catalogCountQuery,
    catalogItemsQuery,
    featuredProductsQuery,
    isNewCondition,
    relatedProductsQuery,
    visibleProductsCondition,
} from './queries';

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

describe('isNewCondition', () => {
    it('compara created_at con la hora de la BD menos NEW_PRODUCT_DAYS días', () => {
        const { sql, params } = new MySqlDialect().sqlToQuery(isNewCondition());
        expect(sql).toBe('`products`.`created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        expect(params).toEqual([]);
    });
});

describe('catalogItemsQuery: isNew', () => {
    it('pide isNew como columna calculada y agrupa por created_at', () => {
        const { sql } = catalogItemsQuery({ page: 1, pageSize: 12 }).toSQL();
        expect(sql).toContain('`products`.`created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        expect(sql).toMatch(/group by .*`products`\.`created_at`/);
    });
});

describe('featuredProductsQuery', () => {
    it('solo nuevos: visibles, isNew en el where, al azar y con límite', () => {
        const { sql, params } = featuredProductsQuery({ onlyNew: true, limit: 8 }).toSQL();
        expect(sql).toContain(
            'where ((`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?) and `products`.`created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY))',
        );
        expect(sql).toContain('order by rand()');
        expect(sql).toMatch(/limit \?$/);
        expect(params.at(-1)).toBe(8);
    });

    it('solo los que no son nuevos: niega la condición', () => {
        const { sql } = featuredProductsQuery({ onlyNew: false, limit: 3 }).toSQL();
        expect(sql).toContain('not `products`.`created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    });

    it('usa las mismas uniones y agregados que el listado', () => {
        const { sql } = featuredProductsQuery({ onlyNew: true, limit: 8 }).toSQL();
        expect(sql).toContain('inner join `product_variants`');
        expect(sql).toContain('min(`product_variants`.`price`)');
        expect(sql).toContain('sum(`product_variants`.`stock`)');
    });
});

describe('relatedProductsQuery', () => {
    const args = { productId: 3, wineryId: 7, typologyId: 2, limit: 4 };
    const { sql, params } = relatedProductsQuery(args).toSQL();

    it('aplica la visibilidad y excluye el propio producto', () => {
        expect(sql).toContain(
            'where ((`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?) and `products`.`product_id` <> ?)',
        );
        // presentación sin bloquear, 3 bloqueos y el id excluido
        expect(params.slice(0, 5)).toEqual([false, false, false, false, 3]);
    });

    it('ordena por afinidad (bodega 2, tipología 1, resto 0) y después al azar', () => {
        expect(sql).toContain(
            'order by case when `products`.`winery_id` = ? then 2 when `products`.`typology_id` = ? then 1 else 0 end desc, rand()',
        );
        // los dos ids de la afinidad, y el límite al final
        expect(params.slice(5, 7)).toEqual([7, 2]);
        expect(params.at(-1)).toBe(4);
    });

    it('agrupa también por bodega y tipología, que usa el orden', () => {
        expect(sql).toMatch(/group by .*`products`\.`winery_id`, `products`\.`typology_id`/);
    });

    it('usa las mismas uniones y agregados que el listado', () => {
        expect(sql).toContain('inner join `product_variants`');
        expect(sql).toContain('min(`product_variants`.`price`)');
        expect(sql).toContain('sum(`product_variants`.`stock`)');
    });

    it('normaliza un límite inválido a 1', () => {
        expect(
            relatedProductsQuery({ ...args, limit: 0 })
                .toSQL()
                .params.at(-1),
        ).toBe(1);
    });
});
