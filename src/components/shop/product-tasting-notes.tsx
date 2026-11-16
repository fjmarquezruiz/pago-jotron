import { Badge } from '@/components/ui/badge';
import type { ProductDetail } from '@/lib/db/queries';

interface ProductTastingNotesProps {
    /** Producto cargado con `getProductBySlug`. */
    product: ProductDetail;
}

/** Bloque de texto con título: "Vista", "Notas", "Paladar", "Maridaje". */
function NoteBlock({ title, text }: { title: string; text: string }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="text-base">{text}</p>
        </section>
    );
}

/**
 * Notas de cata: las etiquetas de cata y los textos de vista ("Vista"), aroma ("Notas"), paladar
 * ("Paladar") y maridaje ("Maridaje"), en ese orden. Lo que no tiene dato no se pinta, y sin nada
 * que pintar no devuelve nada.
 *
 * El diseño tiene también un bloque "Final", pero la base de datos no guarda ese texto: el
 * maridaje va donde iría. "Vista" y "Maridaje" no están en el diseño; se añadieron a petición del
 * producto.
 *
 * @example
 * <ProductTastingNotes product={product} />
 */
export function ProductTastingNotes({ product }: ProductTastingNotesProps) {
    const tags = product.tastingTags.map(({ tastingTag }) => tastingTag);
    const visual = product.visualNote?.trim();
    const aroma = product.aromaNote?.trim();
    const palate = product.palateNote?.trim();
    const pairing = product.foodPairing?.trim();

    if (tags.length === 0 && !visual && !aroma && !palate && !pairing) return null;

    return (
        <div className="flex flex-col gap-8">
            {tags.length > 0 && (
                <ul className="flex flex-wrap gap-x-3 gap-y-1.5 lg:gap-y-3">
                    {tags.map((tag) => (
                        <li key={tag.id}>
                            <Badge className="h-control-xxs">{tag.name}</Badge>
                        </li>
                    ))}
                </ul>
            )}
            {visual && <NoteBlock title="Vista" text={visual} />}
            {aroma && <NoteBlock title="Notas" text={aroma} />}
            {palate && <NoteBlock title="Paladar" text={palate} />}
            {pairing && <NoteBlock title="Maridaje" text={pairing} />}
        </div>
    );
}
