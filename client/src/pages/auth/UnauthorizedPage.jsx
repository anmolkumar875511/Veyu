// src/pages/auth/UnauthorizedPage.jsx

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import { AuthPage, PrimaryButton, SecondaryButton, RoleChip } from '../../components/AuthShell.jsx';
import { getRoleTheme } from '../../lib/roleTheme';

export default function UnauthorizedPage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const role = user?.role ?? 'citizen';
    const roleTheme = getRoleTheme(role);
    const homeRoute = isAuthenticated ? getRoleHome(role) : '/login';

    return (
        <AuthPage>
            {/* Ambient danger glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed left-1/2 top-[10%] -z-10 h-96 w-[40rem] -translate-x-1/2 bg-[radial-gradient(ellipse,_rgb(244_63_94_/_0.12),_transparent_65%)]"
            />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-12 text-center shadow-[var(--shadow-popover)] sm:px-10"
            >
                {/* 403 status row */}
                <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold tracking-widest text-rose-600">403</span>
                    <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">Forbidden</span>
                </div>

                {/* Icon */}
                <div className="flex size-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
                    <ShieldAlert className="size-8 text-rose-500" aria-hidden="true" />
                </div>

                {/* Heading */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Access Denied</h1>
                    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">You don&apos;t have permission to view this page.</p>
                </div>

                {/* User badge */}
                {isAuthenticated && user && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-4 py-1.5 text-xs">
                        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129_/_0.15)]" />
                        <span className="text-slate-500 dark:text-slate-400">
                            Signed in as <strong className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</strong>
                            {' · '}
                            <RoleChip label={roleTheme.label} accentColor="#4f46e5" />
                        </span>
                    </div>
                )}

                {/* Explanation */}
                <p className="max-w-xs text-sm leading-relaxed text-slate-400 dark:text-slate-500">
                    This section is restricted to a different role. If you believe this is a mistake, contact your
                    administrator.
                </p>

                {/* Actions */}
                <div className="flex w-full flex-col gap-3">
                    <PrimaryButton onClick={() => navigate(homeRoute, { replace: true })}>
                        Take me home
                    </PrimaryButton>
                    <SecondaryButton onClick={() => navigate(-1)}>Go back</SecondaryButton>
                </div>

                {/* Brand footer */}
                <div className="flex items-center gap-2 opacity-60">
                    <span className="size-1.5 rounded-full bg-primary-500" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Veyu</span>
                </div>
            </motion.div>
        </AuthPage>
    );
}
