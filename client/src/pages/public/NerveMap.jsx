// ─────────────────────────────────────────────────────────────────────────────
// src/pages/public/NerveMap.jsx
//
// Public, no-login city health view. Two parts:
//   1. PulseGrid — live ward stress bands (velocity-based, not raw count)
//   2. Ward health leaderboard — public accountability ranking
//
// Polls every 60s. Designed to be the link people share — "look at our city".
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { usePolling } from "../../hooks/usePolling.js";
import { getPulseGridSnapshotApi, getWardLeaderboardApi } from "../../api/ward.api.js";
import { STRESS_BAND_META } from "../../constants/complaint.constants.js";

function StressTile({ ward }) {
  const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
  return (
    <div style={{ ...s.tile, borderColor: `${meta.color}44` }}>
      <div style={s.tileHeader}>
        <span style={s.tileWardNum}>Ward {ward.wardNumber}</span>
        <span style={{ ...s.tileBand, color: meta.color, background: `${meta.color}1a` }}>
          {meta.label}
        </span>
      </div>
      <span style={s.tileName}>{ward.name}</span>
      <div style={s.tileMetrics}>
        <div style={s.tileMetric}>
          <span style={s.tileMetricValue}>{ward.pulseVelocity?.toFixed(1)}×</span>
          <span style={s.tileMetricLabel}>velocity</span>
        </div>
        <div style={s.tileMetric}>
          <span style={s.tileMetricValue}>{ward.complaintsLast48h}</span>
          <span style={s.tileMetricLabel}>last 48h</span>
        </div>
        <div style={s.tileMetric}>
          <span style={s.tileMetricValue}>{ward.healthScore}</span>
          <span style={s.tileMetricLabel}>health</span>
        </div>
      </div>
      {/* Velocity bar — visual representation of the stress band */}
      <div style={s.velocityTrack}>
        <div
          style={{
            ...s.velocityFill,
            width: `${Math.min((ward.pulseVelocity ?? 1) * 25, 100)}%`,
            background: meta.color,
          }}
        />
      </div>
    </div>
  );
}

function LeaderboardRow({ ward, isTop }) {
  const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
  return (
    <div style={{ ...s.leaderRow, background: isTop ? "#22c55e08" : "transparent" }}>
      <span style={{ ...s.leaderRank, color: isTop ? "#22c55e" : "#475569" }}>
        #{ward.rank}
      </span>
      <div style={s.leaderInfo}>
        <span style={s.leaderName}>{ward.name}</span>
        <span style={s.leaderWard}>Ward {ward.wardNumber}</span>
      </div>
      <div style={s.leaderStats}>
        <span style={s.leaderResolved}>{ward.stats?.resolutionRate ?? 0}% resolved</span>
        <span style={s.leaderTime}>
          {ward.stats?.avgResolutionHours ? `${ward.stats.avgResolutionHours}h avg` : "—"}
        </span>
      </div>
      <div style={s.leaderScoreWrap}>
        <span style={s.leaderScore}>{ward.healthScore}</span>
        <span style={{ ...s.leaderBandDot, background: meta.color }} />
      </div>
    </div>
  );
}

