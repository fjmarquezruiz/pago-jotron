import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import type { AdminDenomination } from '@/lib/db/admin-denominations';
import { AdminDenominationForm } from './admin-denomination-form';
import { AdminDenominationsFilters } from './admin-denominations-filters';
import { AdminDenominationsTable } from './admin-denominations-table';

const rows = [
    {
        id: 5,
        name: 'Málaga',
        classification: 'DO' as const,
        region: 'Málaga',
        isBlocked: false,
        productCount: 41,
    },
    {
        id: 8,
        name: 'Norte de Almería',
        classification: 'VT' as const,
        region: null,
        isBlocked: true,
        productCount: 0,
    },
];

describe('AdminDenominationsTable', () => {
    const html = renderToStaticMarkup(createElement(AdminDenominationsTable, { rows }));
    it('enseña id, nombre, clasificación, región y estado', () => {
        expect(html).toContain('DO-005');
        expect(html).toContain('Málaga');
        expect(html).toContain('VT');
        expect(html).toContain('A la venta');
        expect(html).toContain('Ventas bloqueadas');
    });
    it('papelera solo sin productos y lápiz a la ficha', () => {
        expect(html).toContain('href="/admin/denominaciones/8"');
        expect(html).not.toContain('Eliminar Málaga');
        expect(html).toContain('Eliminar Norte de Almería');
    });
});

describe('AdminDenominationsFilters', () => {
    it('chip, búsqueda y Nueva denominación', () => {
        const html = renderToStaticMarkup(
            createElement(AdminDenominationsFilters, { filters: {}, regions: ['Málaga'] }),
        );
        expect(html).toContain('Región: todas');
        expect(html).toContain('href="/admin/denominaciones/nueva"');
        expect(html).toContain('Nueva denominación');
    });
});

const data = (productCount: number): AdminDenomination => ({
    denomination: {
        id: 5,
        name: 'Málaga',
        classification: 'DO',
        region: 'Montes de Málaga',
        regulatoryCouncil: 'Consejo Regulador',
        foundedYear: 1933,
        website: null,
        description: null,
        isBlocked: false,
    },
    productCount,
});

const related = (total: number) => ({
    items: total ? [{ id: 1, name: 'Pago de Jotrón', city: 'Málaga', productCount: 14 }] : [],
    total,
    page: 1,
    totalPages: 1,
    pageSize: 10,
});

describe('AdminDenominationForm', () => {
    it('alta: campos del diseño y sin variedades de uva (no hay relación en la BD)', () => {
        const html = renderToStaticMarkup(createElement(AdminDenominationForm));
        for (const label of [
            'Añadir una nueva denominación',
            'Nombre de la denominación',
            'Año de fundación',
            'Clasificación / Tipo',
            'Consejo regulador',
            'Región geográfica',
            'Sitio web',
            'Descripción',
        ])
            expect(html).toContain(label);
        expect(html).not.toContain('Variedades de uva');
        expect(html).not.toContain('Bodegas relacionadas');
    });
    it('ficha del administrador: Estado, Eliminar sin productos y bodegas relacionadas', () => {
        const html = renderToStaticMarkup(
            createElement(AdminDenominationForm, {
                data: data(0),
                related: related(1),
                canBlock: true,
            }),
        );
        expect(html).toContain('Estado');
        expect(html).toContain('Eliminar');
        expect(html).toContain('Bodegas relacionadas (1)');
        expect(html).toContain('WIN-001');
        expect(html).toContain('Mostrando 1–1 de 1 bodega');
    });
    it('ficha del editor con productos: sin Estado ni Eliminar', () => {
        const html = renderToStaticMarkup(
            createElement(AdminDenominationForm, { data: data(3), related: related(0) }),
        );
        expect(html).not.toContain('role="switch"');
        expect(html).not.toContain('>Eliminar<');
        expect(html).toContain('Todavía no hay bodegas');
    });
});
