// src/components/AuthShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives for auth pages (Login, Register, Unauthorized, etc.)
// Styled entirely with Tailwind utility classes; motion via Framer Motion.
// Public API (component names + props) is unchanged so page files stay stable.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, EyeOff, Loader2, ShieldCheck, Radio, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './ui/Logo.jsx';

// ── Page wrapper (simple centered card — used by Unauthorized, Google redirect) ─
export function AuthPage({ children }) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-surface-50 dark:bg-slate-950 px-4 py-10 sm:px-6">
            {/* Subtle backdrop accent */}
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--color-primary-50),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgb(99_102_241_/_0.08),_transparent_55%)]" />
            {children}
        </div>
    );
}

// ── Split shell (Login / Register) ──────────────────────────────────────────────
// Left: the form, in a plain scrollable column (no boxed card — one fewer
// container than the old centered-card layout). Right: the signature signal
// panel, hidden below lg so mobile stays a clean single column.
export function AuthSplitShell({ children }) {
    return (
        <div className="grid min-h-screen w-full bg-white dark:bg-surface-dark-950 lg:grid-cols-2">
            <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
                <div className="w-full max-w-[27rem]">{children}</div>
            </div>
            <AuthVisualPanel />
        </div>
    );
}

// ── Signature visual: the Veyu signal network, rendered large ───────────────────
// Echoes the favicon's own hub-and-spoke mark (see public/favicon.svg) rather
// than a generic stock illustration — four ward "signals" pulsing into one
// resolution hub, which is literally what the product does.
const FEED_ITEMS = [
    { ward: 'Ward 14', label: 'Pothole reported', tone: 'text-orange-300' },
    { ward: 'Ward 07', label: 'Streetlight resolved', tone: 'text-emerald-300' },
    { ward: 'Ward 22', label: 'Drainage escalated', tone: 'text-rose-300' },
    { ward: 'Ward 03', label: 'Crew dispatched', tone: 'text-sky-300' },
];

function SignalNode({ x, y, delay, color }) {
    return (
        <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
            <div className="relative flex size-3 items-center justify-center">
                <span
                    className="veyu-pulse-ring absolute inset-0 rounded-full border-2"
                    style={{ borderColor: color, animationDelay: `${delay}s` }}
                />
                <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
        </div>
    );
}

export function AuthVisualPanel() {
    const nodes = [
        { x: 18, y: 22, delay: 0 },
        { x: 82, y: 16, delay: 0.5 },
        { x: 16, y: 78, delay: 1.1 },
        { x: 80, y: 82, delay: 1.6 },
    ];
    return (
        <div className="relative hidden overflow-hidden bg-[#05080f] lg:flex lg:flex-col lg:justify-between">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,_rgb(34_211_238_/_0.10),_transparent_60%)]" />

            {/* Network diagram */}
            <div className="relative flex-1">
                <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    {nodes.map((n, i) => (
                        <line
                            key={i}
                            x1="50%"
                            y1="50%"
                            x2={`${n.x}%`}
                            y2={`${n.y}%`}
                            stroke="#22d3ee"
                            strokeOpacity="0.25"
                            strokeWidth="1.5"
                        />
                    ))}
                </svg>
                {nodes.map((n, i) => (
                    <SignalNode key={i} x={n.x} y={n.y} delay={n.delay} color="#22d3ee" />
                ))}
                {/* Hub */}
                <div className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#22d3ee] shadow-[0_0_40px_8px_rgb(34_211_238_/_0.35)]">
                    <Radio className="size-6 text-[#05080f]" strokeWidth={2.5} />
                </div>

                {/* Headline, anchored beneath the diagram */}
                <div className="absolute inset-x-0 bottom-0 px-10 pb-10 pt-24 bg-gradient-to-t from-[#05080f] via-[#05080f]/95 to-transparent">
                    <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-400/80">
                        <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" /> Live civic signal
                    </p>
                    <h2 className="max-w-sm text-3xl font-extrabold leading-tight tracking-tight text-white">
                        Every report, routed to resolution.
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                        Veyu turns scattered citizen reports into a single ward-by-ward signal — so nothing that
                        matters gets lost in the queue.
                    </p>
                </div>
            </div>

            {/* Live feed strip */}
            <div className="relative flex flex-col gap-2.5 border-t border-white/10 bg-black/20 px-10 py-6">
                {FEED_ITEMS.map((item, i) => (
                    <motion.div
                        key={item.ward}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 * i, duration: 0.4 }}
                        className="flex items-center gap-3 font-mono text-xs text-slate-400"
                    >
                        <span className="w-14 shrink-0 text-slate-500">{item.ward}</span>
                        <span className={cn('flex-1 truncate', item.tone)}>{item.label}</span>
                        <TrendingUp className="size-3 shrink-0 text-slate-600" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ── Trust strip (small credibility row under the form) ──────────────────────────
export function TrustStrip() {
    return (
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <ShieldCheck className="size-3.5 shrink-0" />
            Your reports are tied to your account and visible to your ward office only.
        </div>
    );
}

// ── Card (still used by the simple centered AuthPage layout) ────────────────────
export function AuthCard({ children, maxWidth = '26rem' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth }}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-[var(--shadow-popover)] sm:p-9"
        >
            {children}
        </motion.div>
    );
}

