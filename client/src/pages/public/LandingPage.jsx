// src/pages/public/LandingPage.jsx
// Public marketing home page. Reuses the brand's hub-and-spoke signal motif
// (see favicon.svg / AuthVisualPanel) as the throughline instead of inventing
// a new visual language, since that's already Veyu's signature.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Activity,
    CloudLightning,
    Sparkles,
    Users,
    Radio,
    ShieldCheck,
    HardHat,
    Settings2,
    UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import { Logo } from '../../components/ui/Logo.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { getRoleTheme } from '../../lib/roleTheme.js';
import { cn } from '../../lib/utils';

// ── Hero signal diagram — same hub-and-spoke mark as the favicon / auth panel,
// scaled up as the page's opening thesis rather than a stock illustration ────
function SignalDiagram() {
    const nodes = [
        { x: 15, y: 20, delay: 0 },
        { x: 85, y: 12, delay: 0.4 },
        { x: 10, y: 75, delay: 0.9 },
        { x: 88, y: 70, delay: 1.3 },
        { x: 50, y: 92, delay: 1.7 },
    ];
    return (
        <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-[#05080f]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,_rgb(34_211_238_/_0.12),_transparent_60%)]" />
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                {nodes.map((n, i) => (
                    <line key={i} x1="50%" y1="50%" x2={`${n.x}%`} y2={`${n.y}%`} stroke="#22d3ee" strokeOpacity="0.3" strokeWidth="1.5" />
                ))}
            </svg>
            {nodes.map((n, i) => (
                <div key={i} className="absolute" style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <span className="relative flex size-3 items-center justify-center">
                        <span
                            className="veyu-pulse-ring absolute inset-0 rounded-full border-2"
                            style={{ borderColor: '#22d3ee', animationDelay: `${n.delay}s` }}
                        />
                        <span className="size-2.5 rounded-full bg-cyan-400" />
                    </span>
                </div>
            ))}
            <div className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_50px_10px_rgb(34_211_238_/_0.35)]">
                <Radio className="size-7 text-[#05080f]" strokeWidth={2.5} />
            </div>
        </div>
    );
}

const SUBSYSTEMS = [
    {
        icon: Activity,
        name: 'PulseGrid',
        tag: 'ward stress velocity',
        copy: 'Tracks how fast unresolved reports are piling up in every ward, so a slow-burning problem gets flagged before it turns into a flashpoint.',
    },
    {
        icon: CloudLightning,
        name: 'SilentSignal',
        tag: 'predictive forecasting',
        copy: 'Correlates complaint history with weather patterns to forecast where drainage, potholes, or outages are likely to spike next.',
    },
    {
        icon: Sparkles,
        name: 'FieldMesh',
        tag: 'Gemini-powered elevation',
        copy: "Reads a field worker's raw, on-the-ground observations and auto-elevates the ones that need an officer's attention — no extra form to fill.",
    },
];

const ROLES = [
    { role: 'citizen', icon: Users, headline: 'Report and track', copy: 'File a civic issue in a minute and follow it through to resolution.' },
    { role: 'officer', icon: ShieldCheck, headline: 'Triage the war room', copy: 'See every open complaint ranked by severity and cascade risk, ward by ward.' },
    { role: 'worker', icon: HardHat, headline: 'Work the field', copy: 'Get dispatched, log what you find, and close the loop from your phone.' },
    { role: 'admin', icon: Settings2, headline: 'Run the system', copy: 'Manage wards, staff, and access across the whole municipality.' },
];

const STACK = ['React', 'Vite', 'Tailwind v4', 'Node.js', 'Express', 'MongoDB', 'Google Gemini'];

function SectionEyebrow({ children }) {
    return (
        <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary-600 dark:text-cyan-400/80">
            <span className="size-1.5 rounded-full bg-primary-500 dark:bg-cyan-400" />
            {children}
        </p>
    );
}

