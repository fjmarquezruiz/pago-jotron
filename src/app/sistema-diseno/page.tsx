import type { Metadata } from 'next';
import { DesignSystemShowcase } from '@/components/design-system/showcase';

export const metadata: Metadata = {
    title: 'Sistema de diseño · Pago de Jotrón',
    description: 'Tokens y componentes de Jotron DS con sus variantes.',
    // Página interna de referencia: que no la indexen los buscadores.
    robots: { index: false, follow: false },
};

/**
 * Página de muestra del sistema de diseño Jotron DS (`/sistema-diseno`).
 * Enseña tokens y componentes en claro u oscuro y en densidad cómoda o compacta.
 * Es pública: la ruta está en `isPublicPath` de `src/middleware.ts`.
 */
export default function SistemaDisenoPage() {
    return <DesignSystemShowcase />;
}
