import { usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    // const user = usePage().props.auth.user;

    // const success: string = usePage().props.success;
    // const error: string = usePage().props.error;
    const user = (
        usePage().props as unknown as { auth: { user: { name: string } } }
    ).auth.user;

    const success: string = (usePage().props as unknown as { success: string })
        .success;
    const error: string = (usePage().props as unknown as { error: string })
        .error;

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOverlay, setIsSidebarOverlay] = useState(false);
    const [prevSidebarState, setPrevSidebarState] = useState(true);
    const [currentPath, setCurrentPath] = useState("/");

    useEffect(() => {
        const handleResize = () => {
            const isMobileView = window.innerWidth < 768;
            setIsMobile(isMobileView);
            setIsSidebarOverlay(isMobileView);
            if (!isMobileView) {
                setIsSidebarOpen(prevSidebarState);
            } else {
                setPrevSidebarState(isSidebarOpen);
                setIsSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isSidebarOpen, prevSidebarState]);

    useEffect(() => {
        const initialState = window.innerWidth >= 768;
        setIsSidebarOpen(initialState);
        setPrevSidebarState(initialState);

        // Update current path
        setCurrentPath(window.location.pathname);

        // Listen for route changes
        const handleRouteChange = () => {
            setCurrentPath(window.location.pathname);
            if (isMobile) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener("popstate", handleRouteChange);
        return () => window.removeEventListener("popstate", handleRouteChange);
    }, [isMobile]);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => {
            const newState = !prev;
            if (!isMobile) {
                setPrevSidebarState(newState);
            }
            return newState;
        });
    };

    return (
        <div className="flex h-screen min-h-screen bg-white dark:bg-gray-900">
            <Sidebar
                isOpen={isSidebarOpen}
                isMobile={isMobile}
                isOverlay={isSidebarOverlay}
                toggleSidebar={toggleSidebar}
                currentPath={currentPath}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
                <TopBar toggleSidebar={toggleSidebar} userName={user.name} />
                {/* <MainContent /> */}

                {header && (
                    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <div className="mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto">
                        {success && (
                            <div className="mb-8 rounded bg-emerald-400 px-6 py-4 text-gray-900 dark:bg-emerald-700 dark:text-gray-50">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="mb-8 rounded bg-red-400 px-6 py-4">
                                {error}
                            </div>
                        )}

                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