export default function LandingPage() {
    const { isAuthenticated, user } = useAuth();
    const primaryHref = isAuthenticated ? getRoleHome(user?.role) : '/register';
    const primaryLabel = isAuthenticated ? 'Go to dashboard' : 'Get started';

    return (
        <div className="min-h-screen bg-white dark:bg-surface-dark-950 text-slate-900 dark:text-white">
            {/* ── Nav ─────────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-surface-dark-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Logo size="md" />
                    <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400 md:flex">
                        <a href="#product" className="transition-colors hover:text-slate-900 dark:hover:text-white">Product</a>
                        <a href="#teams" className="transition-colors hover:text-slate-900 dark:hover:text-white">For teams</a>
                        <a href="#developer" className="transition-colors hover:text-slate-900 dark:hover:text-white">Developer</a>
                        <Link to="/map" className="transition-colors hover:text-slate-900 dark:hover:text-white">Live map</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        {!isAuthenticated && (
                            <Link to="/login" className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white sm:inline">
                                Sign in
                            </Link>
                        )}
                        <Link
                            to={primaryHref}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                        >
                            {primaryLabel} <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero ────────────────────────────────────────────────────────── */}
            <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <SectionEyebrow>Live civic signal</SectionEyebrow>
                    <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                        See a ward's pulse<br />before it becomes a crisis.
                    </h1>
                    <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-500 dark:text-slate-400">
                        Veyu turns scattered citizen reports into one ward-by-ward signal — routing every pothole,
                        outage, and complaint from the person who filed it to the person who can fix it.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            to={primaryHref}
                            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                        >
                            {primaryLabel} <ArrowRight className="size-4" />
                        </Link>
                        <Link
                            to="/map"
                            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            View public map
                        </Link>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex justify-center"
                >
                    <SignalDiagram />
                </motion.div>
            </section>

            {/* ── Subsystems ──────────────────────────────────────────────────── */}
            <section id="product" className="border-t border-slate-200 dark:border-slate-800 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <SectionEyebrow>Three systems, one signal</SectionEyebrow>
                    <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Built to notice what a spreadsheet of complaints can't.
                    </h2>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {SUBSYSTEMS.map(({ icon: Icon, name, tag, copy }) => (
                            <div key={name} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10">
                                    <Icon className="size-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold">{name}</h3>
                                <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">{tag}</p>
                                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{copy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Roles ───────────────────────────────────────────────────────── */}
            <section id="teams" className="border-t border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-900/40 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <SectionEyebrow>Built for every role in the loop</SectionEyebrow>
                    <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
                        One platform, four jobs to do.
                    </h2>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {ROLES.map(({ role, icon: Icon, headline, copy }) => {
                            const theme = getRoleTheme(role);
                            return (
                                <div key={role} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                                    <div className={cn('flex size-10 items-center justify-center rounded-lg', theme.bg, 'dark:bg-white/5')}>
                                        <Icon className={cn('size-5', theme.text, theme.textDark)} />
                                    </div>
                                    <p className={cn('mt-4 text-xs font-bold uppercase tracking-wider', theme.text, theme.textDark)}>{theme.label}</p>
                                    <h3 className="mt-1 text-base font-bold">{headline}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{copy}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Developer ───────────────────────────────────────────────────── */}
            <section id="developer" className="border-t border-slate-200 dark:border-slate-800 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <SectionEyebrow>Built by</SectionEyebrow>
                    <div className="mt-6 flex flex-col gap-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:flex-row lg:items-center">
                        <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-cyan-500 text-2xl font-extrabold text-white">
                            AK
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-extrabold tracking-tight">Anmol Kumar</h3>
                            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                Full-stack developer · B.Tech Biotechnology, MNNIT Allahabad · B.S. Data Science &amp; Applications, IIT Madras
                            </p>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                Veyu is an independent build exploring what civic-issue management could look like at
                                municipal scale — designed and developed end-to-end, from the ward analytics in
                                PulseGrid down to the REST API underneath.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {STACK.map((tech) => (
                                    <span
                                        key={tech}
                                        className="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-2 lg:flex-col">
                            <a
                                href="https://github.com/anmolkumar875511"
                                aria-label="GitHub"
                                className="flex size-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            >
                                <svg
                                    className="size-4.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                    <path d="M9 18c-4.51 2-5-2-7-2" />
                                </svg>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/anmolkumar8755"
                                aria-label="LinkedIn"
                                className="flex size-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            >
                                <svg
                                    className="size-4.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                    <rect width="4" height="12" x="2" y="9" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>
                            <a
                                href="https://anmol-kumar-shaharwal.vercel.app"
                                aria-label="Portfolio"
                                className="flex size-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            >
                                <UserRound className="size-4.5" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Closing CTA ─────────────────────────────────────────────────── */}
            <section className="border-t border-slate-200 dark:border-slate-800 px-4 py-16 text-center sm:px-6 lg:px-8">
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ready to put your ward on the map?</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Create an account and file your first report in under a minute.
                </p>
                <Link
                    to={primaryHref}
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                >
                    {primaryLabel} <ArrowRight className="size-4" />
                </Link>
            </section>

            <Footer />
        </div>
    );
}
