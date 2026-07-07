import { cn } from '../../lib/utils';

export function Card({ children, className, hoverable = false, padding = 'md', ...props }) {
    const paddings = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' };
    return (
        <div
            className={cn(
                'rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-colors',
                'dark:border-slate-800 dark:bg-slate-900 dark:shadow-[var(--shadow-card-dark)]',
                hoverable &&
                    'transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] dark:hover:shadow-[var(--shadow-card-hover-dark)]',
                paddings[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }) {
    return (
        <div className={cn('mb-4 flex items-start justify-between gap-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }) {
    return (
        <h3 className={cn('text-base font-semibold text-slate-900 dark:text-white', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className, ...props }) {
    return (
        <p className={cn('mt-1 text-sm text-slate-500 dark:text-slate-400', className)} {...props}>
            {children}
        </p>
    );
}
