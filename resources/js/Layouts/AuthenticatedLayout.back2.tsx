import { usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const success: string = usePage().props.success;
    const error: string = usePage().props.error;

    const isMobileView = window.innerWidth < 768;

    const [isSidebarOpen, setIsSidebarOpen] = useState(
        !isMobileView ? true : false,
    );
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOverlay, setIsSidebarOverlay] = useState(false);
    // const [prevSidebarState, setPrevSidebarState] = useState(
    //     isMobileView ? true : false,
    // );

    useEffect(() => {
        const handleResize = () => {
            const isMobileView = window.innerWidth < 768;
            setIsMobile(isMobileView);
            setIsSidebarOverlay(isMobileView);
            if (!isMobileView) {
                setIsSidebarOpen(true);
                // setPrevSidebarState(false);
            } else {
                setIsSidebarOpen(false);
                // setPrevSidebarState(true);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
        // setPrevSidebarState((prev) => !prev);
        if (isMobile) {
            setIsSidebarOverlay((prev) => !prev);
        }
    };

    // console.log(
    //     "isMobile " + isMobile,
    //     " - isSidebarOpen " + isSidebarOpen,
    //     " - prevSidebarState " + prevSidebarState,
    //     " - isSidebarOverlay " + isSidebarOverlay,
    // );

    return (
        <div className="flex h-screen min-h-screen bg-white dark:bg-gray-900">
            <Sidebar
                isOpen={isSidebarOpen}
                isMobile={isMobile}
                isOverlay={isSidebarOverlay}
                toggleSidebar={toggleSidebar}
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
