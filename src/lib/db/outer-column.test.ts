import { describe, expect, it } from 'vitest';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { products, wineries } from '@/db/schema';
import { outerColumn } from '@/lib/db/outer-column';

describe('outerColumn', () => {
    it('califica la columna de fuera con su tabla para que la subconsulta no la confunda', () => {
        const query = sql`(select count(*) from ${products} where ${products.wineryId} = ${outerColumn(wineries.id)})`;
        const { sql: text } = new MySqlDialect().sqlToQuery(query);
        expect(text).toContain('= `wineries`.`winery_id`');
    });
});
