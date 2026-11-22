/** @type {import('next').NextConfig} */
const nextConfig = {
    // `@react-pdf/renderer` (PDF de las facturas) usa módulos nativos de Node y no se empaqueta: se
    // carga tal cual desde `node_modules` en las rutas del servidor.
    experimental: { serverComponentsExternalPackages: ['@react-pdf/renderer'] },
};

export default nextConfig;
