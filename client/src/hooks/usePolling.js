// src/hooks/usePolling.js
// ─────────────────────────────────────────────────────────────────────────────
// Calls a fetch function on a set interval while the browser tab is visible.
// Pauses automatically when the tab is hidden — saves API quota on free tier.
//
// Usage:
//   usePolling(fetchComplaints, 30_000);           // poll every 30s
//   usePolling(fetchQueue, 30_000, hasData);       // pause until first load
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

/**
 * @param {() => void | Promise<void>} fetchFn  — function to call on each tick
 * @param {number}  intervalMs  — polling interval in ms (default 30s)
 * @param {boolean} [enabled=true] — set false to pause polling
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
            if (!document.hidden) {
                fetchRef.current();
            }
        }

        function handleVisibilityChange() {
            if (!document.hidden) {
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
