// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePolling.js
//
// Calls a fetch function on a set interval while the browser tab is visible.
// Pauses automatically when the tab is hidden (saves API calls on free tier).
//
// Usage:
//   usePolling(fetchComplaints, 30_000);   // re-fetch every 30s while tab active
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

/**
 * @param {() => void | Promise<void>} fetchFn  — the function to call on each tick
 * @param {number}                     intervalMs — polling interval in ms (default 30s)
 * @param {boolean}                    [enabled=true] — set false to pause polling
 */
export function usePolling(fetchFn, intervalMs = 30_000, enabled = true) {
    const fetchRef = useRef(fetchFn);

    // Always call the latest version of fetchFn without re-registering the interval
    useEffect(() => {
        fetchRef.current = fetchFn;
    });

    useEffect(() => {
        if (!enabled) return;

        let timerId = null;

        function tick() {
            // Only poll when tab is visible — saves quota on free hosting
            if (!document.hidden) {
                fetchRef.current();
            }
        }

        function handleVisibilityChange() {
            if (!document.hidden) {
                // Tab became visible — poll immediately then resume interval
                tick();
            }
        }

        timerId = setInterval(tick, intervalMs);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(timerId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [intervalMs, enabled]);
}
