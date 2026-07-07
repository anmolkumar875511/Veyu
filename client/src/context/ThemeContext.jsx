// src/context/ThemeContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// App-wide dark / light theme. Persisted to localStorage, falls back to the
// user's OS preference on first visit, and applies the `dark` class to <html>
// so every Tailwind `dark:` utility across the app responds to it.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'veyu:theme';
const ThemeContext = createContext(null);

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme;
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    // Follow the OS setting until the user makes an explicit choice.
    useEffect(() => {
        if (window.localStorage.getItem(STORAGE_KEY)) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e) => setTheme(e.matches ? 'dark' : 'light');
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(
        () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
        [theme, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}
