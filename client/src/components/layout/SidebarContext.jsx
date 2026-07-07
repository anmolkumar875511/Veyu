// src/components/layout/SidebarContext.jsx
// Shared state for the app sidebar: whether the mobile drawer is open, and
// whether the desktop rail is collapsed to icons-only. Kept in one place so
// the hamburger button (in the topbar) and the sidebar itself (rendered by
// PageShell) can stay in sync without prop-drilling through every page.

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const SidebarContext = createContext(null);
const COLLAPSE_KEY = 'veyu:sidebar-collapsed';

export function SidebarProvider({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

    useEffect(() => {
        localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    }, [collapsed]);

    const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
    const closeMobile = useCallback(() => setMobileOpen(false), []);
    const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);

    const value = useMemo(
        () => ({ mobileOpen, toggleMobile, closeMobile, collapsed, toggleCollapsed }),
        [mobileOpen, toggleMobile, closeMobile, collapsed, toggleCollapsed]
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
    return ctx;
}
