// ─────────────────────────────────────────────────────────────────────────────
// src/pages/officer/Forecasts.jsx
//
// SilentSignal alert feed for officers. Shows predictive forecasts generated
// from seasonal patterns and weather correlation — issues the city hasn't
// reported yet, but historically will.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import {
    getActiveForecastsApi,
    acknowledgeForecastApi,
    getForecastAccuracyApi,
    parseForecastError,
} from '../../api/forecast.api.js';
import {
    FORECAST_TRIGGER_META,
    FORECAST_STATUS_META,
} from '../../constants/complaint.constants.js';

function ConfidenceBar({ confidence }) {
    const pct = Math.round(confidence * 100);
    const color = confidence >= 0.85 ? '#ef4444' : confidence >= 0.7 ? '#f59e0b' : '#3b82f6';
    return (
        <div style={s.confWrap}>
            <div style={s.confTrack}>
                <div style={{ ...s.confFill, width: `${pct}%`, background: color }} />
            </div>
            <span style={{ ...s.confLabel, color }}>{pct}%</span>
        </div>
    );
}

function ForecastCard({ forecast, onAcknowledge, acknowledging }) {
    const trigger = FORECAST_TRIGGER_META[forecast.trigger] ?? FORECAST_TRIGGER_META.seasonal;
    const status = FORECAST_STATUS_META[forecast.status] ?? FORECAST_STATUS_META.active;
    const isActive = forecast.status === 'active';

    return (
        <div style={{ ...s.card, borderColor: isActive ? `${trigger.color}44` : '#334155' }}>
            <div style={s.cardHeader}>
                <span style={s.triggerTag}>
                    <span>{trigger.icon}</span>
                    <span style={{ color: trigger.color }}>{trigger.label}</span>
                </span>
                <span
                    style={{ ...s.statusTag, color: status.color, background: `${status.color}1a` }}
                >
                    {status.label}
                </span>
            </div>

            <div style={s.cardBody}>
                <div style={s.cardTitleRow}>
                    <span style={s.wardName}>{forecast.wardId?.name ?? 'Unknown ward'}</span>
                    <span style={s.category}>{forecast.category}</span>
                </div>

                <p style={s.summary}>{forecast.summary}</p>

                {forecast.weatherContext?.forecastMm && (
                    <div style={s.weatherBox}>
                        🌧️ {forecast.weatherContext.forecastMm}mm forecast on{' '}
                        {new Date(forecast.weatherContext.forecastDate).toLocaleDateString(
                            'en-IN',
                            { day: 'numeric', month: 'short' }
                        )}{' '}
                        ({forecast.weatherContext.condition})
                    </div>
                )}

                <div style={s.metaRow}>
                    <span style={s.metaItem}>
                        Window:{' '}
                        {new Date(forecast.predictedStartDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                        })}{' '}
                        –{' '}
                        {new Date(forecast.predictedEndDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                        })}
                    </span>
                    {forecast.expectedMultiplier && (
                        <span style={s.metaItem}>
                            Expected {forecast.expectedMultiplier}× normal volume
                        </span>
                    )}
                </div>

                <ConfidenceBar confidence={forecast.confidence} />

                {forecast.historicalYears?.length > 0 && (
                    <span style={s.historicalNote}>
                        Based on patterns from {forecast.historicalYears.join(', ')}
                    </span>
                )}
            </div>

            {isActive && (
                <button
                    onClick={() => onAcknowledge(forecast._id)}
                    disabled={acknowledging === forecast._id}
                    style={s.ackBtn}
                >
                    {acknowledging === forecast._id ? 'Acknowledging…' : '✓ Acknowledge'}
                </button>
            )}

            {forecast.acknowledgedBy && (
                <span style={s.ackedNote}>
                    Acknowledged {new Date(forecast.acknowledgedAt).toLocaleDateString('en-IN')}
                </span>
            )}
        </div>
    );
}

