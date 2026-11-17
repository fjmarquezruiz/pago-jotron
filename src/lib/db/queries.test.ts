import { sql, type SQL } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { describe, expect, it, vi } from 'vitest';
import {
    catalogConditions,
    catalogCountQuery,
    catalogItemsQuery,
    catalogOrderBy,
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

    it('cuenta las filas de una subconsulta agrupada por producto, sin paginar', () => {
        expect(sql).toMatch(/^select count\(\*\) from \(select `products`\.`product_id` from /);
        expect(sql).toMatch(/group by `products`\.`product_id`\) `matching`$/);
        expect(sql).not.toMatch(/limit|offset|order by/);
    });

    it('lleva las mismas uniones y la misma regla de visibilidad que el listado', () => {
        expect(sql).toContain('inner join `wineries`');
        expect(sql).toContain('inner join `guarantees_of_origin`');
        expect(sql).toContain('inner join `product_variants`');
        expect(sql).toContain(
            'where (`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?)',
        );
        expect(params).toEqual([false, false, false, false]);
    });
});

describe('catalogConditions', () => {
    const dialect = new MySqlDialect();
    /** El SQL y los parámetros de una condición (sin los `typings` que añade el dialecto). */
    const render = (condition: SQL) => {
        const { sql, params } = dialect.sqlToQuery(condition);
        return { sql, params };
    };
    const visible =
        '(`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?)';
    const hidden = [false, false, false];

    it('sin filtros, solo la regla de visibilidad y sin having', () => {
        for (const filters of [
            undefined,
            {},
            { q: undefined, uva: undefined, precio: undefined },
        ]) {
            const { where, having } = catalogConditions(filters);
            expect(render(where)).toEqual({ sql: visible, params: hidden });
            expect(having).toBeUndefined();
        }
    });

    it.each([
        [
            'q busca en nombre o descripción, con comodines en los extremos',
            { q: 'tinto' },
            "(`products`.`name` like ? escape '!' or `products`.`description` like ? escape '!')",
            ['%tinto%', '%tinto%'],
        ],
        [
            'q recorta los espacios',
            { q: '  tinto roble ' },
            "(`products`.`name` like ? escape '!' or `products`.`description` like ? escape '!')",
            ['%tinto roble%', '%tinto roble%'],
        ],
        [
            'q escapa los comodines de like con !, no con la barra',
            { q: '100%_!\\' },
            "(`products`.`name` like ? escape '!' or `products`.`description` like ? escape '!')",
            ['%100!%!_!!\\%', '%100!%!_!!\\%'],
        ],
        [
            'do filtra por la D.O. del producto',
            { do: 6 },
            '`products`.`guarantee_of_origin_id` = ?',
            [6],
        ],
        ['bodega filtra por la bodega', { bodega: 2 }, '`products`.`winery_id` = ?', [2]],
        [
            'tipologia filtra por la tipología',
            { tipologia: 5 },
            '`products`.`typology_id` = ?',
            [5],
        ],
        ['anada filtra por la añada', { anada: 2022 }, '`products`.`vintage` = ?', [2022]],
        [
            'uva usa exists sobre product_grapes, correlacionado con el producto',
            { uva: 8 },
            'exists (select 1 from `product_grapes` where (`product_grapes`.`product_id` = `products`.`product_id` and `product_grapes`.`grape_id` = ?))',
            [8],
        ],
    ] as const)('%s', (_name, filters, fragment, extraParams) => {
        const { sql, params } = dialect.sqlToQuery(catalogConditions(filters).where);
        expect(sql).toBe(`(${visible} and ${fragment})`);
        expect(params).toEqual([...hidden, ...extraParams]);
    });

    it.each([[{ q: '' }], [{ q: '   ' }]])('un texto vacío (%j) no añade condición', (filters) => {
        expect(dialect.sqlToQuery(catalogConditions(filters).where).sql).toBe(visible);
    });

    it('une todos los filtros con and, tras la visibilidad y en el mismo orden', () => {
        const { where, having } = catalogConditions({
            q: 'a',
            do: 1,
            bodega: 2,
            tipologia: 3,
            anada: 2020,
            uva: 4,
            precio: '10-15',
        });
        const { sql, params } = dialect.sqlToQuery(where);
        expect(sql).toBe(
            `(${visible} and (\`products\`.\`name\` like ? escape '!' or \`products\`.\`description\` like ? escape '!') and \`products\`.\`guarantee_of_origin_id\` = ? and \`products\`.\`winery_id\` = ? and \`products\`.\`typology_id\` = ? and \`products\`.\`vintage\` = ? and exists (select 1 from \`product_grapes\` where (\`product_grapes\`.\`product_id\` = \`products\`.\`product_id\` and \`product_grapes\`.\`grape_id\` = ?)))`,
        );
        expect(params).toEqual([...hidden, '%a%', '%a%', 1, 2, 3, 2020, 4]);
        expect(having).toBeDefined();
    });

    it.each([
        ['hasta-10', 'min(`product_variants`.`price`) < ?', [10]],
        [
            '10-15',
            '(min(`product_variants`.`price`) >= ? and min(`product_variants`.`price`) < ?)',
            [10, 15],
        ],
        [
            '15-25',
            '(min(`product_variants`.`price`) >= ? and min(`product_variants`.`price`) < ?)',
            [15, 25],
        ],
        ['mas-25', 'min(`product_variants`.`price`) >= ?', [25]],
    ] as const)(
        'precio %s va en having, sobre el precio mínimo',
        (precio, expectedSql, expectedParams) => {
            const { where, having } = catalogConditions({ precio });
            expect(render(having!)).toEqual({
                sql: expectedSql,
                params: expectedParams,
            });
            // el agregado no puede ir en where: solo existe tras agrupar
            expect(dialect.sqlToQuery(where).sql).toBe(visible);
        },
    );
});

