// src/pages/officer/WarRoom.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getTriageQueueApi } from '../../api/officer.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavLink,
    NavUser,
    NavLogout,
    StatusBadge,
    SeverityBar,
    ErrorBanner,
    SkeletonRows,
    EmptyState,
    FilterTabs,
    Pagination,
} from '../../components/officer/OfficerShell.jsx';
import { color, font, space, radius, transition } from '../../theme/index.js';
import { COMPLAINT_STATUS_LABELS, CATEGORY_ICONS } from '../../constants/complaint.constants.js';

const FILTER_TABS = [
    { value: '', label: 'All Active' },
    { value: 'submitted', label: 'New' },
    { value: 'verified', label: 'Verified' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

// ── Queue row ─────────────────────────────────────────────────────────────────
function QueueRow({ complaint, onClick }) {
    const icon = CATEGORY_ICONS[complaint.category] ?? '📋';
    return (
        <tr
            onClick={onClick}
            style={{
                cursor: 'pointer',
                borderBottom: `1px solid ${color.borderFaint}`,
                background: complaint.cascadeRisk ? '#7c2d1208' : 'transparent',
                transition: transition.fast,
            }}
        >
            <td style={td}>
                {complaint.cascadeRisk && (
                    <span
                        title="Cascade risk — nearby water issue verified"
                        style={{ fontSize: '0.9rem' }}
                    >
                        ⚡
                    </span>
                )}
            </td>
            <td style={td}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            </td>
            <td style={{ ...td, minWidth: '240px' }}>
                <span
                    style={{
                        display: 'block',
                        fontSize: font.size.sm,
                        fontWeight: font.weight.semibold,
                        color: color.textPrimary,
                    }}
                >
                    {complaint.title}
                </span>
                <span
                    style={{
                        display: 'block',
                        fontSize: font.size.xs,
                        color: color.textMuted,
                        marginTop: '0.15rem',
                    }}
                >
                    {complaint.category} · {complaint.wardId?.name ?? 'Unknown ward'}
                </span>
            </td>
            <td style={td}>
                <SeverityBar severity={complaint.severity} />
            </td>
            <td style={td}>
                {complaint.upvotes > 0 ? (
                    <span
                        style={{
                            fontSize: font.size.xs,
                            color: '#f59e0b',
                            fontWeight: font.weight.bold,
                        }}
                    >
                        ▲ {complaint.upvotes}
                    </span>
                ) : (
                    <span style={{ color: color.borderDefault, fontSize: font.size.sm }}>—</span>
                )}
            </td>
            <td style={td}>
                <StatusBadge status={complaint.status} />
            </td>
            <td style={td}>
                <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                    {formatTimeAgo(complaint.createdAt)}
                </span>
            </td>
        </tr>
    );
}

const td = { padding: `0.75rem 0.875rem`, verticalAlign: 'middle' };
const th = {
    textAlign: 'left',
    fontSize: '0.68rem',
    fontWeight: font.weight.bold,
    color: color.textMuted,
    letterSpacing: font.tracking.wide,
    textTransform: 'uppercase',
    padding: `0.75rem 0.875rem`,
    borderBottom: `1px solid ${color.borderDefault}`,
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WarRoom() {
    const user = useCurrentUser();
    const logout = useLogout();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusTab, setStatusTab] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchQueue = useCallback(
        async (p = page, st = statusTab) => {
            try {
                const params = { page: p, limit: 20 };
                if (st) params.status = st;
                const result = await getTriageQueueApi(params);
                setComplaints(result.complaints ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load the triage queue.');
            } finally {
                setLoading(false);
            }
        },
        [page, statusTab]
    );

    useEffect(() => {
        fetchQueue(page, statusTab);
    }, [page, statusTab]);
    usePolling(() => fetchQueue(page, statusTab), 30_000, true);

    function handleTabChange(val) {
        setStatusTab(val);
        setPage(1);
    }

    const cascadeCount = complaints.filter((c) => c.cascadeRisk).length;

    return (
        <PageShell>
            <NavBar
                left={<NavBrand sub="War Room" />}
                right={
                    <>
                        <NavLink to="/forecasts">SilentSignal</NavLink>
                        <NavLink to="/reports">Ward Reports</NavLink>
                        <NavUser name={user?.name} />
                        <NavLogout onClick={logout} />
                    </>
                }
            />

            <main
                style={{
                    maxWidth: '1080px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[6]} ${space[16]}`,
                }}
            >
                {/* Header */}
                <div style={{ marginBottom: space[5] }}>
                    <h1
                        style={{
                            fontSize: '1.4rem',
                            fontWeight: font.weight.extrabold,
                            color: color.textPrimary,
                            margin: `0 0 ${space[1]} 0`,
                        }}
                    >
                        Triage Queue
                    </h1>
                    <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                        {loading
                            ? 'Loading…'
                            : `${total} active complaint${total !== 1 ? 's' : ''}`}
                        {cascadeCount > 0 && (
                            <span style={{ color: '#f97316', fontWeight: font.weight.bold }}>
                                {' '}
                                · ⚡ {cascadeCount} cascade risk{cascadeCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>

                <FilterTabs tabs={FILTER_TABS} active={statusTab} onChange={handleTabChange} />

                <ErrorBanner message={error} onRetry={() => fetchQueue(page, statusTab)} />

                {loading && <SkeletonRows count={5} height="52px" />}

                {!loading && complaints.length === 0 && (
                    <EmptyState icon="✅" heading="No complaints in this queue. All clear." />
                )}

                {!loading && complaints.length > 0 && (
                    <div
                        style={{
                            background: color.bgSurface,
                            border: `1px solid ${color.borderDefault}`,
                            borderRadius: radius.xl,
                            overflow: 'hidden',
                        }}
                    >
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={th}></th>
                                    <th style={th}></th>
                                    <th style={th}>Complaint</th>
                                    <th style={th}>Severity</th>
                                    <th style={th}>Votes</th>
                                    <th style={th}>Status</th>
                                    <th style={th}>Age</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((c) => (
                                    <QueueRow
                                        key={c._id}
                                        complaint={c}
                                        onClick={() => navigate(`/war-room/${c._id}`)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPrev={() => setPage((p) => p - 1)}
                    onNext={() => setPage((p) => p + 1)}
                />
            </main>
        </PageShell>
    );
}
