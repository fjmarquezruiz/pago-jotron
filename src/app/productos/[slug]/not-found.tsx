import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Se muestra cuando `/productos/[slug]` llama a `notFound()`: el slug no existe o el producto
 * no se puede mostrar (bloqueado, o sin presentaciones a la venta). No distingue los casos.
 *
 * Usa el estado vacío del diseño (Figma: empty-state). No lleva texto de apoyo porque el diseño
 * no trae ninguno para este caso.
 */
export default function ProductNotFound() {
    return (
        <main className="mx-auto w-full max-w-9xl px-6 py-16 lg:py-40">
            <div className="mx-auto w-full max-w-6xl">
                <EmptyState
                    titleAs="h1"
                    title="Este producto no está disponible"
                    action={
                        <Button asChild variant="brand">
                            <Link href="/productos">Explora nuestros vinos</Link>
                        </Button>
                    }
                />
            </div>
        </main>
    );
}
