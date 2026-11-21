import { describe, expect, it } from 'vitest';
import {
    canCustomerCancel,
    canTransition,
    ORDER_STATUS as S,
    returnsStockOnCancel,
    shouldBlock,
    type OrderStatus,
} from './status';

const ALL = Object.values(S) as OrderStatus[];
const at = (iso: string) => new Date(iso);

describe('canTransition', () => {
    it('sigue el camino normal paso a paso', () => {
        expect(canTransition(S.PENDING, S.CONFIRMED)).toBe(true);
        expect(canTransition(S.CONFIRMED, S.PROCESSING)).toBe(true);
        expect(canTransition(S.PROCESSING, S.PREPARED)).toBe(true);
        expect(canTransition(S.PREPARED, S.SHIPPED)).toBe(true);
        expect(canTransition(S.SHIPPED, S.DELIVERED)).toBe(true);
    });

    it('no permite saltar estados ni retroceder', () => {
        expect(canTransition(S.PENDING, S.PROCESSING)).toBe(false);
        expect(canTransition(S.CONFIRMED, S.SHIPPED)).toBe(false);
        expect(canTransition(S.PREPARED, S.DELIVERED)).toBe(false);
        expect(canTransition(S.PROCESSING, S.CONFIRMED)).toBe(false);
    });

    it('permite anular hasta En proceso, pero no desde Preparado o Enviado', () => {
        for (const from of [S.PENDING, S.CONFIRMED, S.PROCESSING]) {
            expect(canTransition(from, S.CANCELLED)).toBe(true);
        }
        expect(canTransition(S.PREPARED, S.CANCELLED)).toBe(false);
        expect(canTransition(S.SHIPPED, S.CANCELLED)).toBe(false);
    });

    it('los estados finales no cambian a nada', () => {
        for (const from of [S.DELIVERED, S.CANCELLED]) {
            for (const to of ALL) {
                expect(canTransition(from, to, { onlyEvents: true, blockedFrom: S.PENDING })).toBe(
                    false,
                );
            }
        }
    });

    it('nadie se bloquea a mano: Bloqueado no es destino', () => {
        for (const from of ALL) expect(canTransition(from, S.BLOCKED)).toBe(false);
    });

    describe('pedidos solo de eventos', () => {
        it('pasan directamente a Entregado', () => {
            expect(canTransition(S.CONFIRMED, S.DELIVERED, { onlyEvents: true })).toBe(true);
            expect(canTransition(S.CONFIRMED, S.DELIVERED)).toBe(false);
        });

        it('no se entregan sin haberse pagado', () => {
            expect(canTransition(S.PENDING, S.DELIVERED, { onlyEvents: true })).toBe(false);
        });

        it('siguen sin poder saltarse otros estados', () => {
            expect(canTransition(S.CONFIRMED, S.SHIPPED, { onlyEvents: true })).toBe(false);
        });
    });

    describe('desde Bloqueado', () => {
        it('vuelve al estado siguiente al que tenía', () => {
            expect(canTransition(S.BLOCKED, S.PROCESSING, { blockedFrom: S.CONFIRMED })).toBe(true);
            expect(canTransition(S.BLOCKED, S.SHIPPED, { blockedFrom: S.PREPARED })).toBe(true);
        });

        it('no vuelve al mismo estado ni a otro distinto del siguiente', () => {
            expect(canTransition(S.BLOCKED, S.CONFIRMED, { blockedFrom: S.CONFIRMED })).toBe(false);
            expect(canTransition(S.BLOCKED, S.PREPARED, { blockedFrom: S.CONFIRMED })).toBe(false);
        });

        it('se puede anular tras revisarlo, aunque venga de Preparado', () => {
            expect(canTransition(S.BLOCKED, S.CANCELLED, { blockedFrom: S.PREPARED })).toBe(true);
            expect(canTransition(S.BLOCKED, S.CANCELLED)).toBe(true);
        });

        it('sin estado de origen solo se puede anular', () => {
            expect(canTransition(S.BLOCKED, S.CONFIRMED)).toBe(false);
            expect(canTransition(S.BLOCKED, S.PROCESSING, { blockedFrom: null })).toBe(false);
        });
    });
});

