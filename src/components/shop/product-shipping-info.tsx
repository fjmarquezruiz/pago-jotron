import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

// Texto del diseño de Figma: confirmar con la bodega.
const SHIPPING = [
    'Entrega estándar: 3-5 días laborables (gratis a partir de 100 €).',
    'Entrega exprés: 1-2 días laborables (9,95 €).',
    'Solo enviamos dentro de España peninsular.',
    'Todos los pedidos se embalan con cuidado en cajas de protección para vino.',
];

// Texto del diseño de Figma: confirmar con la bodega.
const RETURNS = [
    'Plazo de devolución de 14 días para botellas sin abrir.',
    'Solo aceptamos devoluciones de botellas sin abrir y en buen estado. Te devolvemos el importe en un máximo de 14 días.',
    'Reembolsos procesados en 5–7 días laborables.',
];

/** Sección del desplegable: un título y su lista de condiciones. */
function PolicySection({ title, items }: { title: string; items: readonly string[] }) {
    return (
        <section className="flex flex-col gap-4">
            <h3 className="font-medium text-foreground">{title}</h3>
            <ul className="flex list-disc flex-col gap-2 ps-[21px] text-muted-foreground">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </section>
    );
}

/**
 * Desplegable "Envío y devoluciones" de la ficha, cerrado al cargar, entre dos líneas. Los textos
 * son los del diseño de Figma.
 *
 * @example
 * <ProductShippingInfo />
 */
export function ProductShippingInfo() {
    return (
        <div className="flex flex-col gap-4">
            <Separator />
            <Accordion type="single" collapsible variant="flush" size="lg">
                <AccordionItem value="envio-y-devoluciones" className="border-b-0">
                    <AccordionTrigger className="items-center gap-gap-lg px-inset-xs [&>svg]:mt-0">
                        Envío y devoluciones
                    </AccordionTrigger>
                    <AccordionContent className="px-inset-xs pt-inset-2xs">
                        <div className="flex flex-col gap-6 text-sm">
                            <PolicySection title="Envío" items={SHIPPING} />
                            <PolicySection title="Devoluciones" items={RETURNS} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Separator />
        </div>
    );
}
