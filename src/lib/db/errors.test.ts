import { describe, expect, it } from 'vitest';
import { isDuplicateEntryError, isMissingUserError } from './errors';

const userFk =
    'Cannot add or update a child row: a foreign key constraint fails (`jotron`.`cart_products`, CONSTRAINT `fk_cartproduct_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`))';
const variantFk = userFk.replace('fk_cartproduct_user', 'fk_cartproduct_variant');

describe('isMissingUserError', () => {
    it.each([
        [
            'el error del driver',
            { code: 'ER_NO_REFERENCED_ROW_2', errno: 1452, sqlMessage: userFk },
        ],
        ['solo el errno', { errno: 1452, message: userFk }],
        [
            'envuelto por Drizzle (cause)',
            {
                message: 'Failed query',
                cause: { code: 'ER_NO_REFERENCED_ROW_2', sqlMessage: userFk },
            },
        ],
    ])('detecta %s', (_, error) => {
        expect(isMissingUserError(error)).toBe(true);
    });

    it.each([
        [
            'la otra clave foránea (la presentación)',
            { code: 'ER_NO_REFERENCED_ROW_2', sqlMessage: variantFk },
        ],
        ['otro error de MySQL', { code: 'ER_DUP_ENTRY', sqlMessage: 'Duplicate entry' }],
        [
            'el nombre de la restricción sin código de clave foránea',
            { code: 'ER_LOCK_DEADLOCK', sqlMessage: userFk },
        ],
        ['un Error normal', new Error('fk_cartproduct_user')],
        ['nulo', null],
        ['texto', 'fk_cartproduct_user'],
        [
            'una cadena de causas circular',
            (() => {
                const loop: { cause?: unknown } = {};
                loop.cause = loop;
                return loop;
            })(),
        ],
    ])('no confunde %s', (_, error) => {
        expect(isMissingUserError(error)).toBe(false);
    });
});

describe('isDuplicateEntryError', () => {
    const dup = "Duplicate entry 'X1234567' for key 'users.id_card'";

    it.each([
        ['el error del driver', { code: 'ER_DUP_ENTRY', errno: 1062, sqlMessage: dup }],
        ['solo el errno', { errno: 1062, message: dup }],
        [
            'envuelto por Drizzle (cause)',
            { message: 'Failed query', cause: { code: 'ER_DUP_ENTRY' } },
        ],
    ])('detecta %s', (_, error) => {
        expect(isDuplicateEntryError(error)).toBe(true);
    });

    it('con `key` solo cuenta el índice indicado', () => {
        const error = { code: 'ER_DUP_ENTRY', sqlMessage: dup };
        expect(isDuplicateEntryError(error, 'id_card')).toBe(true);
        expect(isDuplicateEntryError(error, 'payment_intent_id')).toBe(false);
        expect(isDuplicateEntryError({ cause: error }, 'id_card')).toBe(true);
    });

    it.each([
        ['otro error de MySQL', { code: 'ER_NO_REFERENCED_ROW_2', errno: 1452 }],
        ['un Error normal', new Error('Duplicate entry')],
        ['nulo', null],
        ['texto', 'ER_DUP_ENTRY'],
        [
            'una cadena de causas circular',
            (() => {
                const loop: { cause?: unknown } = {};
                loop.cause = loop;
                return loop;
            })(),
        ],
    ])('no confunde %s', (_, error) => {
        expect(isDuplicateEntryError(error)).toBe(false);
    });
});
