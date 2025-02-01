import { ReactNode } from "react";

const DashboardApp = ({ children }: { children: ReactNode }) => {
    return (
        // <div className="dashboard-layout">
        //     <header className="dashboard-header">Dashboard Header</header>
        //     <aside className="dashboard-sidebar">Sidebar</aside>
        //     <main className="dashboard-content">{children}</main>
        // </div>
        <>{children}</>
    );
};

export default DashboardApp;
