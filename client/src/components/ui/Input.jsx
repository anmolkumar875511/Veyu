import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const fieldBase =
    'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-600';
const fieldOk =
    'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:hover:border-slate-600 dark:focus:border-primary-400 dark:focus:ring-primary-400/10';
const fieldError =
    'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-700 dark:focus:border-rose-500 dark:focus:ring-rose-500/10';

/** Wraps any field with a label + helper/error text, consistent spacing. */
export function Field({ label, htmlFor, required, error, hint, className, children }) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            {label && (
                <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {label}
                    {required && <span className="ml-0.5 text-rose-500 dark:text-rose-400">*</span>}
                </label>
            )}
            {children}
            {error ? (
                <p className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="size-3.5" aria-hidden="true" />
                    {error}
                </p>
            ) : (
                hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
            )}
        </div>
    );
}

export const Input = forwardRef(({ className, error, icon: Icon, ...props }, ref) => (
    <div className="relative">
        {Icon && (
            <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        )}
        <input
            ref={ref}
            className={cn(fieldBase, error ? fieldError : fieldOk, Icon && 'pl-10', className)}
            {...props}
        />
    </div>
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className, error, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, error ? fieldError : fieldOk, 'resize-y', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className, error, children, ...props }, ref) => (
    <select
        ref={ref}
        className={cn(fieldBase, error ? fieldError : fieldOk, 'appearance-none bg-no-repeat pr-9', className)}
        {...props}
    >
        {children}
    </select>
));
Select.displayName = 'Select';
