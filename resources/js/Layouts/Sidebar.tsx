import DividerFields from "@/Components/Forms/DividerFields";
import NavLinkIcon from "@/Components/NavLinkIcon";
import { can } from "@/helpers";
import { usePage } from "@inertiajs/react";
import {
    IconBarrel,
    IconBottle,
    IconGlassFull,
    IconHelpCircle,
    IconHome,
    IconMap,
    IconSettings,
    IconUsers,
    IconX,
} from "@tabler/icons-react";

interface SidebarProps {
    isOpen: boolean;
    isMobile: boolean;
    isOverlay: boolean;
    toggleSidebar: () => void;
    currentPath: string;
}

const menuItems = [
    { icon: IconHome, label: "Dashboard", routeName: "dashboard" },
    { icon: IconBottle, label: "Wines", routeName: "vino.index" },
    { icon: IconBarrel, label: "Wineries", routeName: "bodega.index" },
    {
        icon: IconMap,
        label: "Origin denominations",
        routeName: "denominacion.index",
    },
    { icon: IconGlassFull, label: "Grapes", routeName: "uva.index" },
    { icon: IconSettings, label: "Features (NO)", routeName: "feature.index" },
    { icon: IconHelpCircle, label: "Help (NO)", routeName: "vino.index" }, // Assuming a route name for help
];

{
    /* <NavLinkIcon
    href={route("dashboard")}
    active={route().current("dashboard")}
>
    Dashboard
</NavLinkIcon>
{can(user, "manage_users") && (
    <NavLinkIcon
        href={route("user.index")}
        active={route().current("user.index")}
    >
        Users
    </NavLinkIcon>
)}
<NavLinkIcon
    href={route("feature.index")}
    active={route().current("feature.index")}
>
    Features
</NavLinkIcon>
<NavLinkIcon
    href={route("vino.index")}
    active={route().current("vino.index")}
>
    Vinos
</NavLinkIcon>
<NavLinkIcon
    href={route("bodega.index")}
    active={route().current("bodega.index")}
>
    Bodegas
</NavLinkIcon>
<NavLinkIcon
    href={route("uva.index")}
    active={route().current("uva.index")}
>
    Uvas
</NavLinkIcon> */
}

export default function Sidebar({
    isOpen,
    isMobile,
    isOverlay,
    toggleSidebar,
    currentPath,
}: SidebarProps) {
    const user = usePage().props.auth.user;
    return (
        <>
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50"
                    aria-hidden="true"
                    onClick={toggleSidebar}
                />
            )}

            <aside
                className={`border-r border-gray-200 bg-white text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 dark:text-white ${
                    isOpen ? "w-72" : isMobile ? "w-0" : "w-20"
                } ${
                    isMobile
                        ? isOpen
                            ? "fixed inset-y-0 left-0 z-30"
                            : "fixed inset-y-0 -left-72 z-30"
                        : ""
                }`}
            >
                <div className="flex h-16 flex-shrink-0 items-center justify-between overflow-hidden border-b border-gray-200 p-4 dark:border-gray-700 sm:px-6">
                    <h1
                        className={`text-2xl font-bold ${isOpen ? "" : "hidden"}`}
                    >
                        bodega jotron
                    </h1>
                    {isMobile && isOpen && (
                        <button
                            onClick={toggleSidebar}
                            className="rounded-md p-2 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
                            aria-label="Close sidebar"
                            title="Close sidebar"
                        >
                            <IconX stroke={1.5} className="size-5" />
                        </button>
                    )}
                </div>
                <nav
                    className={`flex flex-1 flex-col gap-6 py-4 ${isOpen ? "overflow-y-auto" : "overflow-hidden"} ${
                        isOpen ? (isMobile ? "px-4" : "px-6") : "px-4"
                    }`}
                >
                    <ul className="flex flex-col gap-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                {/* <NavLinkIcon
                                    href={route(item.routeName)}
                                    active={route().current(item.routeName)}
                                    icon={item.icon}
                                    isOpen={isOpen}
                                    aria-label={item.label}
                                    title={item.label}
                                    onClick={
                                        isMobile ? toggleSidebar : undefined
                                    }
                                >
                                    {item.label}
                                </NavLinkIcon> */}
                                <NavLinkIcon
                                    href={route(item.routeName)}
                                    active={
                                        currentPath === route(item.routeName)
                                    }
                                    icon={item.icon}
                                    isOpen={isOpen}
                                    onClick={() => {
                                        if (isMobile) {
                                            toggleSidebar();
                                        }
                                    }}
                                >
                                    {item.label}
                                </NavLinkIcon>
                            </li>
                        ))}
                    </ul>
                    <DividerFields />
                    <ul className="flex flex-col gap-1">
                        {can(user, "manage_users") && (
                            <li>
                                {/* <NavLinkIcon
                                    href={route("user.index")}
                                    active={route().current("user.index")}
                                    icon={IconUsers}
                                    isOpen={isOpen}
                                    aria-label="Users"
                                    title="Users"
                                >
                                    Users
                                </NavLinkIcon> */}
                                <NavLinkIcon
                                    href={route("user.index")}
                                    active={currentPath === route("user.index")}
                                    icon={IconUsers}
                                    isOpen={isOpen}
                                    aria-label="Users"
                                    onClick={() => {
                                        if (isMobile) {
                                            toggleSidebar();
                                        }
                                    }}
                                >
                                    Users
                                </NavLinkIcon>
                            </li>
                        )}
                    </ul>
                </nav>
            </aside>
        </>
    );
}
