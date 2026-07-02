// src/pages/citizen/MyComplaints.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import {
    getMyComplaintsApi,
    getComplaintByIdApi,
    toggleUpvoteApi,
    deleteComplaintApi,
    parseComplaintError,
} from '../../api/complaints.api.js';
import {
    PageShell,
    NavBar,
    NavLinkAccent,
    StatusBadge,
    SeverityPip,
    SectionLabel,
    ErrorBanner,
    Skeleton,
    Pagination,
    Card,
} from '../../components/citizen/CitizenShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { MapContainer } from '../../components/shared/MapContainer.jsx';
import { complaintMarkerIcon } from '../../config/mapMarkers.js';
import { color, font, space, radius, shadow, transition } from '../../theme/index.js';
import {
    CATEGORY_ICONS,
    STATUS_META,
    STATUS_TABS,
    TIMELINE_STEPS,
    DELETABLE_STATUSES,
} from '../../constants/complaint.constants.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

// ── StatusTimeline ────────────────────────────────────────────────────────────
function StatusTimeline({ status }) {
    const isTerminal = status === 'rejected' || status === 'duplicate';

    if (isTerminal) {
        return (
            <div style={{ display: 'flex' }}>
                <StatusBadge status={status} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {TIMELINE_STEPS.map((st, i) => {
                const m = STATUS_META[st];
                const done = (STATUS_META[status]?.step ?? 0) > i;
                const active = status === st;
                return (
                    <div
                        key={st}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.3rem',
                            flex: 1,
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                width: '0.6rem',
                                height: '0.6rem',
                                borderRadius: radius.full,
                                background: done || active ? m.color : color.borderDefault,
                                boxShadow: active ? `0 0 8px ${m.color}88` : 'none',
                                transition: 'background 0.3s',
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                fontSize: '0.58rem',
                                fontWeight: font.weight.medium,
                                textAlign: 'center',
                                lineHeight: 1.2,
                                color: done || active ? m.color : color.textMuted,
                            }}
                        >
                            {m.label}
                        </span>
                        {i < TIMELINE_STEPS.length - 1 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0.28rem',
                                    left: '50%',
                                    right: '-50%',
                                    height: '1px',
                                    background: done ? color.borderDefault : color.bgPage,
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── ComplaintRow ──────────────────────────────────────────────────────────────
function ComplaintRow({ complaint, isSelected, onClick }) {
    const icon = CATEGORY_ICONS[complaint.category] ?? '📋';
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[3],
                border: `1px solid ${isSelected ? color.accent + '44' : color.borderDefault}`,
                background: isSelected ? color.bgElevated : color.bgSurface,
                borderRadius: radius.lg,
                padding: `0.875rem ${space[4]}`,
                cursor: 'pointer',
                transition: transition.fast,
            }}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <span
                    style={{
                        display: 'block',
                        fontSize: font.size.base,
                        fontWeight: font.weight.semibold,
                        color: color.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {complaint.title}
                </span>
                <span
                    style={{
                        display: 'block',
                        fontSize: font.size.xs,
                        color: color.textMuted,
                        marginTop: '0.2rem',
                    }}
                >
                    {complaint.category} · {formatDate(complaint.createdAt)}
                </span>
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
                <StatusBadge status={complaint.status} />
                <SeverityPip severity={complaint.severity} />
            </div>
        </div>
    );
}

// ── Tiny location map shown in the complaint detail drawer ────────────────────
function CitizenPinLayer({ map, complaint }) {
    useEffect(() => {
        if (!map || !complaint?.location?.coordinates) return;
        const [lng, lat] = complaint.location.coordinates;
        const marker = new window.google.maps.Marker({
            map,
            position: { lat, lng },
            icon: complaintMarkerIcon(complaint.severity),
            title: complaint.title,
        });
        map.panTo({ lat, lng });
        return () => marker.setMap(null);
    }, [map, complaint]);
    return null;
}

function CitizenPinMap({ complaint }) {
    if (!complaint?.location?.coordinates) return null;
    const [lng, lat] = complaint.location.coordinates;
    return (
        <MapContainer center={{ lat, lng }} zoom={16} height="180px">
            {(map) => <CitizenPinLayer map={map} complaint={complaint} />}
        </MapContainer>
    );
}

// ── DetailDrawer ──────────────────────────────────────────────────────────────
function DetailDrawer({ complaintId, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);
    const [upvotes, setUpvotes] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState(null);

    useEffect(() => {
        setLoading(true);
        setErr(null);
        getComplaintByIdApi(complaintId)
            .then(({ complaint, hasVoted: hv }) => {
                setDetail(complaint);
                setHasVoted(hv);
                setUpvotes(complaint.upvotes);
            })
            .catch(() => setErr('Could not load complaint details.'))
            .finally(() => setLoading(false));
    }, [complaintId]);

    async function handleVote() {
        try {
            const res = await toggleUpvoteApi(complaintId);
            setUpvotes(res.upvotes);
            setHasVoted(res.hasVoted);
        } catch {
            /* non-fatal */
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this complaint? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteComplaintApi(complaintId);
            onClose('deleted');
        } catch (e) {
            setErr(parseComplaintError(e));
            setDeleting(false);
        }
    }

    const canDelete = detail && DELETABLE_STATUSES.includes(detail.status);

    return (
        <div
            style={{
                width: '360px',
                flexShrink: 0,
                borderLeft: `1px solid ${color.borderFaint}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto',
                background: color.bgSurface,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${space[4]} ${space[5]}`,
                    borderBottom: `1px solid ${color.borderDefault}`,
                    position: 'sticky',
                    top: 0,
                    background: color.bgSurface,
                    zIndex: 1,
                }}
            >
                <span
                    style={{
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        color: color.textPrimary,
                    }}
                >
                    Complaint Detail
                </span>
                <button
                    onClick={() => onClose()}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: color.textMuted,
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        lineHeight: 1,
                    }}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            {loading && (
                <div
                    style={{
                        padding: space[8],
                        color: color.textMuted,
                        fontSize: font.size.sm,
                        textAlign: 'center',
                    }}
                >
                    Loading…
                </div>
            )}
            {err && (
                <div
                    style={{
                        padding: `${space[4]} ${space[5]}`,
                        color: '#fca5a5',
                        fontSize: font.size.sm,
                    }}
                >
                    {err}
                </div>
            )}

            {detail && !loading && (
                <div
                    style={{
                        padding: space[5],
                        display: 'flex',
                        flexDirection: 'column',
                        gap: space[4],
                    }}
                >
                    <img
                        src={detail.imageUrl}
                        alt="Complaint"
                        style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover',
                            borderRadius: radius.md,
                        }}
                    />

                    <h2
                        style={{
                            fontSize: font.size.md,
                            fontWeight: font.weight.bold,
                            color: color.textPrimary,
                            margin: 0,
                            lineHeight: 1.4,
                        }}
                    >
                        {detail.title}
                    </h2>

                    <div
                        style={{
                            display: 'flex',
                            gap: space[2],
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        <StatusBadge status={detail.status} />
                        <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                            {detail.category}
                        </span>
                        {detail.wardId && (
                            <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                                Ward {detail.wardId.wardNumber}
                            </span>
                        )}
                    </div>

                    <p
                        style={{
                            fontSize: font.size.sm,
                            color: color.textSecondary,
                            lineHeight: 1.6,
                            margin: 0,
                        }}
                    >
                        {detail.description}
                    </p>

                    {detail.address && (
                        <p style={{ fontSize: font.size.xs, color: color.textMuted, margin: 0 }}>
                            📍 {detail.address}
                        </p>
                    )}

                    <CitizenPinMap complaint={detail} />

                    {/* AI box */}
                    <div
                        style={{
                            background: color.bgPage,
                            borderRadius: radius.md,
                            padding: space[3],
                            border: `1px solid ${color.borderDefault}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                        }}
                    >
                        <SectionLabel>AI Assessment</SectionLabel>
                        {[
                            ['Category', detail.category],
                            ['Severity', `${detail.severity ?? '—'}/10`],
                            [
                                'Confidence',
                                detail.aiConfidence
                                    ? `${Math.round(detail.aiConfidence * 100)}%`
                                    : '—',
                            ],
                        ].map(([k, v]) => (
                            <div
                                key={k}
                                style={{ display: 'flex', justifyContent: 'space-between' }}
                            >
                                <span
                                    style={{ fontSize: font.size.xs, color: color.textSecondary }}
                                >
                                    {k}
                                </span>
                                <span
                                    style={{
                                        fontSize: font.size.xs,
                                        color: color.textPrimary,
                                        fontWeight: font.weight.medium,
                                    }}
                                >
                                    {v}
                                </span>
                            </div>
                        ))}
                        {detail.categorySource === 'manual' && (
                            <span style={{ fontSize: '0.68rem', color: '#a78bfa' }}>
                                Category was set manually
                            </span>
                        )}
                    </div>

                    {/* Duplicate notice */}
                    {detail.duplicateOf && (
                        <div
                            style={{
                                background: '#451a0311',
                                border: '1px solid #92400e44',
                                borderRadius: radius.md,
                                padding: space[3],
                                fontSize: font.size.sm,
                                color: '#fbbf24',
                            }}
                        >
                            🔁 Linked to an existing report. Consider upvoting the original.
                        </div>
                    )}

                    {/* Progress */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                        <SectionLabel>Progress</SectionLabel>
                        <StatusTimeline status={detail.status} />
                    </div>

                    {/* Upvote */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                        <SectionLabel>Community support</SectionLabel>
                        <button
                            onClick={handleVote}
                            style={{
                                border: `1px solid ${hasVoted ? color.accent : color.borderDefault}`,
                                borderRadius: radius.md,
                                fontSize: font.size.sm,
                                padding: `0.5rem ${space[4]}`,
                                cursor: 'pointer',
                                fontWeight: font.weight.medium,
                                background: hasVoted ? color.accentMuted : color.bgPage,
                                color: hasVoted ? color.accent : color.textSecondary,
                                transition: transition.fast,
                            }}
                        >
                            {hasVoted ? '▲ Upvoted' : '▲ Upvote'} · {upvotes}
                        </button>
                    </div>

                    {/* Delete */}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{
                                background: 'none',
                                border: `1px solid ${color.dangerBorder}`,
                                borderRadius: radius.md,
                                color: color.danger,
                                fontSize: font.size.xs,
                                padding: space[3],
                                cursor: 'pointer',
                            }}
                        >
                            {deleting ? 'Deleting…' : 'Delete this complaint'}
                        </button>
                    )}

                    <span
                        style={{ fontSize: '0.68rem', color: color.textMuted, textAlign: 'right' }}
                    >
                        Submitted {formatDate(detail.createdAt)}
                    </span>
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    const fetchComplaints = useCallback(
        async (p = page, st = statusFilter) => {
            try {
                const params = { page: p, limit: 10 };
                if (st) params.status = st;
                const result = await getMyComplaintsApi(params);
                setComplaints(result.complaints ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load complaints.');
            } finally {
                setLoading(false);
            }
        },
        [page, statusFilter]
    );

    useEffect(() => {
        fetchComplaints(page, statusFilter);
    }, [page, statusFilter]);
    usePolling(() => fetchComplaints(page, statusFilter), 30_000, complaints.length > 0);

    function handleTabChange(val) {
        setStatusFilter(val);
        setPage(1);
        setSelectedId(null);
    }

    function handleDrawerClose(action) {
        setSelectedId(null);
        if (action === 'deleted') fetchComplaints(page, statusFilter);
    }

    return (
        <PageShell>
            <NavBar
                left={
                    <Link
                        to="/dashboard"
                        style={{
                            fontSize: font.size.sm,
                            color: color.textSecondary,
                            textDecoration: 'none',
                        }}
                    >
                        ← Dashboard
                    </Link>
                }
                center={
                    <span
                        style={{
                            fontSize: font.size.base,
                            fontWeight: font.weight.semibold,
                            color: color.textPrimary,
                        }}
                    >
                        My Reports
                    </span>
                }
                right={
                    <>
                        <NotificationBell />
                        <NavLinkAccent to="/report">+ New</NavLinkAccent>
                    </>
                }
            />

            <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
                {/* List panel */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Status tabs */}
                    <div
                        style={{
                            display: 'flex',
                            borderBottom: `1px solid ${color.borderFaint}`,
                            padding: `0 ${space[5]}`,
                            overflowX: 'auto',
                        }}
                    >
                        {STATUS_TABS.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => handleTabChange(t.value)}
                                style={{
                                    padding: `${space[3]} ${space[3]}`,
                                    fontSize: font.size.xs,
                                    fontWeight: font.weight.medium,
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: 'transparent',
                                    color:
                                        statusFilter === t.value
                                            ? color.textPrimary
                                            : color.textMuted,
                                    borderBottom: `2px solid ${statusFilter === t.value ? color.accent : 'transparent'}`,
                                    whiteSpace: 'nowrap',
                                    transition: transition.fast,
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {!loading && (
                        <p
                            style={{
                                fontSize: font.size.xs,
                                color: color.textMuted,
                                padding: `${space[2]} ${space[5]} 0`,
                                margin: 0,
                            }}
                        >
                            {total} report{total !== 1 ? 's' : ''}
                        </p>
                    )}

                    {error && (
                        <div style={{ margin: `${space[3]} ${space[5]}` }}>
                            <ErrorBanner message={error} />
                        </div>
                    )}

                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: `${space[3]} ${space[5]}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: space[2],
                        }}
                    >
                        {loading && <Skeleton height="68px" count={4} />}

                        {!loading && complaints.length === 0 && (
                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: space[3],
                                    padding: space[12],
                                }}
                            >
                                <p
                                    style={{
                                        color: color.textMuted,
                                        fontSize: font.size.base,
                                        margin: 0,
                                    }}
                                >
                                    No complaints found.
                                </p>
                                <Link
                                    to="/report"
                                    style={{
                                        color: color.accent,
                                        textDecoration: 'none',
                                        fontSize: font.size.sm,
                                    }}
                                >
                                    Submit your first report →
                                </Link>
                            </div>
                        )}

                        {!loading &&
                            complaints.map((c) => (
                                <ComplaintRow
                                    key={c._id}
                                    complaint={c}
                                    isSelected={selectedId === c._id}
                                    onClick={() =>
                                        setSelectedId(selectedId === c._id ? null : c._id)
                                    }
                                />
                            ))}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPrev={() => setPage((p) => p - 1)}
                        onNext={() => setPage((p) => p + 1)}
                        style={{ padding: space[4], borderTop: `1px solid ${color.borderFaint}` }}
                    />
                </div>

                {/* Detail drawer */}
                {selectedId && (
                    <DetailDrawer
                        key={selectedId}
                        complaintId={selectedId}
                        onClose={handleDrawerClose}
                    />
                )}
            </div>
        </PageShell>
    );
}
