import { buildSpecRows } from '@/lib/catalog/spec-sheet';
import type { ProductDetail } from '@/lib/db/queries';

interface ProductSpecSheetProps {
    /** Producto cargado con `getProductBySlug`. */
    product: ProductDetail;
}

/**
 * Tarjeta "Ficha Técnica": región, uvas, graduación, crianza, temperatura de servicio, producción
 * y formato de botella. Las filas sin dato no se pintan (las pasas no tienen graduación ni uvas)
 * y, sin ninguna fila, no devuelve nada.
 *
 * Una sola lista de definiciones con dos disposiciones, según el diseño:
 * - Escritorio (`lg`): rejilla de dos columnas (etiqueta de 164 px y valor) con el texto en 14 px
 *   y una línea entre filas, sin línea tras la última.
 * - Móvil: etiqueta de 14 px sobre el valor de 16 px y una línea tras cada fila, también la última.
 *
 * Desviación: el diseño móvil no trae la fila "Formato de botella" (la de escritorio sí); aquí se
 * pinta también en móvil para que las dos vistas enseñen los mismos datos.
 *
 * @example
 * <ProductSpecSheet product={product} />
 */
export function ProductSpecSheet({ product }: ProductSpecSheetProps) {
    const rows = buildSpecRows(product);
    if (rows.length === 0) return null;

    return (
        <section className="flex w-full flex-col gap-6 rounded-sm bg-muted p-6 lg:max-w-120 lg:p-10">
            <h2 className="font-display text-3xl font-medium">Ficha Técnica</h2>
            <dl className="flex flex-col gap-4 lg:py-4">
                {rows.map((row) => (
                    // La línea es un pseudo-elemento sobre el borde inferior del relleno: ocupa su
                    // píxel dentro del hueco de 16 px, como la línea de 0 px de alto de Figma.
                    <div
                        key={row.label}
                        className="relative flex flex-col gap-1 pb-4 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border lg:grid lg:grid-cols-[164px_minmax(0,1fr)] lg:items-start lg:gap-x-4 lg:last:pb-0 lg:last:after:hidden"
                    >
                        <dt className="text-sm font-medium text-muted-foreground">{row.label}</dt>
                        <dd className="text-base font-medium lg:text-sm">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
