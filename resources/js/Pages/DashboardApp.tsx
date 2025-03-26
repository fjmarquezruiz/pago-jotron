import { ReactNode } from "react";

const DashboardApp = ({ children }: { children: ReactNode }) => {
    return (
        // <div className="dashboard-layout">
        //     <header className="dashboard-header">Dashboard Header</header>
        //     <aside className="dashboard-sidebar">Sidebar</aside>
        //     <main className="dashboard-content">{children}</main>
        // </div>
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com"></link>
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            ></link>
            <link
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
                rel="stylesheet"
            ></link>
            {children}
        </>
    );
};

export default DashboardApp;