export default function PublicNerveMap() {
  const { isAuthenticated, user } = useAuth();

  const [pulseWards, setPulseWards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [pulse, board] = await Promise.all([
        getPulseGridSnapshotApi(),
        getWardLeaderboardApi(),
      ]);
      setPulseWards(pulse.wards ?? []);
      setLeaderboard(board.wards ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Could not load city data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);
  usePolling(fetchAll, 60_000, true);

  const emergencyCount = pulseWards.filter((w) => w.stressBand === "emergency").length;
  const criticalCount  = pulseWards.filter((w) => w.stressBand === "critical").length;

  return (
    <div style={s.page}>
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.brandDot} />
          <span style={s.brandName}>Nagarik</span>
        </div>
        <div style={s.navRight}>
          {isAuthenticated ? (
            <Link to={user?.role === "citizen" ? "/dashboard" : "/war-room"} style={s.navLink}>
              Go to dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" style={s.navLink}>Sign in</Link>
              <Link to="/register" style={s.navCta}>Get started</Link>
            </>
          )}
        </div>
      </header>

      <main style={s.main}>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section style={s.hero}>
          <h1 style={s.heroHeading}>City Pulse</h1>
          <p style={s.heroSub}>
            Live infrastructure health across every ward — updated automatically.
          </p>
          {lastUpdated && (
            <span style={s.lastUpdated}>
              Last updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </section>

        {error && <div style={s.errorBanner}>{error}</div>}

        {/* ── Alert banner if any ward is critical/emergency ──────────────── */}
        {!loading && (emergencyCount > 0 || criticalCount > 0) && (
          <div style={s.alertBanner}>
            ⚡ {emergencyCount > 0 && `${emergencyCount} ward${emergencyCount !== 1 ? "s" : ""} in emergency`}
            {emergencyCount > 0 && criticalCount > 0 && " · "}
            {criticalCount > 0 && `${criticalCount} ward${criticalCount !== 1 ? "s" : ""} critical`}
          </div>
        )}

        {/* ── PulseGrid ─────────────────────────────────────────────────── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>PulseGrid — Live Stress Map</h2>
          <p style={s.sectionSub}>
            Velocity, not volume — a ward where complaints are accelerating ranks above one with more complaints filed slowly.
          </p>

          {loading ? (
            <div style={s.tileGrid}>
              {[0,1,2,3,4,5].map((i) => <div key={i} style={s.tileSkeleton} />)}
            </div>
          ) : (
            <div style={s.tileGrid}>
              {pulseWards.map((w) => <StressTile key={w._id ?? w.wardNumber} ward={w} />)}
            </div>
          )}

          {/* Legend */}
          <div style={s.legend}>
            {Object.entries(STRESS_BAND_META).map(([key, m]) => (
              <span key={key} style={s.legendItem}>
                <span style={{ ...s.legendDot, background: m.color }} />
                {m.label}
              </span>
            ))}
          </div>
        </section>

        {/* ── Leaderboard ───────────────────────────────────────────────── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Ward Accountability Leaderboard</h2>
          <p style={s.sectionSub}>Ranked by health score — resolution rate, speed, and backlog.</p>

          {loading ? (
            <div style={s.leaderList}>
              {[0,1,2,3].map((i) => <div key={i} style={s.leaderSkeleton} />)}
            </div>
          ) : (
            <div style={s.leaderList}>
              {leaderboard.map((w) => (
                <LeaderboardRow key={w._id ?? w.wardNumber} ward={w} isTop={w.rank === 1} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", color: "#f8fafc" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "56px", background: "#0f172a", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, zIndex: 10 },
  navBrand: { display: "flex", alignItems: "center", gap: "0.5rem" },
  brandDot: { width: "0.55rem", height: "0.55rem", borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 8px #22d3ee88" },
  brandName: { fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.08em", textTransform: "uppercase" },
  navRight: { display: "flex", alignItems: "center", gap: "1rem" },
  navLink: { fontSize: "0.82rem", color: "#94a3b8", textDecoration: "none" },
  navCta: { fontSize: "0.82rem", color: "#0f172a", background: "#22d3ee", fontWeight: 700, padding: "0.45rem 1rem", borderRadius: "0.5rem", textDecoration: "none" },

  main: { maxWidth: "920px", margin: "0 auto", padding: "2.5rem 1.5rem 4rem", display: "flex", flexDirection: "column", gap: "2.5rem" },
  hero: { textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" },
  heroHeading: { fontSize: "2rem", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.03em" },
  heroSub: { fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "420px" },
  lastUpdated: { fontSize: "0.72rem", color: "#334155" },

  errorBanner: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "0.5rem", color: "#fca5a5", fontSize: "0.84rem", padding: "0.75rem 1rem", textAlign: "center" },
  alertBanner: { background: "#7c2d1215", border: "1px solid #f9731644", borderRadius: "0.625rem", padding: "0.75rem 1rem", fontSize: "0.84rem", color: "#fb923c", textAlign: "center", fontWeight: 600 },

  section: { display: "flex", flexDirection: "column", gap: "1rem" },
  sectionTitle: { fontSize: "1.15rem", fontWeight: 700, color: "#e2e8f0", margin: 0 },
  sectionSub: { fontSize: "0.8rem", color: "#475569", margin: "-0.5rem 0 0 0" },

  tileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.875rem" },
  tileSkeleton: { height: "150px", background: "#1e293b", borderRadius: "0.875rem", border: "1px solid #334155" },
  tile: { background: "#1e293b", border: "1px solid", borderRadius: "0.875rem", padding: "1.1rem", display: "flex", flexDirection: "column", gap: "0.7rem" },
  tileHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tileWardNum: { fontSize: "0.7rem", color: "#475569", fontWeight: 600 },
  tileBand: { fontSize: "0.65rem", fontWeight: 700, padding: "0.18rem 0.55rem", borderRadius: "9999px" },
  tileName: { fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0" },
  tileMetrics: { display: "flex", justifyContent: "space-between" },
  tileMetric: { display: "flex", flexDirection: "column", gap: "0.1rem" },
  tileMetricValue: { fontSize: "1.05rem", fontWeight: 800, color: "#f1f5f9" },
  tileMetricLabel: { fontSize: "0.62rem", color: "#475569" },
  velocityTrack: { height: "4px", background: "#0f172a", borderRadius: "9999px", overflow: "hidden" },
  velocityFill: { height: "100%", borderRadius: "9999px", transition: "width 0.4s" },

  legend: { display: "flex", gap: "1.1rem", flexWrap: "wrap", justifyContent: "center", paddingTop: "0.5rem" },
  legendItem: { display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b" },
  legendDot: { width: "0.55rem", height: "0.55rem", borderRadius: "50%" },

  leaderList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  leaderSkeleton: { height: "58px", background: "#1e293b", borderRadius: "0.625rem", border: "1px solid #334155" },
  leaderRow: { display: "flex", alignItems: "center", gap: "1rem", background: "#1e293b", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.875rem 1.1rem" },
  leaderRank: { fontSize: "0.95rem", fontWeight: 800, width: "2.25rem", flexShrink: 0 },
  leaderInfo: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.1rem" },
  leaderName: { fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" },
  leaderWard: { fontSize: "0.7rem", color: "#475569" },
  leaderStats: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.1rem" },
  leaderResolved: { fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 },
  leaderTime: { fontSize: "0.68rem", color: "#475569" },
  leaderScoreWrap: { display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "3.5rem", justifyContent: "flex-end" },
  leaderScore: { fontSize: "1rem", fontWeight: 800, color: "#22d3ee" },
  leaderBandDot: { width: "0.5rem", height: "0.5rem", borderRadius: "50%" },
};