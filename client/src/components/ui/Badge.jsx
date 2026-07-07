import { cn } from '../../lib/utils';
import { getStatusTheme } from '../../lib/roleTheme';

const TONES = {
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    primary: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/30',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
};

const DOT_TONES = {
    neutral: 'bg-slate-500',
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
};

/** Generic labeled badge. Use `tone` for a fixed semantic color. */
export function Badge({ children, tone = 'neutral', icon: Icon, dot = false, className, ...props }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                TONES[tone],
                className
            )}
            {...props}
        >
            {dot && <span className={cn('size-1.5 rounded-full', DOT_TONES[tone])} />}
            {Icon && <Icon className="size-3.5" aria-hidden="true" />}
            {children}
        </span>
    );
}

/** Badge that auto-colors itself from a complaint/task status string. */
export function StatusBadge({ status, className }) {
    const theme = getStatusTheme(status);
    const label = status?.replace(/[_-]/g, ' ') ?? 'Unknown';
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize',
                'dark:border-white/10 dark:bg-white/5 dark:brightness-125',
                theme.text,
                theme.bg,
                theme.border,
                className
            )}
        >
            <span className={cn('size-1.5 rounded-full', theme.dot)} />
            {label}
        </span>
    );
}
