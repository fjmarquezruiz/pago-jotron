import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
    title: 'Pago de Jotrón',
    description: 'Vinos, pasas y visitas de la Bodega Pago de Jotrón y otras bodegas andaluzas.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
            <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
