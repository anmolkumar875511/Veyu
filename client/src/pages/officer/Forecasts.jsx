// src/pages/officer/Forecasts.jsx

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Telescope } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling.js';
import { getActiveForecastsApi, acknowledgeForecastApi, getForecastAccuracyApi, parseForecastError } from '../../api/forecast.api.js';
import { PageShell, NavBar, NavBrand, ErrorBanner, SkeletonGrid, EmptyState } from '../../components/officer/OfficerShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { FORECAST_TRIGGER_META, FORECAST_STATUS_META } from '../../constants/complaint.constants.js';
import { getForecastTriggerIcon } from '../../constants/forecastIcons.js';
import { cn } from '../../lib/utils';

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ confidence }) {
    const pct = Math.round(confidence * 100);
    const tone = confidence >= 0.85 ? 'bg-rose-500 text-rose-600' : confidence >= 0.7 ? 'bg-amber-500 text-amber-600' : 'bg-sky-500 text-sky-600';
    const [barTone, textTone] = tone.split(' ');
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={cn('h-full rounded-full', barTone)} style={{ width: `${pct}%` }} />
            </div>
            <span className={cn('min-w-[2.2rem] text-right text-xs font-bold', textTone)}>{pct}%</span>
        </div>
    );
}

const FORECAST_STATUS_TONE = {
    active: 'text-primary-700 bg-primary-50',
    confirmed: 'text-emerald-700 bg-emerald-50',
    expired: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
    dismissed: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
};

// ── Forecast card ─────────────────────────────────────────────────────────────
function ForecastCard({ forecast, onAcknowledge, acknowledging }) {
    const trigger = FORECAST_TRIGGER_META[forecast.trigger] ?? FORECAST_TRIGGER_META.seasonal;
    const TriggerIcon = getForecastTriggerIcon(forecast.trigger);
    const statusM = FORECAST_STATUS_META[forecast.status] ?? FORECAST_STATUS_META.active;
    const statusTone = FORECAST_STATUS_TONE[forecast.status] ?? FORECAST_STATUS_TONE.active;
    const isActive = forecast.status === 'active';

    return (
        <div
            className={cn(
                'flex flex-col gap-4 rounded-xl border bg-white dark:bg-slate-900 p-5',
                isActive ? 'border-primary-200' : 'border-slate-200 dark:border-slate-800'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: trigger.color }}>
                    <TriggerIcon className="size-3.5" /> {trigger.label}
                </span>
                <span className={cn('rounded-full px-2.5 py-1 text-[0.65rem] font-bold', statusTone)}>{statusM.label}</span>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">{forecast.wardId?.name ?? 'Unknown ward'}</span>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{forecast.category}</span>
                </div>

                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{forecast.summary}</p>

                {forecast.weatherContext?.forecastMm && (
                    <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                        {forecast.weatherContext.forecastMm}mm forecast on{' '}
                        {new Date(forecast.weatherContext.forecastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (
                        {forecast.weatherContext.condition})
                    </div>
                )}

                <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                        Window: {new Date(forecast.predictedStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
                        {new Date(forecast.predictedEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    {forecast.expectedMultiplier && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Expected {forecast.expectedMultiplier}× normal volume</span>
                    )}
                </div>

                <ConfidenceBar confidence={forecast.confidence} />

                {forecast.historicalYears?.length > 0 && (
                    <span className="text-[0.68rem] text-slate-300 dark:text-slate-600">Based on patterns from {forecast.historicalYears.join(', ')}</span>
                )}
            </div>

            {/* Acknowledge */}
            {isActive && (
                <button
                    onClick={() => onAcknowledge(forecast._id)}
                    disabled={acknowledging === forecast._id}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
                >
                    <CheckCircle2 className="size-4" />
                    {acknowledging === forecast._id ? 'Acknowledging…' : 'Acknowledge'}
                </button>
            )}

            {forecast.acknowledgedBy && (
                <span className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Acknowledged {new Date(forecast.acknowledgedAt).toLocaleDateString('en-IN')}
                </span>
            )}
        </div>
    );
}

// ── Accuracy badge ────────────────────────────────────────────────────────────
function AccuracyBadge({ accuracy }) {
    if (!accuracy || accuracy.totalScored === 0) return null;
    const tone = accuracy.accuracyRate >= 70 ? 'text-emerald-600' : accuracy.accuracyRate >= 50 ? 'text-amber-600' : 'text-rose-600';
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3">
            <span className={cn('text-2xl font-extrabold', tone)}>{accuracy.accuracyRate}%</span>
            <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Forecast accuracy</span>
                <span className="text-[0.65rem] text-slate-400 dark:text-slate-500">
                    {accuracy.confirmed} confirmed · {accuracy.expired} missed · {accuracy.totalScored} scored
                </span>
            </div>
        </div>
    );
}

// ── Confidence filter ─────────────────────────────────────────────────────────
function ConfidenceFilter({ value, onChange }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Min confidence</span>
            {[0.5, 0.6, 0.7, 0.85].map((v) => (
                <button
                    key={v}
                    onClick={() => onChange(v)}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs transition-colors',
                        value === v ? 'border-slate-300 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-surface-50 dark:hover:bg-slate-800'
                    )}
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <PageShell>
            <NavBar left={<NavBrand sub="SilentSignal" />} right={<NotificationBell />} />

            <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 pb-16 sm:px-6 xl:px-10">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">SilentSignal</h1>
                        <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            Predictive alerts — issues the city hasn&apos;t reported yet, but historically will.
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
                        icon={Telescope}
                        heading="No active forecasts right now."
                        sub="SilentSignal needs at least 2 years of complaint history to detect seasonal patterns. New forecasts generate automatically every night at 2 AM."
                    />
                )}

                {!loading && activeForecasts.length > 0 && (
                    <section className="flex flex-col gap-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Alerts ({activeForecasts.length})</h2>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {activeForecasts.map((f) => (
                                <ForecastCard key={f._id} forecast={f} onAcknowledge={handleAcknowledge} acknowledging={acknowledging} />
                            ))}
                        </div>
                    </section>
                )}

                {!loading && otherForecasts.length > 0 && (
                    <section className="flex flex-col gap-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Acknowledged / Past</h2>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {otherForecasts.map((f) => (
                                <ForecastCard key={f._id} forecast={f} onAcknowledge={handleAcknowledge} acknowledging={acknowledging} />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </PageShell>
    );
}
