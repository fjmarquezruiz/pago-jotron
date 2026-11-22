/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // `@react-pdf/renderer` (PDF de las facturas) usa módulos nativos de Node y no se empaqueta: se
        // carga tal cual desde `node_modules` en las rutas del servidor.
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
        // `pdfkit` (que usa react-pdf) lee las métricas de las fuentes estándar (Helvetica…, `.afm`)
        // del disco en tiempo de ejecución. El trazado de Vercel no las ve porque no se importan, y
        // sin ellas el PDF falla en producción: se incluyen a mano en la función de la factura.
        outputFileTracingIncludes: {
            '/api/pedidos/[id]/factura': [
                './node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/data/**',
            ],
        },
    },
};

export default nextConfig;
