// src/components/ui/ThemeToggle.jsx
// Compact light/dark switch. Drop it anywhere — it reads/writes the shared
// ThemeContext, so every instance across the app stays in sync.

import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { cn } from '../../lib/utils';

export function ThemeToggle({ className }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-surface-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white',
                className
            )}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={isDark ? 'moon' : 'sun'}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex items-center justify-center"
                >
                    {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
                </motion.span>
            </AnimatePresence>
        </button>
    );
}

export default ThemeToggle;
