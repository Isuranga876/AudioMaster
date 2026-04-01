import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export const Card = React.forwardRef(({ className, children, hoverEffect = false, ...props }, ref) => {
    const Component = hoverEffect ? motion.div : 'div';
    const animationProps = hoverEffect ? { whileHover: { y: -5, scale: 1.01 } } : {};

    return (
        <Component
            ref={ref}
            className={cn(
                "rounded-2xl bg-[#23233D] border border-white/5 backdrop-blur-xl shadow-xl",
                className
            )}
            {...animationProps}
            {...props}
        >
            {children}
        </Component>
    );
});
Card.displayName = "Card";
