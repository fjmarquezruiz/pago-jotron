import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import { AdminBox } from './admin-box';
import { AdminFormPage } from './admin-form-page';
import { AdminListFilters } from './admin-list-filters';
import { AdminSalesToggle } from './admin-sales-toggle';
import { AdminValuesTable } from './admin-values-table';

describe('AdminBox', () => {
    it('título, acción de cabecera y contenido', () => {
        const html = renderToStaticMarkup(
            createElement(
                AdminBox,
                {
                    title: 'Presentaciones',
                    titleId: 'p',
                    action: createElement('button', null, 'Añadir'),
                } as unknown as ComponentProps<typeof AdminBox>,
                'contenido',
            ),
        );
        expect(html).toContain('aria-labelledby="p"');
        expect(html).toContain('Presentaciones');
        expect(html).toContain('Añadir');
        expect(html).toContain('contenido');
    });
});

describe('AdminFormPage', () => {
    const render = (props = {}) =>
        renderToStaticMarkup(
            createElement(
                AdminFormPage,
                {
                    breadcrumb: [{ label: 'Bodegas', href: '/admin/bodegas' }, { label: 'Nueva' }],
                    title: 'Nueva bodega',
                    formId: 'f',
                    onSubmit: () => undefined,
                    cancelHref: '/admin/bodegas',
                    ...props,
                } as unknown as ComponentProps<typeof AdminFormPage>,
                'cajas',
            ),
        );
    it('Cancelar y Guardar en las dos barras, enlazados al formulario', () => {
        const html = render();
        expect(html.match(/Cancelar/g)).toHaveLength(2);
        expect(html.match(/form="f"/g)).toHaveLength(2);
        expect(html).toContain('href="/admin/bodegas"');
        expect(html).toContain('cajas');
    });
    it('el estado solo va arriba y Guardar se desactiva sin cambios', () => {
        const html = render({ status: createElement('i', null, 'ESTADO'), saveDisabled: true });
        expect(html.match(/ESTADO/g)).toHaveLength(1);
        expect(html.match(/disabled=""/g)).toHaveLength(2);
    });
});

describe('AdminSalesToggle', () => {
    const render = (isBlocked: boolean) =>
        renderToStaticMarkup(
            createElement(AdminSalesToggle, {
                isBlocked,
                noun: 'producto',
                article: 'El',
                name: 'Reserva',
                onChange: async () => true,
            }),
        );
    it('encendido es «A la venta»; apagado, «Ventas bloqueadas»', () => {
        expect(render(false)).toContain('A la venta');
        expect(render(false)).toContain('aria-checked="true"');
        expect(render(true)).toContain('Ventas bloqueadas');
        expect(render(true)).toContain('aria-checked="false"');
    });
});

describe('AdminListFilters', () => {
    it('chips, limpiar, lupa y botón de crear', () => {
        const html = renderToStaticMarkup(
            createElement(AdminListFilters, {
                chips: [{ label: 'Estado: todos' }],
                clearHref: '/admin/bodegas',
                onSearch: () => undefined,
                searchLabel: 'Buscar bodegas',
                filterPanel: () => null,
                action: (size) => createElement('b', null, `Nueva ${size}`),
            }),
        );
        expect(html).toContain('Estado: todos');
        expect(html).toContain('href="/admin/bodegas"');
        expect(html).toContain('aria-label="Buscar bodegas"');
        expect(html).toContain('Filtrar');
        expect(html).toContain('Nueva xs');
    });
});

describe('AdminValuesTable', () => {
    interface Row {
        id: number;
        name: string;
        inUse: boolean;
    }
    const rows: Row[] = [
        { id: 1, name: 'Tempranillo', inUse: true },
        { id: 2, name: 'Garnacha', inUse: false },
    ];
    const html = renderToStaticMarkup(
        createElement(AdminValuesTable<Row>, {
            rows,
            getRowKey: (r) => r.id,
            getRowName: (r) => r.name,
            editHref: (r) => `/admin/uvas/${r.id}`,
            onDelete: () => undefined,
            canDelete: (r) => !r.inUse,
            columns: [
                { key: 'id', header: 'ID', strong: true, cell: (r) => `GRA-${r.id}` },
                { key: 'name', header: 'Uva', cell: (r) => r.name },
            ],
        }),
    );
    it('cabeceras, filas y columna de acciones', () => {
        expect(html).toContain('Uva');
        expect(html).toContain('GRA-2');
        expect(html).toContain('Acciones');
        expect(html).toContain('href="/admin/uvas/1"');
    });
    it('la papelera solo sale en los valores sin uso', () => {
        expect(html).not.toContain('Eliminar Tempranillo');
        expect(html).toContain('Eliminar Garnacha');
    });
});

describe('AdminSalesToggle: confirmaciones', () => {
    it('no pinta ningún modal hasta tocar el interruptor', () => {
        const html = renderToStaticMarkup(
            createElement(AdminSalesToggle, {
                isBlocked: true,
                noun: 'bodega',
                article: 'La',
                name: 'Lustau',
                onChange: async () => true,
            }),
        );
        expect(html).not.toContain('Poner a la venta');
        expect(html).not.toContain('Bloquear bodega');
    });
});
