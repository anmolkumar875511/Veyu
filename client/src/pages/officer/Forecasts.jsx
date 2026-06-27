// src/pages/officer/Forecasts.jsx

import { useState, useEffect, useCallback } from 'react';
import { usePolling } from '../../hooks/usePolling.js';
import {
    getActiveForecastsApi,
    acknowledgeForecastApi,
    getForecastAccuracyApi,
    parseForecastError,
} from '../../api/forecast.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavLink,
    ErrorBanner,
    SkeletonGrid,
    EmptyState,
} from '../../components/officer/OfficerShell.jsx';
import { color, font, space, radius, transition, mk } from '../../theme/index.js';
import {
    FORECAST_TRIGGER_META,
    FORECAST_STATUS_META,
} from '../../constants/complaint.constants.js';

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ confidence }) {
    const pct = Math.round(confidence * 100);
    const c = confidence >= 0.85 ? color.danger : confidence >= 0.7 ? '#f59e0b' : '#3b82f6';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
            <div
                style={{
                    flex: 1,
                    height: '5px',
                    background: color.bgPage,
                    borderRadius: radius.full,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: c,
                        borderRadius: radius.full,
                    }}
                />
            </div>
            <span
                style={{
                    fontSize: '0.72rem',
                    fontWeight: font.weight.bold,
                    color: c,
                    minWidth: '2.2rem',
                    textAlign: 'right',
                }}
            >
                {pct}%
            </span>
        </div>
    );
}

// ── Forecast card ─────────────────────────────────────────────────────────────
function ForecastCard({ forecast, onAcknowledge, acknowledging }) {
    const trigger = FORECAST_TRIGGER_META[forecast.trigger] ?? FORECAST_TRIGGER_META.seasonal;
    const statusM = FORECAST_STATUS_META[forecast.status] ?? FORECAST_STATUS_META.active;
    const isActive = forecast.status === 'active';

    return (
        <div
            style={{
                background: color.bgSurface,
                border: `1px solid ${isActive ? `${trigger.color}44` : color.borderDefault}`,
                borderRadius: radius.xl,
                padding: space[5],
                display: 'flex',
                flexDirection: 'column',
                gap: space[4],
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: font.size.xs,
                        fontWeight: font.weight.semibold,
                    }}
                >
                    <span>{trigger.icon}</span>
                    <span style={{ color: trigger.color }}>{trigger.label}</span>
                </span>
                <span
                    style={{
                        fontSize: '0.65rem',
                        fontWeight: font.weight.bold,
                        padding: '0.18rem 0.55rem',
                        borderRadius: radius.full,
                        color: statusM.color,
                        background: `${statusM.color}1a`,
                    }}
                >
                    {statusM.label}
                </span>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: space[2],
                    }}
                >
                    <span
                        style={{
                            fontSize: font.size.base,
                            fontWeight: font.weight.bold,
                            color: color.textPrimary,
                        }}
                    >
                        {forecast.wardId?.name ?? 'Unknown ward'}
                    </span>
                    <span style={{ fontSize: font.size.xs, color: color.textMuted, flexShrink: 0 }}>
                        {forecast.category}
                    </span>
                </div>

                <p
                    style={{
                        fontSize: font.size.sm,
                        color: color.textSecondary,
                        lineHeight: 1.6,
                        margin: 0,
                    }}
                >
                    {forecast.summary}
                </p>

                {forecast.weatherContext?.forecastMm && (
                    <div
                        style={{
                            background: '#3b82f611',
                            border: '1px solid #3b82f633',
                            borderRadius: radius.sm,
                            padding: `${space[2]} ${space[3]}`,
                            fontSize: font.size.xs,
                            color: '#93c5fd',
                        }}
                    >
                        🌧️ {forecast.weatherContext.forecastMm}mm forecast on{' '}
                        {new Date(forecast.weatherContext.forecastDate).toLocaleDateString(
                            'en-IN',
                            { day: 'numeric', month: 'short' }
                        )}{' '}
                        ({forecast.weatherContext.condition})
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
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
                        <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                            Expected {forecast.expectedMultiplier}× normal volume
                        </span>
                    )}
                </div>

                <ConfidenceBar confidence={forecast.confidence} />

                {forecast.historicalYears?.length > 0 && (
                    <span style={{ fontSize: '0.68rem', color: color.borderDefault }}>
                        Based on patterns from {forecast.historicalYears.join(', ')}
                    </span>
                )}
            </div>

            {/* Acknowledge */}
            {isActive && (
                <button
                    onClick={() => onAcknowledge(forecast._id)}
                    disabled={acknowledging === forecast._id}
                    style={mk.btnPrimary({ disabled: acknowledging === forecast._id })}
                >
                    {acknowledging === forecast._id ? 'Acknowledging…' : '✓ Acknowledge'}
                </button>
            )}

            {forecast.acknowledgedBy && (
                <span
                    style={{ fontSize: font.size.xs, color: color.textMuted, textAlign: 'center' }}
                >
                    Acknowledged {new Date(forecast.acknowledgedAt).toLocaleDateString('en-IN')}
                </span>
            )}
        </div>
    );
}

