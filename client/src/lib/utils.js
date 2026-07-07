import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Usage: cn('px-4 py-2', condition && 'bg-primary-600', className)
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
