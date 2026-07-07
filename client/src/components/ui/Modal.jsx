import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export default function Modal({ open, onClose, title, description, size = 'md', children, footer }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        role="dialog"
                        aria-modal="true"
                        className={cn(
                            'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-[var(--shadow-popover)]',
                            'dark:bg-slate-900 dark:shadow-[var(--shadow-popover-dark)] dark:ring-1 dark:ring-white/10',
                            SIZES[size]
                        )}
                    >
                        {(title || onClose) && (
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
                                    {title && <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>}
                                    {description && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                                    )}
                                </div>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        aria-label="Close dialog"
                                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                    >
                                        <X className="size-5" />
                                    </button>
                                )}
                            </div>
                        )}
                        {children}
                        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
