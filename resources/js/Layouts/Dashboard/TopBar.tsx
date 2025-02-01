import ThemeToggle from "@/Layouts/Dashboard/ThemeToogle";
import { menuLinkClasses } from "@/styles";
import { Link } from "@inertiajs/react";
import { IconLogout, IconMenu, IconUser } from "@tabler/icons-react";

interface TopBarProps {
    toggleSidebar: () => void;
    userName: string;
}

export default function TopBar({ toggleSidebar, userName = "" }: TopBarProps) {
    return (
        <nav className="h-16 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center">
                    <button
                        onClick={toggleSidebar}
                        className="rounded-md p-2 text-gray-500 hover:text-gray-700 focus:bg-gray-100 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300 dark:focus:bg-gray-700"
                        aria-label="Toggle sidebar"
                        title="Toggle sidebar"
                    >
                        <IconMenu stroke={1.5} className="size-5" />
                    </button>
                </div>
                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <Link
                        href={route("profile.edit")}
                        as="button"
                        className={menuLinkClasses}
                        aria-label={userName}
                        title={userName}
                    >
                        {userName} <IconUser stroke={1.5} className="size-5" />
                    </Link>
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className={menuLinkClasses}
                        aria-label="Log out"
                        title="Log out"
                    >
                        <IconLogout stroke={1.5} className="size-5" />
                    </Link>
                </div>
            </div>
        </nav>
    );
}
