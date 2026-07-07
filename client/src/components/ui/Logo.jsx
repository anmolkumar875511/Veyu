// src/components/ui/Logo.jsx
// Single source of truth for the Veyu brand mark. Every nav / sidebar / auth
// screen renders the same favicon.svg mark so the brand never drifts.

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

const SIZES = {
    sm: { mark: 'size-6', text: 'text-sm', gap: 'gap-2' },
    md: { mark: 'size-8', text: 'text-base', gap: 'gap-2.5' },
    lg: { mark: 'size-11', text: 'text-xl', gap: 'gap-3' },
};

export function Logo({ size = 'md', withText = true, to, sub, className, animated = true }) {
    const dims = SIZES[size] ?? SIZES.md;

    const content = (
        <span className={cn('inline-flex items-center', dims.gap, className)}>
            <motion.img
                src="/favicon.svg"
                alt="Veyu"
                className={cn(dims.mark, 'shrink-0 rounded-full shadow-[0_0_0_1px_rgb(15_23_42_/_0.06)] dark:shadow-[0_0_0_1px_rgb(255_255_255_/_0.08)]')}
                whileHover={animated ? { scale: 1.08, rotate: 8 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            />
            {withText && (
                <span className="flex items-baseline gap-2">
                    <span className={cn('font-extrabold uppercase tracking-widest text-slate-900 dark:text-white', dims.text)}>
                        Veyu
                    </span>
                    {sub && (
                        <>
                            <span className="hidden text-slate-300 dark:text-slate-600 sm:inline">·</span>
                            <span className="hidden text-sm font-medium text-slate-400 dark:text-slate-500 sm:inline">
                                {sub}
                            </span>
                        </>
                    )}
                </span>
            )}
        </span>
    );

    if (to) {
        return (
            <Link to={to} className="transition-opacity hover:opacity-80">
                {content}
            </Link>
        );
    }
    return content;
}

export default Logo;
