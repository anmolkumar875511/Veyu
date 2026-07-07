import { motion } from 'framer-motion';
import { Loader2, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Spinner({ className, size = 'md', label = 'Loading' }) {
    const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-9' };
    return (
        <div className="flex items-center justify-center" role="status" aria-label={label}>
            <Loader2 className={cn('animate-spin text-primary-500 dark:text-primary-400', sizes[size], className)} />
            <span className="sr-only">{label}</span>
        </div>
    );
}

export function FullPageSpinner({ label = 'Loading…' }) {
    return (
        <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
            <Spinner size="lg" />
            <p className="text-sm">{label}</p>
        </div>
    );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center',
                'dark:border-slate-700 dark:bg-slate-900/50',
                className
            )}
        >
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Icon className="size-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            </div>
            <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
                {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            {action}
        </motion.div>
    );
}

export function PageHeader({ title, description, icon: Icon, actions, className }) {
    return (
        <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                        <Icon className="size-5" aria-hidden="true" />
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                        {title}
                    </h1>
                    {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                </div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Avatar({ name, src, size = 'md', className }) {
    const sizes = { sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-12 text-base' };
    const initials = name
        ?.split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    if (src) {
        return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />;
    }
    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700',
                'dark:bg-primary-500/15 dark:text-primary-300',
                sizes[size],
                className
            )}
        >
            {initials || '?'}
        </div>
    );
}

export function StatCard({ label, value, icon: Icon, trend, tone = 'primary', className }) {
    const tones = {
        primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
        success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        danger: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
        neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className={cn(
                'rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow',
                'hover:shadow-[var(--shadow-card-hover)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[var(--shadow-card-dark)] dark:hover:shadow-[var(--shadow-card-hover-dark)]',
                className
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                {Icon && (
                    <div className={cn('flex size-9 items-center justify-center rounded-lg', tones[tone])}>
                        <Icon className="size-4.5" aria-hidden="true" />
                    </div>
                )}
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
            {trend && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{trend}</p>}
        </motion.div>
    );
}
