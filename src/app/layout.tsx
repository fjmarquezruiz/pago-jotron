import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

/** Funnel Display: fuente de los titulares grandes (3xl en adelante). */
const funnelDisplay = localFont({
    src: '../../node_modules/@fontsource-variable/funnel-display/files/funnel-display-latin-wght-normal.woff2',
    variable: '--font-funnel-display',
    weight: '300 800',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Pago de Jotrón',
    description: 'Vinos, pasas y visitas de la Bodega Pago de Jotrón y otras bodegas andaluzas.',
};

/**
 * Layout raíz: carga las tres familias tipográficas del sistema de diseño
 * y monta el contenedor de toasts.
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="es"
            className={`${GeistSans.variable} ${GeistMono.variable} ${funnelDisplay.variable}`}
        >
            <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