describe('catalogItemsQuery con filtros', () => {
    const filters = { q: 'roble', uva: 1, tipologia: 1, precio: '15-25' } as const;
    const { sql, params } = catalogItemsQuery({ page: 2, pageSize: 12, filters }).toSQL();

    it('aplica los filtros de fila en where y el precio en having, entre group by y order by', () => {
        expect(sql).toMatch(
            / where \(\(.*\) and \(`products`\.`name` like \? escape '!' or .*exists \(select 1 from `product_grapes`.*\)\) group by .* having \(min\(`product_variants`\.`price`\) >= \? and min\(`product_variants`\.`price`\) < \?\) order by /,
        );
    });

    it('no une product_grapes: la uva se filtra con exists y no multiplica las filas', () => {
        expect(sql.match(/inner join/g)).toHaveLength(3);
        expect(sql).not.toMatch(/join `product_grapes`/);
    });

    it('los parámetros de los filtros van antes de limit y offset', () => {
        // presentación sin bloquear, 3 bloqueos, q ×2, tipología, uva, precio ×2, limit, offset
        expect(params).toEqual([
            false,
            false,
            false,
            false,
            '%roble%',
            '%roble%',
            1,
            1,
            15,
            25,
            12,
            12,
        ]);
    });

    it('sin precio no hay having', () => {
        expect(
            catalogItemsQuery({ page: 1, pageSize: 12, filters: { bodega: 1 } }).toSQL().sql,
        ).not.toContain('having');
    });

    it('sin filtros, la misma consulta de antes', () => {
        const base = catalogItemsQuery({ page: 1, pageSize: 12 }).toSQL();
        expect(catalogItemsQuery({ page: 1, pageSize: 12, filters: {} }).toSQL()).toEqual(base);
        expect(base.sql).not.toMatch(/having|exists|like/);
    });
});

describe('catalogOrderBy', () => {
    const render = (orden?: Parameters<typeof catalogOrderBy>[0]) =>
        new MySqlDialect().sqlToQuery(sql.join(catalogOrderBy(orden), sql`, `)).sql;

    it.each([
        ['recientes', '`products`.`created_at` desc, `products`.`product_id` desc'],
        ['precio-asc', 'min(`product_variants`.`price`) asc, `products`.`product_id` asc'],
        ['precio-desc', 'min(`product_variants`.`price`) desc, `products`.`product_id` asc'],
        ['nombre', '`products`.`name` asc, `products`.`product_id` asc'],
    ] as const)('%s → %s', (orden, expected) => {
        expect(render(orden)).toBe(expected);
    });

    it('sin criterio, o con uno desconocido, ordena por los más recientes', () => {
        const recientes = render('recientes');
        expect(render()).toBe(recientes);
        expect(render('otro' as never)).toBe(recientes);
    });

    it.each(['recientes', 'precio-asc', 'precio-desc', 'nombre'] as const)(
        '%s termina siempre en el id del producto, para paginar con estabilidad',
        (orden) => {
            const clauses = catalogOrderBy(orden);
            const last = new MySqlDialect().sqlToQuery(clauses.at(-1)!).sql;
            expect(clauses.length).toBeGreaterThan(1);
            expect(last).toMatch(/^`products`\.`product_id` (asc|desc)$/);
        },
    );
});

describe('catalogItemsQuery con orden', () => {
    it.each([
        ['recientes', 'order by `products`.`created_at` desc, `products`.`product_id` desc limit'],
        [
            'precio-asc',
            'group by .* order by min(`product_variants`.`price`) asc, `products`.`product_id` asc limit',
        ],
        [
            'precio-desc',
            'order by min(`product_variants`.`price`) desc, `products`.`product_id` asc limit',
        ],
        ['nombre', 'order by `products`.`name` asc, `products`.`product_id` asc limit'],
    ] as const)('aplica %s', (orden, fragment) => {
        const { sql } = catalogItemsQuery({ page: 1, pageSize: 12, orden }).toSQL();
        expect(sql).toMatch(new RegExp(fragment.replaceAll('`', '`').replace(/[()]/g, '\\$&')));
    });

    it('sin orden, el de siempre (más recientes primero)', () => {
        expect(catalogItemsQuery({ page: 1, pageSize: 12 }).toSQL()).toEqual(
            catalogItemsQuery({ page: 1, pageSize: 12, orden: 'recientes' }).toSQL(),
        );
    });

    it('el orden no añade parámetros ni cambia los filtros', () => {
        const filters = { tipologia: 1, precio: '10-15' } as const;
        const base = catalogItemsQuery({ page: 2, pageSize: 12, filters }).toSQL();
        for (const orden of ['precio-asc', 'precio-desc', 'nombre'] as const) {
            expect(
                catalogItemsQuery({ page: 2, pageSize: 12, filters, orden }).toSQL().params,
            ).toEqual(base.params);
        }
    });

    it('el total no depende del orden: no lleva order by', () => {
        expect(catalogCountQuery().toSQL().sql).not.toContain('order by');
    });
});

describe('catalogCountQuery con filtros', () => {
    const filters = { q: 'roble', uva: 1, bodega: 2, precio: 'hasta-10' } as const;

    it('usa exactamente las mismas condiciones que la consulta de productos', () => {
        const items = catalogItemsQuery({ page: 2, pageSize: 12, filters }).toSQL();
        const total = catalogCountQuery(filters).toSQL();
        const conditions = (sql: string) => ({
            where: sql.match(/ where (.*?) group by /)?.[1],
            having: sql.match(/ having (.*?)(?: order by |\) `matching`)/)?.[1],
        });

        expect(conditions(total.sql)).toEqual(conditions(items.sql));
        expect(conditions(total.sql).where).toContain('exists (select 1 from `product_grapes`');
        expect(conditions(total.sql).having).toBe('min(`product_variants`.`price`) < ?');
        // mismos parámetros, salvo limit y offset, que no tiene
        expect(total.params).toEqual(items.params.slice(0, -2));
    });

    it('sin precio no lleva having', () => {
        expect(catalogCountQuery({ bodega: 1 }).toSQL().sql).not.toContain('having');
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
