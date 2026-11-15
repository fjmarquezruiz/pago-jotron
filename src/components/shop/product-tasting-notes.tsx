import { Badge } from '@/components/ui/badge';
import type { ProductDetail } from '@/lib/db/queries';

interface ProductTastingNotesProps {
    /** Producto cargado con `getProductBySlug`. */
    product: ProductDetail;
}

/** Bloque de texto con título: "Notas", "Paladar". */
function NoteBlock({ title, text }: { title: string; text: string }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="text-base">{text}</p>
        </section>
    );
}

/**
 * Notas de cata: las etiquetas de cata y los textos de aroma ("Notas") y de paladar ("Paladar").
 * Lo que no tiene dato no se pinta, y sin ninguno de los tres no devuelve nada. El diseño tiene
 * también un bloque "Final", pero la base de datos no guarda ese texto.
 *
 * @example
 * <ProductTastingNotes product={product} />
 */
export function ProductTastingNotes({ product }: ProductTastingNotesProps) {
    const tags = product.tastingTags.map(({ tastingTag }) => tastingTag);
    const aroma = product.aromaNote?.trim();
    const palate = product.palateNote?.trim();

    if (tags.length === 0 && !aroma && !palate) return null;

    return (
        <div className="flex flex-col gap-8">
            {tags.length > 0 && (
                <ul className="flex flex-wrap gap-x-3 gap-y-1.5 lg:gap-y-3">
                    {tags.map((tag) => (
                        <li key={tag.id}>
                            <Badge>{tag.name}</Badge>
                        </li>
                    ))}
                </ul>
            )}
            {aroma && <NoteBlock title="Notas" text={aroma} />}
            {palate && <NoteBlock title="Paladar" text={palate} />}
        </div>
    );
}
