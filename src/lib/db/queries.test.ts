import { sql, type SQL } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';
import type { Connection } from 'mysql2/promise';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
    catalogConditions,
    catalogCountQuery,
    catalogFilterOptionsQueries,
    catalogItemsQuery,
    catalogOrderBy,
    cartLinesQuery,
    deleteMissingCartItemsQuery,
    featuredProductsQuery,
    getCartLines,
    getUserCart,
    isNewCondition,
    relatedProductsQuery,
    saveUserCart,
    upsertCartItemsQuery,
    userCartQuery,
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
        // el id de la presentación, para el botón "Añadir" de la tarjeta cuando solo hay una
        expect(sql).toContain('min(`product_variants`.`variant_id`)');
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

describe('catalogFilterOptionsQueries', () => {
    const queries = catalogFilterOptionsQueries();
    const sqlOf = (name: keyof typeof queries) => queries[name].toSQL();

    it('devuelve una consulta por lista de opciones', () => {
        expect(Object.keys(queries)).toEqual([
            'origins',
            'wineries',
            'grapes',
            'typologies',
            'vintages',
        ]);
    });

    it.each(['origins', 'wineries', 'grapes', 'typologies', 'vintages'] as const)(
        '%s: select distinct con las uniones y la regla de visibilidad del listado',
        (name) => {
            const { sql, params } = sqlOf(name);
            expect(sql).toMatch(/^select distinct /);
            expect(sql).toContain(
                'inner join `wineries` on `wineries`.`winery_id` = `products`.`winery_id`',
            );
            expect(sql).toContain(
                'inner join `guarantees_of_origin` on `guarantees_of_origin`.`guarantee_of_origin_id` = `products`.`guarantee_of_origin_id`',
            );
            // solo cuentan las presentaciones a la venta: sin ellas el listado no enseña el producto
            expect(sql).toContain(
                'inner join `product_variants` on (`product_variants`.`product_id` = `products`.`product_id` and `product_variants`.`is_blocked` = ?)',
            );
            expect(sql).toContain(
                '(`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?)',
            );
            // presentación sin bloquear + producto, bodega y D.O. sin bloquear
            expect(params).toEqual([false, false, false, false]);
            // distinct: sin agregados ni group by, y sin paginar
            expect(sql).not.toMatch(/group by|limit|offset|count\(|min\(/);
        },
    );

    it.each([
        [
            'origins',
            'select distinct `guarantees_of_origin`.`guarantee_of_origin_id`, `guarantees_of_origin`.`name` from',
            'order by `guarantees_of_origin`.`name` asc, `guarantees_of_origin`.`guarantee_of_origin_id` asc',
        ],
        [
            'wineries',
            'select distinct `wineries`.`winery_id`, `wineries`.`name` from',
            'order by `wineries`.`name` asc, `wineries`.`winery_id` asc',
        ],
        [
            'grapes',
            'select distinct `grapes`.`grape_id`, `grapes`.`name` from',
            'order by `grapes`.`name` asc, `grapes`.`grape_id` asc',
        ],
    ] as const)('%s: id y nombre, ordenados por nombre', (name, select, order) => {
        const { sql } = sqlOf(name);
        expect(sql).toContain(select);
        expect(sql.endsWith(order)).toBe(true);
    });

    it('grapes: une product_grapes y grapes (aquí solo se pide la lista, sin agregados)', () => {
        const { sql } = sqlOf('grapes');
        expect(sql).toContain(
            'inner join `product_grapes` on `product_grapes`.`product_id` = `products`.`product_id`',
        );
        expect(sql).toContain(
            'inner join `grapes` on `grapes`.`grape_id` = `product_grapes`.`grape_id`',
        );
        expect(sql).not.toContain('exists');
    });

    it('typologies: por filter_order y después por nombre, con filter_order en el select (lo exige distinct)', () => {
        const { sql } = sqlOf('typologies');
        expect(sql).toContain(
            'select distinct `typologies`.`typology_id`, `typologies`.`name`, `typologies`.`filter_order` from',
        );
        expect(sql).toContain(
            'inner join `typologies` on `typologies`.`typology_id` = `products`.`typology_id`',
        );
        expect(
            sql.endsWith(
                'order by `typologies`.`filter_order` asc, `typologies`.`name` asc, `typologies`.`typology_id` asc',
            ),
        ).toBe(true);
    });

    it('vintages: solo los productos con añada, de la más reciente a la más antigua', () => {
        const { sql } = sqlOf('vintages');
        expect(sql).toContain('select distinct `products`.`vintage` from');
        expect(sql).toContain('and `products`.`vintage` is not null)');
        expect(sql.endsWith('order by `products`.`vintage` desc')).toBe(true);
    });

    it('wineries y origins no unen más tablas de las que el listado ya une', () => {
        for (const name of ['origins', 'wineries'] as const) {
            expect(sqlOf(name).sql.match(/inner join/g)).toHaveLength(3);
        }
    });
});

describe('cartLinesQuery', () => {
    const { sql, params } = cartLinesQuery([4, 7, 9]).toSQL();

    it('parte de las presentaciones y las une con su producto, su bodega y su D.O.', () => {
        expect(sql).toContain('from `product_variants`');
        expect(sql).toContain(
            'inner join `products` on `products`.`product_id` = `product_variants`.`product_id`',
        );
        expect(sql).toContain('inner join `wineries`');
        expect(sql).toContain('inner join `guarantees_of_origin`');
    });

    it('pide solo los ids del carrito', () => {
        expect(sql).toContain('`product_variants`.`variant_id` in (?, ?, ?)');
        expect(params.slice(0, 3)).toEqual([4, 7, 9]);
    });

    it('descarta las presentaciones bloqueadas y aplica la visibilidad del catálogo', () => {
        expect(sql).toContain(
            'where (`product_variants`.`variant_id` in (?, ?, ?) and `product_variants`.`is_blocked` = ? and (`products`.`is_blocked` = ? and `wineries`.`is_blocked` = ? and `guarantees_of_origin`.`is_blocked` = ?))',
        );
        // ids, presentación sin bloquear y los 3 bloqueos de la regla de visibilidad
        expect(params).toEqual([4, 7, 9, false, false, false, false]);
    });

    it('devuelve el precio y el stock de ahora, y lo necesario para pintar la línea', () => {
        for (const column of [
            '`product_variants`.`variant_id`',
            '`products`.`slug`',
            '`products`.`name`',
            '`products`.`image`',
            '`products`.`vintage`',
            '`guarantees_of_origin`.`name`',
            '`product_variants`.`format`',
            '`product_variants`.`capacity`',
            '`product_variants`.`capacity_unit`',
            '`product_variants`.`price`',
            '`product_variants`.`stock`',
        ]) {
            expect(sql).toContain(column);
        }
    });

    it('no agrega: una fila por presentación', () => {
        expect(sql).not.toMatch(/group by|sum\(|min\(|count\(/);
    });
});

describe('getCartLines', () => {
    it('sin ids devuelve una lista vacía, sin consultar la BD', async () => {
        await expect(getCartLines([])).resolves.toEqual([]);
    });
});

describe('userCartQuery', () => {
    const { sql, params } = userCartQuery(12).toSQL();

    it('lee solo las líneas del usuario, con la presentación y la cantidad', () => {
        expect(sql).toContain('select `variant_id`, `quantity` from `cart_products`');
        expect(sql).toContain('where `cart_products`.`user_id` = ?');
        expect(params).toEqual([12]);
    });

    it('ordena de la más antigua a la más reciente, con la presentación de desempate', () => {
        expect(
            sql.endsWith(
                'order by `cart_products`.`added_at` asc, `cart_products`.`variant_id` asc',
            ),
        ).toBe(true);
    });

    it('no agrega ni pagina: es el carrito entero', () => {
        expect(sql).not.toMatch(/group by|limit|offset|join/);
    });
});

describe('upsertCartItemsQuery', () => {
    const items = [
        { variantId: 4, quantity: 2 },
        { variantId: 9, quantity: 1 },
    ];
    const { sql, params } = upsertCartItemsQuery(db, 12, items).toSQL();

    it('inserta todas las líneas en una sola sentencia, con el usuario en cada una', () => {
        expect(sql).toContain(
            'insert into `cart_products` (`user_id`, `variant_id`, `quantity`, `added_at`) values (?, ?, ?, default), (?, ?, ?, default)',
        );
        expect(params).toEqual([12, 4, 2, 12, 9, 1]);
    });

    it('si la línea ya existe solo cambia la cantidad, así que conserva added_at', () => {
        expect(sql.endsWith(' on duplicate key update `quantity` = values(`quantity`)')).toBe(true);
        expect(sql).not.toMatch(/added_at` = /);
    });
});

describe('deleteMissingCartItemsQuery', () => {
    it('borra las líneas del usuario que no están en el carrito nuevo', () => {
        const { sql, params } = deleteMissingCartItemsQuery(db, 12, [
            { variantId: 4, quantity: 2 },
            { variantId: 9, quantity: 1 },
        ]).toSQL();

        expect(sql).toBe(
            'delete from `cart_products` where (`cart_products`.`user_id` = ? and `cart_products`.`variant_id` not in (?, ?))',
        );
        expect(params).toEqual([12, 4, 9]);
    });

    it('con el carrito vacío borra todas las del usuario, sin un not in () vacío', () => {
        const { sql, params } = deleteMissingCartItemsQuery(db, 12, []).toSQL();

        expect(sql).toBe('delete from `cart_products` where `cart_products`.`user_id` = ?');
        expect(params).toEqual([12]);
    });

    it('no repite ids en el not in', () => {
        const { params } = deleteMissingCartItemsQuery(db, 12, [
            { variantId: 4, quantity: 1 },
            { variantId: 4, quantity: 2 },
        ]).toSQL();
        expect(params).toEqual([12, 4]);
    });

    it('solo toca al usuario indicado: nunca borra sin filtrar por user_id', () => {
        for (const items of [[], [{ variantId: 4, quantity: 1 }]]) {
            expect(deleteMissingCartItemsQuery(db, 12, items).toSQL().sql).toContain(
                '`cart_products`.`user_id` = ?',
            );
        }
    });
});

/**
 * Un cliente Drizzle de verdad (mismo esquema y modo que `@/db`) sobre una conexión falsa que
 * apunta cada sentencia que recibe y contesta `rows` a los `select`. `fail` hace que falle la
 * sentencia que lo cumpla. Sirve para ver qué SQL ejecutan `getUserCart` y `saveUserCart`, y en
 * qué orden y dentro de qué transacción, sin conectar a ninguna BD.
 */
function recordingDb(rows: unknown[][] = [], fail?: (sql: string) => boolean) {
    const statements: { sql: string; params: unknown[] }[] = [];
    const client = {
        async query({ sql }: { sql: string }, params: unknown[]) {
            statements.push({ sql, params });
            if (fail?.(sql)) throw new Error('fallo de la BD');
            return /^select/.test(sql) ? [rows, []] : [{ insertId: 0, affectedRows: 0 }, undefined];
        },
    } as unknown as Connection;
    return { recorder: drizzle(client, { schema, mode: 'planetscale' }), statements };
}

describe('getUserCart', () => {
    afterEach(() => vi.restoreAllMocks());

    it('devuelve las líneas como { variantId, quantity }', async () => {
        const { recorder, statements } = recordingDb([
            [4, 2],
            [9, 1],
        ]);
        vi.spyOn(db, 'select').mockImplementation(
            recorder.select.bind(recorder) as typeof db.select,
        );

        await expect(getUserCart(12)).resolves.toEqual([
            { variantId: 4, quantity: 2 },
            { variantId: 9, quantity: 1 },
        ]);
        expect(statements).toHaveLength(1);
        expect(statements[0].params).toEqual([12]);
    });

    it('un usuario sin carrito guardado recibe una lista vacía', async () => {
        const { recorder } = recordingDb([]);
        vi.spyOn(db, 'select').mockImplementation(
            recorder.select.bind(recorder) as typeof db.select,
        );
        await expect(getUserCart(12)).resolves.toEqual([]);
    });
});

describe('saveUserCart', () => {
    afterEach(() => vi.restoreAllMocks());

    /** Hace que `saveUserCart` use la conexión falsa en vez de la BD. */
    function useRecording(fail?: (sql: string) => boolean) {
        const { recorder, statements } = recordingDb([], fail);
        vi.spyOn(db, 'transaction').mockImplementation(((
            ...args: Parameters<typeof db.transaction>
        ) => recorder.transaction(...args)) as typeof db.transaction);
        return statements;
    }

    it('guarda las líneas y borra las que sobran, todo dentro de una transacción', async () => {
        const statements = useRecording();

        await saveUserCart(12, [
            { variantId: 4, quantity: 2 },
            { variantId: 9, quantity: 1 },
        ]);

        expect(statements.map(({ sql }) => sql.split(' ').slice(0, 3).join(' '))).toEqual([
            'begin',
            'insert into `cart_products`',
            'delete from `cart_products`',
            'commit',
        ]);
        expect(statements[1].sql).toContain(
            'on duplicate key update `quantity` = values(`quantity`)',
        );
        expect(statements[1].params).toEqual([12, 4, 2, 12, 9, 1]);
        expect(statements[2].sql).toContain('`variant_id` not in (?, ?)');
        expect(statements[2].params).toEqual([12, 4, 9]);
    });

    it('con el carrito vacío solo borra: no hay insert sin filas', async () => {
        const statements = useRecording();

        await saveUserCart(12, []);

        expect(statements.map(({ sql }) => sql.split(' ')[0])).toEqual([
            'begin',
            'delete',
            'commit',
        ]);
        expect(statements[1].sql).not.toContain('not in');
        expect(statements[1].params).toEqual([12]);
    });

    it.each([
        ['el insert', (sql: string) => sql.startsWith('insert')],
        ['el delete', (sql: string) => sql.startsWith('delete')],
    ])('si falla %s deshace todo y propaga el error', async (_, fail) => {
        const statements = useRecording(fail);

        // Drizzle envuelve el error del driver en otro (`Failed query: ...`) y lo deja en `cause`.
        await expect(saveUserCart(12, [{ variantId: 4, quantity: 1 }])).rejects.toHaveProperty(
            'cause.message',
            'fallo de la BD',
        );

        const last = statements.at(-1)?.sql;
        expect(last).toBe('rollback');
        expect(statements.map(({ sql }) => sql)).not.toContain('commit');
    });
});
