// src/pages/worker/Tasks.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getMyTasksApi, getWorkerSummaryApi } from '../../api/worker.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavAccentLink,
    NavLogout,
    AssignmentBadge,
    SeverityTag,
    ErrorBanner,
    SkeletonRows,
    EmptyState,
} from '../../components/worker/WorkerShell.jsx';
import { color, font, space, radius, transition } from '../../theme/index.js';
import { ASSIGNMENT_STATUS_LABELS, CATEGORY_ICONS } from '../../constants/complaint.constants.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatPill({ label, value, accent }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.lg,
                padding: `${space[3]} ${space[4]}`,
                minWidth: '80px',
            }}
        >
            <span
                style={{
                    fontSize: '1.1rem',
                    fontWeight: font.weight.extrabold,
                    color: accent ?? color.textPrimary,
                }}
            >
                {value ?? '—'}
            </span>
            <span style={{ fontSize: font.size.xs, color: color.textMuted }}>{label}</span>
        </div>
    );
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, index, onClick }) {
    const complaint = task.complaintId;
    const icon = CATEGORY_ICONS[complaint?.category] ?? '📋';

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[3],
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: `0.875rem ${space[4]}`,
                cursor: 'pointer',
                transition: transition.fast,
            }}
        >
            <span
                style={{
                    fontSize: font.size.xs,
                    fontWeight: font.weight.bold,
                    color: color.textMuted,
                    width: '1.25rem',
                    flexShrink: 0,
                }}
            >
                {index + 1}
            </span>

            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</span>

            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                }}
            >
                <span
                    style={{
                        fontSize: font.size.base,
                        fontWeight: font.weight.semibold,
                        color: color.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {complaint?.title ?? 'Task'}
                </span>
                <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                    {complaint?.category} · {complaint?.address ?? 'No address'}
                </span>
                {task.instructions && (
                    <span style={{ fontSize: font.size.xs, color: '#a78bfa', marginTop: '0.1rem' }}>
                        📝 {task.instructions}
                    </span>
                )}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.3rem',
                    flexShrink: 0,
                }}
            >
                <AssignmentBadge
                    status={task.status}
                    label={ASSIGNMENT_STATUS_LABELS[task.status]}
                />
                <SeverityTag severity={complaint?.severity} />
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorkerTasks() {
    const user = useCurrentUser();
    const logout = useLogout();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTasks = useCallback(async () => {
        try {
            const result = await getMyTasksApi();
            setTasks(result.tasks ?? []);
            setError(null);
        } catch {
            setError('Could not load your tasks.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
        getWorkerSummaryApi()
            .then(setSummary)
            .catch(() => {});
    }, []);

    usePolling(fetchTasks, 30_000, true);

    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <PageShell>
            <NavBar
                left={<NavBrand sub="Field Tasks" />}
                right={
                    <>
                        <NavAccentLink to="/observations">FieldMesh</NavAccentLink>
                        <NavLogout onClick={logout} />
                    </>
                }
            />

            <main
                style={{
                    maxWidth: '640px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[5]} ${space[16]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[8],
                }}
            >
                {/* Greeting + stats */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
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
                                Hi, {firstName} 👷
                            </h1>
                            <p
                                style={{
                                    fontSize: font.size.sm,
                                    color: color.textMuted,
                                    margin: 0,
                                }}
                            >
                                Your assigned tasks for today
                            </p>
                        </div>
                        <a
                            href="/observations"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: '#a78bfa22',
                                border: '1px solid #a78bfa55',
                                borderRadius: radius.lg,
                                color: '#c4b5fd',
                                fontSize: font.size.sm,
                                fontWeight: font.weight.semibold,
                                padding: `0.55rem ${space[4]}`,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            + Report Observation
                        </a>
                    </div>

                    {summary && (
                        <div style={{ display: 'flex', gap: space[3], flexWrap: 'wrap' }}>
                            <StatPill
                                label="Active tasks"
                                value={summary.pendingCount}
                                accent={color.accent}
                            />
                            <StatPill
                                label="Completed"
                                value={summary.completedCount}
                                accent={color.success}
                            />
                            <StatPill
                                label="Observations"
                                value={summary.observationCount}
                                accent="#a78bfa"
                            />
                            <StatPill
                                label="Field points"
                                value={`★ ${summary.worker?.fieldPoints ?? 0}`}
                                accent="#eab308"
                            />
                        </div>
                    )}
                </section>

                {/* Task feed */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
                    <h2
                        style={{
                            fontSize: font.size.md,
                            fontWeight: font.weight.bold,
                            color: color.textPrimary,
                            margin: 0,
                        }}
                    >
                        Today's Route
                    </h2>

                    <ErrorBanner message={error} />

                    {loading && <SkeletonRows count={3} height="80px" />}

                    {!loading && tasks.length === 0 && (
                        <EmptyState
                            icon="🎉"
                            heading="No tasks assigned right now."
                            sub="Check back soon, or submit a FieldMesh observation while you're on the ground."
                            cta="Submit observation →"
                            ctaTo="/observations"
                        />
                    )}

                    {!loading && tasks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                            {tasks.map((t, i) => (
                                <TaskCard
                                    key={t._id}
                                    task={t}
                                    index={i}
                                    onClick={() => navigate(`/tasks/${t._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </PageShell>
    );
}