// ── Brand mark ────────────────────────────────────────────────────────────────
export function BrandMark({ name }) {
    return (
        <div className="mb-8">
            <Logo size="md" withText animated={false} />
            {name && <span className="sr-only">{name}</span>}
        </div>
    );
}

// ── Shared Google "G" glyph (Login + Register both need it) ─────────────────────
export function GoogleIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.12 17.64 11.84 17.64 9.2z"
                fill="#4285F4"
            />
            <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
            />
            <path
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
            />
            <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
            />
        </svg>
    );
}

// ── Google button (shared styling) ───────────────────────────────────────────────
export function GoogleButton({ children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
        >
            <GoogleIcon />
            {children}
        </button>
    );
}

// ── Heading block ─────────────────────────────────────────────────────────────
export function AuthHeading({ title, subtitle }) {
    return (
        <div className="mb-7">
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
    );
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            aria-live="polite"
            className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
        >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {message}
        </motion.div>
    );
}

// ── Form field (label + input slot + optional error) ──────────────────────────
export function FormField({ label, htmlFor, error, optional, labelRight, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={htmlFor}>
                    {label}
                    {optional && <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">(optional)</span>}
                </label>
                {labelRight}
            </div>
            {children}
            {error && (
                <span role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                    {error}
                </span>
            )}
        </div>
    );
}

const inputClasses =
    'w-full rounded-lg border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-150 focus:ring-4 focus:ring-primary-500/10';

// ── Plain text input ──────────────────────────────────────────────────────────
export function TextInput({ hasError, className, ...props }) {
    return (
        <input
            className={cn(
                inputClasses,
                hasError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500',
                className
            )}
            {...props}
        />
    );
}

// ── Password input with show/hide toggle ──────────────────────────────────────
export function PasswordInput({ hasError, ...props }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                type={visible ? 'text' : 'password'}
                className={cn(
                    inputClasses,
                    'pr-11',
                    hasError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500'
                )}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            >
                {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
        </div>
    );
}

// ── Primary CTA button ────────────────────────────────────────────────────────
export function PrimaryButton({ loading, loadingText, children, disabled, className, ...rest }) {
    const isDisabled = loading || disabled;
    return (
        <motion.button
            type="submit"
            disabled={isDisabled}
            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
            className={cn(
                'flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300',
                className
            )}
            {...rest}
        >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? (loadingText ?? 'Loading…') : children}
        </motion.button>
    );
}

// ── Ghost / secondary button ──────────────────────────────────────────────────
export function SecondaryButton({ children, className, ...rest }) {
    return (
        <button
            type="button"
            className={cn(
                'flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600',
                className
            )}
            {...rest}
        >
            {children}
        </button>
    );
}

// ── Full-screen loading state (used by RouteGuards) ───────────────────────────
export function FullscreenLoader({ message = 'Loading…' }) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-surface-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500">
            <Loader2 className="size-7 animate-spin text-primary-500" aria-hidden="true" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

// ── Horizontal rule with optional label ──────────────────────────────────────
export function Divider({ label }) {
    return (
        <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            {label && <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">{label}</span>}
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>
    );
}

// ── Role chip (inline badge for role label + color) ───────────────────────────
export function RoleChip({ label, accentColor }) {
    return (
        <span className="font-medium" style={{ color: accentColor ?? '#4f46e5' }}>
            {label}
        </span>
    );
}
