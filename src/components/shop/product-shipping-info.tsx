import Link from 'next/link';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { TextLink } from '@/components/ui/link';
import { formatShippingOption, type ShippingOptionInput } from '@/lib/catalog/shipping';

// Texto del diseño de Figma que no sale de la BD: confirmar con la bodega.
const SHIPPING_NOTES = [
    'Solo enviamos dentro de España peninsular.',
    'Todos los pedidos se embalan con cuidado en cajas de protección para vino.',
];

interface ProductShippingInfoProps {
    /** Modalidades de envío disponibles (`getShippingTypes`): de ellas salen el plazo y el precio. */
    shippingTypes: readonly ShippingOptionInput[];
}

/** Sección del desplegable: un título y su contenido. */
function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <h3 className="font-medium text-foreground">{title}</h3>
            {children}
        </section>
    );
}

/**
 * Desplegable "Envío y devoluciones" de la ficha, cerrado al cargar, entre dos líneas.
 *
 * - Envío: una línea por modalidad de envío de la BD (nombre, plazo y precio), más las dos notas
 *   del diseño. Así el precio que se lee aquí es el que cobrará el checkout (A8).
 * - Devoluciones: remite a las condiciones de compra, que mandan sobre cualquier texto de la ficha.
 *
 * @example
 * <ProductShippingInfo shippingTypes={await getShippingTypes()} />
 */
export function ProductShippingInfo({ shippingTypes }: ProductShippingInfoProps) {
    const shippingLines = [...shippingTypes.map(formatShippingOption), ...SHIPPING_NOTES];

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
                            <PolicySection title="Envío">
                                <ul className="flex list-disc flex-col gap-2 ps-5 text-muted-foreground">
                                    {shippingLines.map((line) => (
                                        <li key={line}>{line}</li>
                                    ))}
                                </ul>
                            </PolicySection>
                            <PolicySection title="Devoluciones">
                                <p className="text-muted-foreground">
                                    Consulta el plazo y las condiciones de devolución en nuestras{' '}
                                    {/* TODO(A7): la página /condiciones aún no existe. */}
                                    <TextLink asChild>
                                        <Link href="/condiciones">condiciones de compra</Link>
                                    </TextLink>
                                    .
                                </p>
                            </PolicySection>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Separator />
        </div>
    );
}
