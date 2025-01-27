import { menuLinkClasses } from "@/styles";
import { InertiaLinkProps, Link } from "@inertiajs/react";
import React from "react";

interface IconProps {
    stroke?: string | number;
    className?: string;
    // "aria-hidden"?: string;
}

interface NavLinkProps extends InertiaLinkProps {
    active: boolean;
    className?: string;
    icon?: React.ComponentType<IconProps>;
    isOpen: boolean;
    children: React.ReactNode;
}

export default function NavLinkIcon({
    active = false,
    className = "",
    icon: IconComponent,
    isOpen = false,
    children,
    ...props
}: NavLinkProps) {
    const dynamicClasses = `${menuLinkClasses} px-4 ${
        isOpen ? "w-full sm:px-6" : "justify-center w-12 sm:px-0"
    } h-12 ${
        active
            ? "!bg-gray-200 dark:!bg-gray-700 text-gray-900 dark:text-gray-100"
            : ""
    } ${className}`;

    return (
        <Link {...props} className={dynamicClasses} alt={children?.toString()}>
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
