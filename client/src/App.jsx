// ─────────────────────────────────────────────────────────────────────────────
// src/App.jsx
//
// Global UI shell — lives inside all providers, wraps all page content.
//
// Responsibilities:
//   - Toast notification system (listens to "nagarik:notification" DOM events
//     fired by useNotifications hook — works without prop drilling)
//   - Scroll-to-top on every route change
//   - Global keyboard shortcut handler (Escape closes modals etc.)
//   - Renders <Outlet /> for the route tree
//
// What App.jsx is NOT:
//   - It doesn't own any routes (that's AppRouter.jsx)
//   - It doesn't own any providers (that's AppRouter.jsx)
//   - It doesn't fetch any data (that's each page's responsibility)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";

// ── Toast types → style map ───────────────────────────────────────────────────
const TOAST_STYLES = {
  complaint_verified:    { icon: "✓",  accent: "#22c55e" },
  complaint_assigned:    { icon: "→",  accent: "#3b82f6" },
  complaint_in_progress: { icon: "⚙", accent: "#f59e0b" },
  complaint_resolved:    { icon: "✓",  accent: "#22c55e" },
  complaint_rejected:    { icon: "✗",  accent: "#ef4444" },
  stress_band_elevated:  { icon: "⚠",  accent: "#f97316" },
  silent_signal_alert:   { icon: "◉",  accent: "#a78bfa" },
  cascade_risk_flagged:  { icon: "⚡", accent: "#f59e0b" },
  task_assigned:         { icon: "📋", accent: "#3b82f6" },
  field_points_awarded:  { icon: "★",  accent: "#eab308" },
  default:               { icon: "ℹ",  accent: "#22d3ee" },
};

const TOAST_DURATION = 4500; // ms

// ── Toast item component ──────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  const { icon, accent } = TOAST_STYLES[toast.type] ?? TOAST_STYLES.default;

  function dismiss() {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        ...styles.toast,
        borderLeftColor: accent,
        animation: exiting ? "toast-out 0.3s ease forwards" : "toast-in 0.3s ease",
      }}
    >
      <span style={{ ...styles.toastIcon, color: accent }}>{icon}</span>
      <div style={styles.toastBody}>
        <p style={styles.toastTitle}>{toast.title}</p>
        {toast.message && (
          <p style={styles.toastMessage}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        style={styles.toastClose}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ── ToastContainer ────────────────────────────────────────────────────────────
function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  // Listen for notifications dispatched by useNotifications hook
  useEffect(() => {
    function handleNotification(e) {
      const notification = e.detail;
      if (!notification) return;

      setToasts((prev) => {
        // Deduplicate — don't show the same notification twice
        if (prev.some((t) => t.id === notification.id)) return prev;
        return [...prev, notification].slice(-5); // max 5 toasts at once
      });
    }

    window.addEventListener("nagarik:notification", handleNotification);
    return () => window.removeEventListener("nagarik:notification", handleNotification);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={styles.toastContainer} aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

// ── ScrollToTop ───────────────────────────────────────────────────────────────
// Scrolls to top on every route change — standard SPA behavior.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      {/* Scroll restoration on route change */}
      <ScrollToTop />

      {/* Page content — rendered by the router's <Outlet /> */}
      <Outlet />

      {/* Global toast overlay — portal-style, always on top */}
      <ToastContainer />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  toastContainer: {
    position: "fixed",
    top: "1.25rem",
    right: "1.25rem",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
    pointerEvents: "none",       // let clicks pass through the container gap
    maxWidth: "360px",
    width: "calc(100vw - 2.5rem)",
  },
  toast: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    background: "#1e293b",
    border: "1px solid #334155",
    borderLeft: "3px solid transparent", // accent color set per-toast
    borderRadius: "0.625rem",
    padding: "0.875rem 1rem",
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.5)",
    pointerEvents: "all",        // re-enable clicks on the toast itself
    cursor: "default",
  },
  toastIcon: {
    fontSize: "1rem",
    lineHeight: 1.5,
    flexShrink: 0,
    marginTop: "0.05rem",
  },
  toastBody: {
    flex: 1,
    minWidth: 0,
  },
  toastTitle: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#f1f5f9",
    lineHeight: 1.4,
    margin: 0,
  },
  toastMessage: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    lineHeight: 1.4,
    marginTop: "0.2rem",
  },
  toastClose: {
    background: "none",
    border: "none",
    color: "#475569",
    fontSize: "1.1rem",
    lineHeight: 1,
    padding: "0",
    flexShrink: 0,
    cursor: "pointer",
    transition: "color 0.15s",
  },
};