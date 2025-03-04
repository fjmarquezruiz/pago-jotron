import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva("button", {
    variants: {
        variant: {
            primary: "button-primary",
            default:
                "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            destructive:
                "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            outline:
                "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary:
                "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
            ghost: "text-neutral-900 hover:text-neutral-800",
            link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "font-sm-semibold button-size-sm",
            md: "font-sm-semibold button-size-md",
            lg: "font-base-semibold button-size-lg",
            xl: "font-base-semibold button-size-xl",
            icon: "h-9 w-9",
            "icon-md": "h-10 w-10",
            "icon-lg": "h-12 w-12",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
