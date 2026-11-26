import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import type { AdminWinery } from '@/lib/db/admin-wineries';
import { wineryRequest } from './winery-requests';
import { AdminWineriesFilters } from './admin-wineries-filters';
import { AdminWineriesTable } from './admin-wineries-table';
import { AdminWineryForm } from './admin-winery-form';

const rows = [
    { id: 1, name: 'Pago de Jotrón', city: 'Málaga', isBlocked: false, productCount: 14 },
    { id: 2, name: 'Bodega vacía', city: null, isBlocked: true, productCount: 0 },
];

describe('AdminWineriesTable', () => {
    const html = renderToStaticMarkup(createElement(AdminWineriesTable, { rows }));
    it('enseña id, nombre, región, vinos y estado', () => {
        expect(html).toContain('WIN-001');
        expect(html).toContain('Pago de Jotrón');
        expect(html).toContain('Málaga');
        expect(html).toContain('A la venta');
        expect(html).toContain('Ventas bloqueadas');
    });
    it('el lápiz lleva a la ficha y la papelera solo sale sin productos', () => {
        expect(html).toContain('href="/admin/bodegas/2"');
        expect(html).not.toContain('Eliminar Pago de Jotrón');
        expect(html).toContain('Eliminar Bodega vacía');
    });
});

describe('AdminWineriesFilters', () => {
    it('chip de región, búsqueda aplicada y Nueva bodega', () => {
        const html = renderToStaticMarkup(
            createElement(AdminWineriesFilters, {
                filters: { region: 'Ronda', q: 'Jotrón' },
                regions: ['Ronda', 'Málaga'],
            }),
        );
        expect(html).toContain('Región: Ronda');
        expect(html).toContain('Jotrón');
        expect(html).toContain('Limpiar todo');
        expect(html).toContain('href="/admin/bodegas/nueva"');
        expect(html).toContain('Nueva bodega');
    });
});

const data = (productCount: number, isBlocked = false): AdminWinery => ({
    winery: {
        id: 1,
        name: 'Pago de Jotrón',
        description: 'Bodega familiar',
        address: 'Camino s/n',
        city: 'Málaga',
        province: 'Málaga',
        country: 'España',
        phone: '952000000',
        email: 'info@pagodejotron.com',
        website: 'https://www.pagodejotron.com',
        isBlocked,
    },
    productCount,
    products: productCount ? [{ id: 5, name: 'Tinto Roble', isBlocked: false }] : [],
});

describe('AdminWineryForm', () => {
    it('alta: campos del diseño, sin Estado, Eliminar ni vinos relacionados', () => {
        const html = renderToStaticMarkup(createElement(AdminWineryForm));
        for (const label of [
            'Añadir una nueva bodega',
            'Información básica',
            'Nombre de la bodega',
            'Ciudad',
            'Provincia',
            'País',
            'Descripción',
            'Dirección',
            'Correo electrónico',
            'Teléfono',
            'Sitio web',
        ])
            expect(html).toContain(label);
        expect(html).not.toContain('Estado');
        expect(html).not.toContain('Eliminar');
        expect(html).not.toContain('Vinos relacionados');
    });
    it('ficha del administrador: Estado, Eliminar sin productos y estado vacío', () => {
        const html = renderToStaticMarkup(
            createElement(AdminWineryForm, { data: data(0), canBlock: true }),
        );
        expect(html).toContain('Estado');
        expect(html).toContain('A la venta');
        expect(html).toContain('Eliminar');
        expect(html).toContain('Vinos relacionados del catálogo (0)');
        expect(html).toContain('Todavía no hay productos');
        expect(html).toContain('Añadir producto');
    });
    it('ficha del editor: sin interruptor de Estado', () => {
        const html = renderToStaticMarkup(createElement(AdminWineryForm, { data: data(0) }));
        expect(html).not.toContain('role="switch"');
        expect(html).not.toContain('Ventas bloqueadas');
    });
    it('con productos no se ofrece Eliminar y se listan', () => {
        const html = renderToStaticMarkup(
            createElement(AdminWineryForm, { data: data(1), canBlock: true }),
        );
        expect(html).not.toContain('>Eliminar<');
        expect(html).toContain('Vinos relacionados del catálogo (1)');
        expect(html).toContain('Tinto Roble');
    });
});

describe('wineryRequest', () => {
    const reply = (status: number, body: unknown) =>
        vi.fn(
            async () => new Response(JSON.stringify(body), { status }),
        ) as unknown as typeof fetch;
    it('interpreta las respuestas', async () => {
        expect(await wineryRequest('/x', 'PATCH', {}, reply(200, { changed: true }))).toEqual({
            kind: 'ok',
            body: { changed: true },
        });
        expect(
            await wineryRequest('/x', 'POST', {}, reply(409, { message: 'Repetida' })),
        ).toMatchObject({
            kind: 'rejected',
            status: 409,
            message: 'Repetida',
        });
        expect(await wineryRequest('/x', 'DELETE', undefined, reply(500, {}))).toEqual({
            kind: 'error',
        });
        expect(
            await wineryRequest('/x', 'POST', {}, vi.fn().mockRejectedValue(new Error('red'))),
        ).toEqual({ kind: 'error' });
    });
});