// ── Accuracy badge ────────────────────────────────────────────────────────────
function AccuracyBadge({ accuracy }) {
    if (!accuracy || accuracy.totalScored === 0) return null;
    const c =
        accuracy.accuracyRate >= 70
            ? color.success
            : accuracy.accuracyRate >= 50
              ? '#f59e0b'
              : color.danger;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[3],
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: `${space[3]} ${space[5]}`,
            }}
        >
            <span style={{ fontSize: '1.5rem', fontWeight: font.weight.extrabold, color: c }}>
                {accuracy.accuracyRate}%
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span
                    style={{
                        fontSize: font.size.xs,
                        color: color.textSecondary,
                        fontWeight: font.weight.semibold,
                    }}
                >
                    Forecast accuracy
                </span>
                <span style={{ fontSize: '0.65rem', color: color.textMuted }}>
                    {accuracy.confirmed} confirmed · {accuracy.expired} missed ·{' '}
                    {accuracy.totalScored} scored
                </span>
            </div>
        </div>
    );
}

// ── Confidence filter ─────────────────────────────────────────────────────────
function ConfidenceFilter({ value, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
            <span style={{ fontSize: font.size.xs, color: color.textMuted }}>Min confidence</span>
            {[0.5, 0.6, 0.7, 0.85].map((v) => (
                <button
                    key={v}
                    onClick={() => onChange(v)}
                    style={{
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.full,
                        fontSize: font.size.xs,
                        padding: '0.3rem 0.7rem',
                        cursor: 'pointer',
                        background: value === v ? color.bgElevated : 'transparent',
                        color: value === v ? color.textPrimary : color.textMuted,
                        transition: transition.fast,
                    }}
                >
                    {Math.round(v * 100)}%
                </button>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OfficerForecasts() {
    const [forecasts, setForecasts] = useState([]);
    const [accuracy, setAccuracy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionErr, setActionErr] = useState(null);
    const [acknowledging, setAcknowledging] = useState(null);
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

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: space[4],
    };

    return (
        <PageShell>
            <NavBar
                left={<NavBrand sub="SilentSignal" />}
                right={
                    <>
                        <NavLink to="/war-room">War Room</NavLink>
                        <NavLink to="/reports">Ward Reports</NavLink>
                    </>
                }
            />

            <main
                style={{
                    maxWidth: '920px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[6]} ${space[16]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[6],
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: space[4],
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: '1.4rem',
                                fontWeight: font.weight.extrabold,
                                color: color.textPrimary,
                                margin: `0 0 ${space[1]} 0`,
                            }}
                        >
                            SilentSignal
                        </h1>
                        <p
                            style={{
                                fontSize: font.size.sm,
                                color: color.textMuted,
                                margin: 0,
                                maxWidth: '420px',
                                lineHeight: 1.6,
                            }}
                        >
                            Predictive alerts — issues the city hasn't reported yet, but
                            historically will.
                        </p>
                    </div>
                    <AccuracyBadge accuracy={accuracy} />
                </div>

                <ConfidenceFilter
                    value={minConfidence}
                    onChange={(v) => {
                        setMinConfidence(v);
                        setLoading(true);
                    }}
                />

                <ErrorBanner message={actionErr} />
                <ErrorBanner message={error} />

                {loading && <SkeletonGrid count={3} height="220px" />}

                {!loading && forecasts.length === 0 && (
                    <EmptyState
                        icon="🔭"
                        heading="No active forecasts right now."
                        sub="SilentSignal needs at least 2 years of complaint history to detect seasonal patterns. New forecasts generate automatically every night at 2 AM."
                    />
                )}

                {!loading && activeForecasts.length > 0 && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
                        <h2
                            style={{
                                fontSize: font.size.md,
                                fontWeight: font.weight.bold,
                                color: color.textPrimary,
                                margin: 0,
                            }}
                        >
                            Active Alerts ({activeForecasts.length})
                        </h2>
                        <div style={gridStyle}>
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

                {!loading && otherForecasts.length > 0 && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
                        <h2
                            style={{
                                fontSize: font.size.md,
                                fontWeight: font.weight.bold,
                                color: color.textPrimary,
                                margin: 0,
                            }}
                        >
                            Acknowledged / Past
                        </h2>
                        <div style={gridStyle}>
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
            </main>
        </PageShell>
    );
}
