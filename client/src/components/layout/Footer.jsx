// src/components/layout/Footer.jsx
// One footer, used at the bottom of every page's content column so the app
// stops feeling like it "just ends" after the last card.

import { Logo } from '../ui/Logo.jsx';

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
                <Logo size="sm" withText />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    © {new Date().getFullYear()} Veyu · Civic infrastructure, made accountable.
                </p>
            </div>
        </footer>
    );
}

export default Footer;
