// src/components/layout/SidebarToggle.jsx
// Hamburger button that opens the mobile sidebar drawer. Rendered inside
// every role's NavBar automatically — pages never need to add it themselves.

import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext.jsx';

export function SidebarToggle() {
    const { toggleMobile } = useSidebar();
    return (
        <button
            onClick={toggleMobile}
            aria-label="Open navigation menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
        >
            <Menu className="size-5" />
        </button>
    );
}

export default SidebarToggle;
