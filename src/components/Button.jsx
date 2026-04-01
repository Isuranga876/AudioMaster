import React from 'react';
import { cn } from '../lib/utils';


export const Button = React.forwardRef(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none ring-offset-dark";

        const variants = {
            primary: "bg-primary text-white hover:bg-purple-600 shadow-[0_0_15px_rgba(127,0,255,0.5)] hover:shadow-[0_0_25px_rgba(127,0,255,0.8)]",
            accent: "bg-accent text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(255,77,109,0.5)] hover:shadow-[0_0_25px_rgba(255,77,109,0.8)]",
            outline: "border-2 border-primary text-primary hover:bg-primary/10",
            ghost: "hover:bg-white/10 text-gray-300 hover:text-white",
        };

        const sizes = {
            sm: "h-9 px-4 text-sm",
            md: "h-11 px-8 text-base",
            lg: "h-14 px-10 text-lg font-bold",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}

                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
