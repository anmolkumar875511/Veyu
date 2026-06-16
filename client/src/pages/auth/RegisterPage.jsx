// ─────────────────────────────────────────────────────────────────────────────
// src/pages/auth/RegisterPage.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRoleHome } from "../../guards/RouteGuards.jsx";

const INITIAL_FORM = { name: "", email: "", password: "", phone: "" };

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]               = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});

  function handleChange(e) {
    if (error) clearError();
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear individual field error on edit
    if (fieldErrors[name]) {
      setFieldErrors((fe) => { const n = { ...fe }; delete n[name]; return n; });
    }
  }

  function validateClient() {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Enter your full name (at least 2 characters).";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.password || form.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
      errs.phone = "Enter a valid 10-digit Indian mobile number.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    const payload = { name: form.name.trim(), email: form.email, password: form.password };
    if (form.phone) payload.phone = form.phone;

    const result = await register(payload);
    if (result.success) {
      navigate(getRoleHome("citizen"), { replace: true });
    }
  }

  function fieldStyle(name) {
    return {
      ...styles.input,
      borderColor: fieldErrors[name] ? "#ef4444" : "#334155",
    };
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandDot} />
          <span style={styles.brandName}>Nagarik</span>
        </div>

        <h1 style={styles.heading}>Join your city</h1>
        <p style={styles.subheading}>Report issues. Track resolution. Build accountability.</p>

        {error && (
          <div style={styles.errorBanner} role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="name">Full name</label>
            <input
              id="name" name="name" type="text" autoComplete="name"
              value={form.name} onChange={handleChange}
              style={fieldStyle("name")} placeholder="Anmol Kumar"
            />
            {fieldErrors.name && <span style={styles.fieldError}>{fieldErrors.name}</span>}
          </div>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">Email address</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              style={fieldStyle("email")} placeholder="you@example.com"
            />
            {fieldErrors.email && <span style={styles.fieldError}>{fieldErrors.email}</span>}
          </div>

          {/* Phone (optional) */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="phone">
              Mobile number <span style={styles.optional}>(optional)</span>
            </label>
            <input
              id="phone" name="phone" type="tel" autoComplete="tel"
              value={form.phone} onChange={handleChange}
              style={fieldStyle("phone")} placeholder="9876543210"
            />
            {fieldErrors.phone && <span style={styles.fieldError}>{fieldErrors.phone}</span>}
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <div style={styles.passwordWrapper}>
              <input
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password} onChange={handleChange}
                style={{ ...fieldStyle("password"), paddingRight: "2.75rem" }}
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={styles.showPasswordBtn}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {fieldErrors.password && <span style={styles.fieldError}>{fieldErrors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ ...styles.submitBtn, opacity: isLoading ? 0.65 : 1 }}
          >
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={styles.terms}>
          By registering you agree to Nagarik&apos;s community guidelines.
        </p>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#0f172a", padding: "1rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    background: "#1e293b", border: "1px solid #334155",
    borderRadius: "1rem", padding: "2.5rem",
    width: "100%", maxWidth: "420px",
  },
  brand: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" },
  brandDot: {
    width: "0.6rem", height: "0.6rem", borderRadius: "50%",
    background: "#22d3ee", display: "inline-block", boxShadow: "0 0 8px #22d3ee88",
  },
  brandName: {
    fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0",
    letterSpacing: "0.08em", textTransform: "uppercase",
  },
  heading: { fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.4rem 0" },
  subheading: { fontSize: "0.875rem", color: "#94a3b8", margin: "0 0 1.75rem 0" },
  errorBanner: {
    background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "0.5rem",
    color: "#fca5a5", fontSize: "0.85rem", padding: "0.75rem 1rem", marginBottom: "1.25rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.8rem", fontWeight: 500, color: "#94a3b8" },
  optional: { fontWeight: 400, color: "#475569" },
  input: {
    background: "#0f172a", border: "1px solid #334155", borderRadius: "0.5rem",
    color: "#f1f5f9", fontSize: "0.9rem", padding: "0.65rem 0.875rem",
    outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s",
  },
  fieldError: { fontSize: "0.75rem", color: "#f87171" },
  passwordWrapper: { position: "relative" },
  showPasswordBtn: {
    position: "absolute", right: "0.75rem", top: "50%",
    transform: "translateY(-50%)", background: "none", border: "none",
    color: "#64748b", fontSize: "0.75rem", cursor: "pointer", padding: "0.25rem",
  },
  submitBtn: {
    background: "#22d3ee", border: "none", borderRadius: "0.5rem",
    color: "#0f172a", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700,
    padding: "0.75rem", marginTop: "0.5rem", letterSpacing: "0.02em",
    transition: "opacity 0.15s",
  },
  terms: { fontSize: "0.72rem", color: "#475569", textAlign: "center", marginTop: "1rem" },
  footer: { fontSize: "0.8rem", color: "#64748b", textAlign: "center", marginTop: "0.75rem" },
  link: { color: "#22d3ee", textDecoration: "none", fontWeight: 500 },
};