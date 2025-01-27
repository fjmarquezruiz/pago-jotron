import { primaryButton } from "@/styles";
import { ButtonHTMLAttributes } from "react";

export default function PrimaryButton({
    className = "",
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `${primaryButton} ${disabled && "opacity-25"} ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
