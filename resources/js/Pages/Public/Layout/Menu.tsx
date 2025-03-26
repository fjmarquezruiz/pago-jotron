"use client";

import Logo from "@/Components/Logo";
import { User } from "@/types";
import { Link } from "@inertiajs/react";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import CartBadge from "../Shop/CartBadge";
// import { CartBadge } from "../Shop/CartBadge";

interface HeaderProps {
    auth: {
        user: User;
    };
    section?: string;
    mode?: "light" | "dark";
}

interface MenuItemProps {
    label: string;
    link: string;
    active: boolean;
    mode?: "light" | "dark";
}

const MenuItem = ({
    label,
    link,
    active = false,
    mode = "light",
}: MenuItemProps) => {
    const isLight = mode === "light";

    return (
        <Link
            href={link}
            className={`${isLight ? "text-white" : "text-neutral-900"} ${active && isLight ? "border-white" : ""} ${active && !isLight ? "border-neutral-900" : ""} font-sm-semibold border-b border-transparent uppercase hover:border-white`}
            // className={`inline-flex h-7 items-center rounded p-2 text-base font-medium uppercase leading-7 focus:bg-white/20 focus:outline-none ${
            //     active
            //         ? "!bg-gray-200 text-gray-900 dark:!bg-gray-700 dark:text-gray-100"
            //         : ""
            // } ${mode === "dark" ? "text-neutral-900 hover:bg-neutral-700/10" : "text-white"} ${
            //     mode === "dark" && active
            //         ? "!bg-gray-700/10 text-gray-900 dark:!bg-gray-700 dark:text-gray-100"
            //         : ""
            // }`}
        >
            {/* <span className="inline-flex border-b border-transparent hover:border-white focus:border-transparent hover:focus:border-transparent active:border-white group-active:border-white"> */}
            {label}
            {/* </span> */}
        </Link>
    );
};

const Menu = ({ auth, section = "", mode = "light" }: HeaderProps) => {
    const [currentPath, setCurrentPath] = useState("/");

    useEffect(() => {
        // Update current path
        setCurrentPath(window.location.pathname);
    }, []);

    return (
        <header className="relative z-10">
            <div className="container mx-auto px-4 text-white">
                <div className="flex h-[72px] items-center justify-between py-3">
                    <Link href="/">
                        <Logo mode={mode} />
                    </Link>

                    <div className="flex items-center gap-0">
                        <nav className="mr-6 hidden items-center gap-6 md:flex">
                            <MenuItem
                                label="The shop"
                                link="/shop"
                                active={
                                    currentPath === "/shop" ||
                                    currentPath.includes("/detail")
                                }
                                mode={mode}
                            />
                            <MenuItem
                                label="Events"
                                link="/events"
                                active={currentPath === "/events"}
                                mode={mode}
                            />
                            <MenuItem
                                label="The winery"
                                link="/winery"
                                active={currentPath === "/winery"}
                                mode={mode}
                            />
                            <MenuItem
                                label="Blog"
                                link="/blog"
                                active={currentPath === "/blog"}
                                mode={mode}
                            />
                            <MenuItem
                                label="Contact"
                                link="/contact"
                                active={currentPath === "/contact"}
                                mode={mode}
                            />
                            {auth.user && (
                                <MenuItem
                                    label="Dashboard"
                                    link={route("dashboard")}
                                    active={currentPath === "/dashboard"}
                                    mode={mode}
                                />
                            )}
                        </nav>

                        {auth.user ? (
                            <Link
                                href={route("profile.edit")}
                                as="button"
                                className={`font-sm-semibold h-10 button button-size-md ${mode === "dark" ? "button-ghost" : "button-ghost-dark"}`}
                                aria-label={auth.user.name}
                                title={auth.user.name}
                            >
                                {auth.user.name}{" "}
                                <IconUser stroke={1.5} className="size-5" />
                            </Link>
                        ) : (
                            <Link
                                href={route("login")}
                                // className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent p-2 text-sm font-medium leading-4 text-white transition duration-150 ease-in-out hover:bg-white/10 focus:bg-white/20 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300 dark:focus:bg-gray-700"
                                className={`h-10 w-10 border border-transparent bg-transparent px-0 button ${mode === "dark" ? "button-ghost" : "button-ghost-dark"}`}
                                aria-label="Log in"
                                title="Log in"
                            >
                                <IconUser stroke={1.5} className="size-5" />
                                <span className="sr-only">Log in</span>
                            </Link>
                        )}

                        <CartBadge mode={mode} />

                        {auth.user && (
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className={`h-10 w-10 border border-transparent bg-transparent px-0 button ${mode === "dark" ? "button-ghost" : "button-ghost-dark"}`}
                                aria-label="Log out"
                                title="Log out"
                            >
                                <IconLogout stroke={1.5} className="size-5" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Menu;
