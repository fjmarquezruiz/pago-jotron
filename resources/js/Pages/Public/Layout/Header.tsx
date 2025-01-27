"use client";

import { Link } from "@inertiajs/react";
import { IconUser } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { CartBadge } from "../Shop/CartBadge";

interface HeaderProps {
    section?: string;
}

interface MenuItemProps {
    label: string;
    link: string;
    active: boolean;
}

const MenuItem = ({ label, link, active = false }: MenuItemProps) => {
    return (
        <Link
            href={link}
            className={`inline-flex h-7 items-center rounded p-2 text-base font-medium uppercase leading-7 focus:bg-white/20 focus:outline-none ${
                active
                    ? "!bg-gray-200 text-gray-900 dark:!bg-gray-700 dark:text-gray-100"
                    : ""
            }`}
        >
            <span className="inline-flex border-b border-transparent hover:border-white focus:border-transparent hover:focus:border-transparent">
                {label}
            </span>
        </Link>
    );
};

const Header = ({ section = "" }: HeaderProps) => {
    const [currentPath, setCurrentPath] = useState("/");

    useEffect(() => {
        // Update current path
        setCurrentPath(window.location.pathname);
    }, []);

    return (
        <header className="relative z-10">
            <div className="container mx-auto px-4 text-white">
                <div className="flex h-[72px] items-center justify-between py-3">
                    {section.toLowerCase() === "home" ? (
                        <div></div>
                    ) : (
                        <Link
                            href="/"
                            className="font-display inline-flex h-7 items-center justify-center rounded bg-white px-2.5 text-lg font-bold uppercase leading-none tracking-tight text-black"
                        >
                            Bodega Pago de Jotrón
                        </Link>
                    )}

                    <div className="flex items-center gap-4">
                        <nav className="hidden items-center gap-6 md:flex">
                            <MenuItem
                                label="The shop"
                                link="/shop"
                                active={currentPath === "/shop"}
                            />
                            <MenuItem
                                label="Events"
                                link="/events"
                                active={currentPath === "/events"}
                            />
                            <MenuItem
                                label="The winery"
                                link="/winery"
                                active={currentPath === "/winery"}
                            />
                            <MenuItem
                                label="Blog"
                                link="/blog"
                                active={currentPath === "/blog"}
                            />
                            <MenuItem
                                label="Contact"
                                link="/contact"
                                active={currentPath === "/contact"}
                            />
                        </nav>

                        <Link
                            href={route("login")}
                            className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent p-2 text-sm font-medium leading-4 text-white transition duration-150 ease-in-out hover:bg-white/10 focus:bg-white/20 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300 dark:focus:bg-gray-700"
                            aria-label="Log in"
                            title="Log in"
                        >
                            <IconUser stroke={1.5} className="size-5" />
                            <span className="sr-only">Log in</span>
                        </Link>

                        <CartBadge />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
