import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Se muestra cuando `/productos/[slug]` llama a `notFound()`: el slug no existe o el producto
 * no se puede mostrar (bloqueado, o sin presentaciones a la venta). No distingue los casos.
 */
export default function ProductNotFound() {
    return (
        <main className="container-main flex flex-col items-start gap-gap-lg py-inset-3xl">
            <h1 className="font-display text-4xl">Este producto no está disponible</h1>
            <Button asChild variant="brand" size="lg">
                <Link href="/productos">Volver al catálogo</Link>
            </Button>
        </main>
    );
}
