// import '../css/app.css';
// import './bootstrap';

// import { createInertiaApp } from '@inertiajs/react';
// import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
// import { createRoot, hydrateRoot } from 'react-dom/client';

// const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// createInertiaApp({
//     title: (title) => `${title} - ${appName}`,
//     resolve: (name) =>
//         resolvePageComponent(
//             `./Pages/${name}.tsx`,
//             import.meta.glob('./Pages/**/*.tsx'),
//         ),
//     setup({ el, App, props }) {
//         if (import.meta.env.SSR) {
//             hydrateRoot(el, <App {...props} />);
//             return;
//         }

//         createRoot(el).render(<App {...props} />);
//     },
//     progress: {
//         color: '#4B5563',
//     },
// });

// resources/js/app.tsx
import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot, hydrateRoot } from "react-dom/client";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const page = await resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx"),
        );

        if (
            name.startsWith("Dashboard") ||
            name.startsWith("Auth/Login") ||
            name.startsWith("Public/AgeVerification")
        ) {
            const { default: DashboardApp } = await import(
                "./Pages/DashboardApp"
            );
            page.default.layout = (page: any) => (
                <DashboardApp>{page}</DashboardApp>
            );
        } else {
            const { default: PublicApp } = await import("./Pages/PublicApp");
            page.default.layout = (page: any) => <PublicApp>{page}</PublicApp>;
        }

        return page;
    },
    setup({ el, App, props }) {
        const app = <App {...props} />;

        if (import.meta.env.SSR) {
            hydrateRoot(el, app);
            return;
        }

        createRoot(el).render(app);
    },
    progress: {
        color: "#4B5563",
    },
});
