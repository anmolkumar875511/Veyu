import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const VARIANTS = {
    primary:
        'bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:outline-primary-600 disabled:bg-primary-300 dark:bg-primary-500 dark:hover:bg-primary-400 dark:disabled:bg-primary-800 dark:disabled:text-slate-400',
    secondary:
        'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:text-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600 dark:disabled:text-slate-600',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:disabled:text-slate-600',
    danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:bg-rose-300 dark:bg-rose-500 dark:hover:bg-rose-400',
    outlineDanger:
        'bg-transparent text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:text-rose-300 dark:text-rose-400 dark:border-rose-900 dark:hover:bg-rose-950',
};

const SIZES = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
    icon: 'h-10 w-10 p-0',
};

/**
 * Button — the single interactive-action primitive for the app.
 *
 * <Button variant="primary" icon={Plus} loading={isSaving}>Save changes</Button>
 */
const Button = forwardRef(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            icon: Icon,
            iconPosition = 'left',
            loading = false,
            disabled = false,
            fullWidth = false,
            className,
            type = 'button',
            ...props
        },
        ref
    ) => {
        return (
            <motion.button
                ref={ref}
                type={type}
                disabled={disabled || loading}
                whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
                whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
                transition={{ duration: 0.12 }}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                    'disabled:cursor-not-allowed',
                    VARIANTS[variant],
                    SIZES[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            >
                {loading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                    Icon && iconPosition === 'left' && <Icon className="size-4" aria-hidden="true" />
                )}
                {children}
                {!loading && Icon && iconPosition === 'right' && <Icon className="size-4" aria-hidden="true" />}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
export default Button;
