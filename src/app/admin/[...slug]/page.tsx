import { notFound } from 'next/navigation';

/**
 * Toda ruta de `/admin` que no existe: lanza el 404 del panel (`../not-found.tsx`). Sin esto, Next
 * enseñaría el 404 genérico del sitio, no el del panel. El middleware ya filtra por rol antes.
 */
export default function AdminUnknownRoute(): never {
    notFound();
}