describe('canCustomerCancel', () => {
    const created = '2026-11-01T10:00:00Z';
    const order = (status: OrderStatus) => ({
        status,
        createdAt: created,
        statusUpdatedAt: created,
    });

    it('en Pendiente de pago siempre se puede', () => {
        expect(canCustomerCancel(order(S.PENDING), at('2027-01-01T00:00:00Z'))).toBe(true);
    });

    it('en Confirmado y En proceso se puede dentro de las primeras 24 h', () => {
        for (const status of [S.CONFIRMED, S.PROCESSING]) {
            expect(canCustomerCancel(order(status), at('2026-11-01T10:00:00Z'))).toBe(true);
            expect(canCustomerCancel(order(status), at('2026-11-02T10:00:00Z'))).toBe(true);
        }
    });

    it('en Confirmado y En proceso no se puede pasadas las 24 h', () => {
        for (const status of [S.CONFIRMED, S.PROCESSING]) {
            expect(canCustomerCancel(order(status), at('2026-11-02T10:00:01Z'))).toBe(false);
        }
    });

    it('en el resto de estados no se puede nunca', () => {
        for (const status of [S.PREPARED, S.SHIPPED, S.DELIVERED, S.BLOCKED, S.CANCELLED]) {
            expect(canCustomerCancel(order(status), at('2026-11-01T10:30:00Z'))).toBe(false);
        }
    });

    it('lee las fechas de la base de datos como UTC', () => {
        const dbOrder = {
            status: S.CONFIRMED,
            createdAt: '2026-11-01 10:00:00',
            statusUpdatedAt: '2026-11-01 10:00:00',
        };
        expect(canCustomerCancel(dbOrder, at('2026-11-02T09:59:59Z'))).toBe(true);
        expect(canCustomerCancel(dbOrder, at('2026-11-02T10:00:01Z'))).toBe(false);
    });
});

describe('shouldBlock', () => {
    const since = '2026-11-01T00:00:00Z';
    const order = (status: OrderStatus) => ({
        status,
        createdAt: '2026-01-01T00:00:00Z',
        statusUpdatedAt: since,
    });

    it('no bloquea hasta pasados 15 días en el mismo estado', () => {
        expect(shouldBlock(order(S.PROCESSING), at('2026-11-16T00:00:00Z'))).toBe(false);
        expect(shouldBlock(order(S.PROCESSING), at('2026-11-16T00:00:01Z'))).toBe(true);
    });

    it('cuenta desde el último cambio de estado, no desde la creación', () => {
        expect(shouldBlock(order(S.CONFIRMED), at('2026-11-10T00:00:00Z'))).toBe(false);
    });

    it('bloquea cualquier estado intermedio', () => {
        for (const status of [S.PENDING, S.CONFIRMED, S.PROCESSING, S.PREPARED, S.SHIPPED]) {
            expect(shouldBlock(order(status), at('2026-12-01T00:00:00Z'))).toBe(true);
        }
    });

    it('no bloquea Entregado, Anulado ni lo que ya está Bloqueado', () => {
        for (const status of [S.DELIVERED, S.CANCELLED, S.BLOCKED]) {
            expect(shouldBlock(order(status), at('2027-06-01T00:00:00Z'))).toBe(false);
        }
    });
});

describe('returnsStockOnCancel', () => {
    it('devuelve el stock si las botellas siguen en el almacén', () => {
        for (const from of [S.PENDING, S.CONFIRMED, S.PROCESSING]) {
            expect(returnsStockOnCancel(from, null)).toBe(true);
        }
    });

    it('no lo devuelve si ya salieron o están preparadas', () => {
        for (const from of [S.PREPARED, S.SHIPPED]) {
            expect(returnsStockOnCancel(from, null)).toBe(false);
        }
    });

    it('un pedido Bloqueado cuenta por el estado del que venía', () => {
        for (const blockedFrom of [S.PENDING, S.CONFIRMED, S.PROCESSING]) {
            expect(returnsStockOnCancel(S.BLOCKED, blockedFrom)).toBe(true);
        }
        for (const blockedFrom of [S.PREPARED, S.SHIPPED]) {
            expect(returnsStockOnCancel(S.BLOCKED, blockedFrom)).toBe(false);
        }
    });

    it('un pedido Bloqueado sin estado de origen no devuelve nada', () => {
        expect(returnsStockOnCancel(S.BLOCKED, null)).toBe(false);
    });
});
