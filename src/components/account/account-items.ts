import { BookUser, Library, User } from 'lucide-react';

/** Secciones del área de cliente. */
export type AccountSection = 'datos' | 'pedidos' | 'direcciones';

/**
 * Enlaces del área de cliente, en orden. Los comparten el menú lateral de escritorio (`AccountNav`)
 * y la sección "Mi cuenta" del drawer móvil de la cabecera (`SiteHeader`).
 */
export const ACCOUNT_ITEMS = [
    { section: 'datos', label: 'Datos personales', href: '/cuenta/datos-personales', icon: User },
    { section: 'pedidos', label: 'Historial de pedidos', href: '/cuenta/pedidos', icon: Library },
    { section: 'direcciones', label: 'Direcciones', href: '/cuenta/direcciones', icon: BookUser },
] as const;
