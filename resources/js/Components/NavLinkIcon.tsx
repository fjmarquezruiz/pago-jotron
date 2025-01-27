import { menuLinkClasses } from "@/styles";
import { Link } from "@inertiajs/react";
import React from "react";

interface IconProps {
    stroke?: string | number;
    className?: string;
}

interface NavLinkProps {
    href: string;
    active: boolean;
    className?: string;
    icon?: React.ComponentType<IconProps>;
    isOpen: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}

export default function NavLinkIcon({
    href,
    active = false,
    className = "",
    icon: IconComponent,
    isOpen = false,
    children,
    onClick,
    ...props
}: NavLinkProps) {
    const dynamicClasses = `${menuLinkClasses} px-4 ${isOpen ? "w-full sm:px-6" : "justify-center w-12 sm:px-0"} h-12 ${
        active
            ? "!bg-gray-200 dark:!bg-gray-700 text-gray-900 dark:text-gray-100"
            : ""
    } ${className}`;

    return (
        <Link
            href={href}
            className={dynamicClasses}
            onClick={onClick}
            {...props}
        >
            {IconComponent && (
                <IconComponent
                    stroke={1.5}
                    className="size-5"
                    aria-hidden="true"
                />
            )}
            <span className={`${isOpen ? "" : "hidden"}`}>{children}</span>
        </Link>
    );
}