function AccuracyBadge({ accuracy }) {
    if (!accuracy || accuracy.totalScored === 0) return null;
    const color =
        accuracy.accuracyRate >= 70
            ? '#22c55e'
            : accuracy.accuracyRate >= 50
              ? '#f59e0b'
              : '#ef4444';
    return (
        <div style={s.accuracyBadge}>
            <span style={{ ...s.accuracyValue, color }}>{accuracy.accuracyRate}%</span>
            <div style={s.accuracyDetail}>
                <span style={s.accuracyLabel}>Forecast accuracy</span>
                <span style={s.accuracySub}>
                    {accuracy.confirmed} confirmed · {accuracy.expired} missed ·{' '}
                    {accuracy.totalScored} scored
                </span>
            </div>
        </div>
    );
}

export default function OfficerForecasts() {
    const user = useCurrentUser();

    const [forecasts, setForecasts] = useState([]);
    const [accuracy, setAccuracy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acknowledging, setAcknowledging] = useState(null);
    const [actionErr, setActionErr] = useState(null);
    const [minConfidence, setMinConfidence] = useState(0.6);

    const fetchForecasts = useCallback(async () => {
        try {
            const data = await getActiveForecastsApi({ minConfidence });
            setForecasts(data.forecasts ?? []);
            setError(null);
        } catch {
            setError('Could not load forecasts.');
        } finally {
            setLoading(false);
        }
    }, [minConfidence]);

    useEffect(() => {
        fetchForecasts();
        getForecastAccuracyApi()
            .then(setAccuracy)
            .catch(() => {});
    }, [minConfidence]);

    usePolling(fetchForecasts, 60_000, true);

    async function handleAcknowledge(id) {
        setAcknowledging(id);
        setActionErr(null);
        try {
            await acknowledgeForecastApi(id);
            fetchForecasts();
        } catch (err) {
            setActionErr(parseForecastError(err));
        } finally {
            setAcknowledging(null);
        }
    }

    const activeForecasts = forecasts.filter((f) => f.status === 'active');
    const otherForecasts = forecasts.filter((f) => f.status !== 'active');

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <div style={s.navBrand}>
                    <span style={s.brandDot} />
                    <span style={s.brandName}>Nagarik</span>
                    <span style={s.navDivider}>·</span>
                    <span style={s.navRole}>SilentSignal</span>
                </div>
                <div style={s.navRight}>
                    <Link to="/war-room" style={s.navLink}>
                        War Room
                    </Link>
                    <Link to="/reports" style={s.navLink}>
                        Ward Reports
                    </Link>
                </div>
            </header>

            <main style={s.main}>
                <div style={s.headerRow}>
                    <div>
                        <h1 style={s.heading}>SilentSignal</h1>
                        <p style={s.subheading}>
                            Predictive alerts — issues the city hasn't reported yet, but
                            historically will.
                        </p>
                    </div>
                    <AccuracyBadge accuracy={accuracy} />
                </div>

                {/* Confidence filter */}
                <div style={s.filterRow}>
                    <span style={s.filterLabel}>Min confidence</span>
                    {[0.5, 0.6, 0.7, 0.85].map((v) => (
                        <button
                            key={v}
                            onClick={() => setMinConfidence(v)}
                            style={{
                                ...s.filterBtn,
                                background: minConfidence === v ? '#334155' : 'transparent',
                                color: minConfidence === v ? '#f1f5f9' : '#64748b',
                            }}
                        >
                            {Math.round(v * 100)}%
                        </button>
                    ))}
                </div>

                {actionErr && <div style={s.errorBanner}>{actionErr}</div>}
                {error && <div style={s.errorBanner}>{error}</div>}

                {loading ? (
                    <div style={s.skeletonGrid}>
                        {[0, 1, 2].map((i) => (
                            <div key={i} style={s.skeleton} />
                        ))}
                    </div>
                ) : forecasts.length === 0 ? (
                    <div style={s.empty}>
                        <span style={s.emptyIcon}>🔭</span>
                        <p style={s.emptyText}>No active forecasts right now.</p>
                        <p style={s.emptySub}>
                            SilentSignal needs at least 2 years of complaint history to detect
                            seasonal patterns. New forecasts generate automatically every night at 2
                            AM.
                        </p>
                    </div>
                ) : (
                    <>
                        {activeForecasts.length > 0 && (
                            <section style={s.section}>
                                <h2 style={s.sectionTitle}>
                                    Active Alerts ({activeForecasts.length})
                                </h2>
                                <div style={s.grid}>
                                    {activeForecasts.map((f) => (
                                        <ForecastCard
                                            key={f._id}
                                            forecast={f}
                                            onAcknowledge={handleAcknowledge}
                                            acknowledging={acknowledging}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {otherForecasts.length > 0 && (
                            <section style={s.section}>
                                <h2 style={s.sectionTitle}>Acknowledged / Past</h2>
                                <div style={s.grid}>
                                    {otherForecasts.map((f) => (
                                        <ForecastCard
                                            key={f._id}
                                            forecast={f}
                                            onAcknowledge={handleAcknowledge}
                                            acknowledging={acknowledging}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

const s = {
    page: {
        minHeight: '100vh',
        background: '#0f172a',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#f8fafc',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        height: '56px',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    },
    navBrand: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    brandDot: {
        width: '0.55rem',
        height: '0.55rem',
        borderRadius: '50%',
        background: '#22d3ee',
        boxShadow: '0 0 8px #22d3ee88',
    },
    brandName: {
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#e2e8f0',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    navDivider: { color: '#334155' },
    navRole: { fontSize: '0.8rem', color: '#64748b', fontWeight: 500 },
    navRight: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
    navLink: { fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'none' },

    main: {
        maxWidth: '920px',
        margin: '0 auto',
        padding: '1.75rem 1.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    heading: { fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem 0' },
    subheading: { fontSize: '0.82rem', color: '#64748b', margin: 0, maxWidth: '420px' },

    accuracyBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '0.75rem 1.1rem',
    },
    accuracyValue: { fontSize: '1.5rem', fontWeight: 800 },
    accuracyDetail: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
    accuracyLabel: { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 },
    accuracySub: { fontSize: '0.65rem', color: '#475569' },

    filterRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    filterLabel: { fontSize: '0.75rem', color: '#475569', marginRight: '0.25rem' },
    filterBtn: {
        border: '1px solid #334155',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        padding: '0.3rem 0.7rem',
        cursor: 'pointer',
    },

    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.84rem',
        padding: '0.75rem 1rem',
    },

    skeletonGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
    },
    skeleton: {
        height: '220px',
        background: '#1e293b',
        borderRadius: '0.875rem',
        border: '1px solid #334155',
    },

    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '4rem 1rem',
        textAlign: 'center',
    },
    emptyIcon: { fontSize: '2.5rem' },
    emptyText: { fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8', margin: 0 },
    emptySub: {
        fontSize: '0.78rem',
        color: '#475569',
        maxWidth: '380px',
        lineHeight: 1.6,
        margin: 0,
    },

    section: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
    sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
    },

    card: {
        background: '#1e293b',
        border: '1px solid',
        borderRadius: '0.875rem',
        padding: '1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
    },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    triggerTag: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: '0.72rem',
        fontWeight: 600,
    },
    statusTag: {
        fontSize: '0.65rem',
        fontWeight: 700,
        padding: '0.18rem 0.55rem',
        borderRadius: '9999px',
    },
    cardBody: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
    cardTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    wardName: { fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' },
    category: { fontSize: '0.72rem', color: '#64748b' },
    summary: { fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 },
    weatherBox: {
        background: '#3b82f611',
        border: '1px solid #3b82f633',
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.74rem',
        color: '#93c5fd',
    },
    metaRow: { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
    metaItem: { fontSize: '0.72rem', color: '#475569' },
    confWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    confTrack: {
        flex: 1,
        height: '5px',
        background: '#0f172a',
        borderRadius: '9999px',
        overflow: 'hidden',
    },
    confFill: { height: '100%', borderRadius: '9999px' },
    confLabel: { fontSize: '0.72rem', fontWeight: 700, minWidth: '2.2rem', textAlign: 'right' },
    historicalNote: { fontSize: '0.68rem', color: '#334155' },

    ackBtn: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#0f172a',
        fontSize: '0.8rem',
        fontWeight: 700,
        padding: '0.55rem',
        cursor: 'pointer',
    },
    ackedNote: { fontSize: '0.7rem', color: '#475569', textAlign: 'center' },
};
