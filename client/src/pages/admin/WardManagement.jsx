// ─────────────────────────────────────────────────────────────────────────────
// src/pages/admin/WardManagement.jsx
//
// Admin-only ward management. Create wards, assign officers,
// manually trigger PulseGrid / stats recompute (normally cron-driven).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import {
    listWardsApi,
    createWardApi,
    assignOfficerApi,
    recomputeAllPulseApi,
    recomputeAllStatsApi,
    parseWardError,
} from '../../api/ward.api.js';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';

const EMPTY_FORM = { name: '', wardNumber: '', city: '' };

function WardRow({ ward, onAssignClick }) {
    const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
    return (
        <div style={s.row}>
            <div style={s.rowMain}>
                <span style={s.rowName}>{ward.name}</span>
                <span style={s.rowMeta}>
                    Ward {ward.wardNumber} · {ward.city}
                </span>
            </div>
            <div style={s.rowMid}>
                <span style={{ ...s.bandTag, color: meta.color, background: `${meta.color}1a` }}>
                    {meta.label}
                </span>
                <span style={s.healthScore}>Health {ward.healthScore}</span>
            </div>
            <div style={s.rowOfficer}>
                {ward.officerId ? (
                    <span style={s.officerAssigned}>👤 {ward.officerId.name}</span>
                ) : (
                    <span style={s.officerNone}>No officer assigned</span>
                )}
                <button onClick={() => onAssignClick(ward)} style={s.assignBtn}>
                    {ward.officerId ? 'Reassign' : 'Assign'}
                </button>
            </div>
        </div>
    );
}

export default function WardManagement() {
    const user = useCurrentUser();
    const logout = useLogout();

    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [createErr, setCreateErr] = useState(null);

    const [assignTarget, setAssignTarget] = useState(null); // ward being assigned
    const [officerIdInput, setOfficerIdInput] = useState('');
    const [assignErr, setAssignErr] = useState(null);
    const [assigning, setAssigning] = useState(false);

    const [recomputing, setRecomputing] = useState(false);
    const [recomputeMsg, setRecomputeMsg] = useState(null);

    const fetchWards = useCallback(async () => {
        try {
            const data = await listWardsApi({ isActive: 'true' });
            setWards(data.wards ?? []);
            setError(null);
        } catch {
            setError('Could not load wards.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWards();
    }, []);

    async function handleCreate(e) {
        e.preventDefault();
        setCreateErr(null);
        setCreating(true);
        try {
            await createWardApi({
                name: form.name.trim(),
                wardNumber: parseInt(form.wardNumber, 10),
                city: form.city.trim(),
            });
            setForm(EMPTY_FORM);
            setShowCreate(false);
            fetchWards();
        } catch (err) {
            setCreateErr(parseWardError(err));
        } finally {
            setCreating(false);
        }
    }

    async function handleAssign() {
        if (!officerIdInput.trim()) {
            setAssignErr('Enter an officer ID.');
            return;
        }
        setAssigning(true);
        setAssignErr(null);
        try {
            await assignOfficerApi(assignTarget._id, officerIdInput.trim());
            setAssignTarget(null);
            setOfficerIdInput('');
            fetchWards();
        } catch (err) {
            setAssignErr(parseWardError(err));
        } finally {
            setAssigning(false);
        }
    }

    async function handleRecomputePulse() {
        setRecomputing(true);
        setRecomputeMsg(null);
        try {
            const data = await recomputeAllPulseApi();
            setRecomputeMsg(`✓ PulseGrid recomputed for ${data.updated} wards.`);
            fetchWards();
        } catch {
            setRecomputeMsg('✗ Recompute failed.');
        } finally {
            setRecomputing(false);
        }
    }

    async function handleRecomputeStats() {
        setRecomputing(true);
        setRecomputeMsg(null);
        try {
            const data = await recomputeAllStatsApi();
            setRecomputeMsg(`✓ Stats recomputed for ${data.updated} wards.`);
            fetchWards();
        } catch {
            setRecomputeMsg('✗ Recompute failed.');
        } finally {
            setRecomputing(false);
        }
    }

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <div style={s.navBrand}>
                    <span style={s.brandDot} />
                    <span style={s.brandName}>Nagarik</span>
                    <span style={s.navDivider}>·</span>
                    <span style={s.navRole}>Ward Management</span>
                </div>
                <div style={s.navRight}>
                    <Link to="/war-room" style={s.navLink}>
                        War Room
                    </Link>
                    <span style={s.navUser}>{user?.name}</span>
                    <button onClick={logout} style={s.navLogout}>
                        Sign out
                    </button>
                </div>
            </header>

            <main style={s.main}>
                <div style={s.headerRow}>
                    <div>
                        <h1 style={s.heading}>Wards</h1>
                        <p style={s.subheading}>
                            {loading ? 'Loading…' : `${wards.length} active wards`}
                        </p>
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)} style={s.btnPrimary}>
                        + New Ward
                    </button>
                </div>

                {/* ── Recompute controls ────────────────────────────────────────── */}
                <div style={s.toolbar}>
                    <button onClick={handleRecomputePulse} disabled={recomputing} style={s.toolBtn}>
                        🔄 Recompute PulseGrid
                    </button>
                    <button onClick={handleRecomputeStats} disabled={recomputing} style={s.toolBtn}>
                        🔄 Recompute All Stats
                    </button>
                    {recomputeMsg && <span style={s.recomputeMsg}>{recomputeMsg}</span>}
                </div>

                {/* ── Create form ───────────────────────────────────────────────── */}
                {showCreate && (
                    <form onSubmit={handleCreate} style={s.createForm}>
                        {createErr && <div style={s.errorBanner}>{createErr}</div>}
                        <div style={s.formRow}>
                            <input
                                type="text"
                                placeholder="Ward name (e.g. Civil Lines)"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                style={s.input}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Ward #"
                                value={form.wardNumber}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, wardNumber: e.target.value }))
                                }
                                style={{ ...s.input, maxWidth: '100px' }}
                                required
                            />
                            <input
                                type="text"
                                placeholder="City"
                                value={form.city}
                                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                                style={s.input}
                                required
                            />
                        </div>
                        <button type="submit" disabled={creating} style={s.btnPrimary}>
                            {creating ? 'Creating…' : 'Create Ward'}
                        </button>
                    </form>
                )}

                {error && <div style={s.errorBanner}>{error}</div>}

                {/* ── Ward list ─────────────────────────────────────────────────── */}
                {loading ? (
                    <div style={s.skeletonList}>
                        {[0, 1, 2].map((i) => (
                            <div key={i} style={s.skeleton} />
                        ))}
                    </div>
                ) : (
                    <div style={s.list}>
                        {wards.map((w) => (
                            <WardRow key={w._id} ward={w} onAssignClick={setAssignTarget} />
                        ))}
                    </div>
                )}

                {/* ── Assign officer modal (inline panel) ──────────────────────── */}
                {assignTarget && (
                    <div style={s.modalOverlay} onClick={() => setAssignTarget(null)}>
                        <div style={s.modal} onClick={(e) => e.stopPropagation()}>
                            <h3 style={s.modalTitle}>Assign Officer — {assignTarget.name}</h3>
                            {assignErr && <div style={s.errorBanner}>{assignErr}</div>}
                            <input
                                type="text"
                                placeholder="Officer user ID"
                                value={officerIdInput}
                                onChange={(e) => setOfficerIdInput(e.target.value)}
                                style={s.input}
                            />
                            <p style={s.modalHint}>
                                Paste the officer's MongoDB user ID. (A searchable picker can
                                replace this once a user directory endpoint exists.)
                            </p>
                            <div style={s.modalActions}>
                                <button
                                    onClick={handleAssign}
                                    disabled={assigning}
                                    style={s.btnPrimary}
                                >
                                    {assigning ? 'Assigning…' : 'Confirm'}
                                </button>
                                <button onClick={() => setAssignTarget(null)} style={s.btnGhost}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
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
    navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    navLink: { fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'none' },
    navUser: { fontSize: '0.8rem', color: '#475569' },
    navLogout: {
        background: 'none',
        border: '1px solid #334155',
        borderRadius: '0.375rem',
        color: '#94a3b8',
        fontSize: '0.78rem',
        padding: '0.3rem 0.7rem',
        cursor: 'pointer',
    },

    main: {
        maxWidth: '780px',
        margin: '0 auto',
        padding: '1.75rem 1.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    heading: { fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem 0' },
    subheading: { fontSize: '0.82rem', color: '#64748b', margin: 0 },
    btnPrimary: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#0f172a',
        fontSize: '0.82rem',
        fontWeight: 700,
        padding: '0.55rem 1rem',
        cursor: 'pointer',
    },
    btnGhost: {
        background: 'none',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#64748b',
        fontSize: '0.8rem',
        padding: '0.55rem 1rem',
        cursor: 'pointer',
    },

    toolbar: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
    toolBtn: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#94a3b8',
        fontSize: '0.78rem',
        padding: '0.5rem 0.875rem',
        cursor: 'pointer',
    },
    recomputeMsg: { fontSize: '0.78rem', color: '#22c55e' },

    createForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '1.1rem',
    },
    formRow: { display: 'flex', gap: '0.625rem', flexWrap: 'wrap' },
    input: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.84rem',
        padding: '0.6rem 0.8rem',
        outline: 'none',
        flex: 1,
        minWidth: '140px',
    },

    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.82rem',
        padding: '0.7rem 0.875rem',
    },

    skeletonList: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
    skeleton: {
        height: '70px',
        background: '#1e293b',
        borderRadius: '0.75rem',
        border: '1px solid #334155',
    },

    list: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.875rem',
        padding: '1rem 1.1rem',
        flexWrap: 'wrap',
    },
    rowMain: { display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: '140px' },
    rowName: { fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' },
    rowMeta: { fontSize: '0.72rem', color: '#475569' },
    rowMid: { display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' },
    bandTag: {
        fontSize: '0.65rem',
        fontWeight: 700,
        padding: '0.18rem 0.55rem',
        borderRadius: '9999px',
    },
    healthScore: { fontSize: '0.7rem', color: '#475569' },
    rowOfficer: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' },
    officerAssigned: { fontSize: '0.78rem', color: '#94a3b8' },
    officerNone: { fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' },
    assignBtn: {
        background: 'none',
        border: '1px solid #334155',
        borderRadius: '0.4rem',
        color: '#22d3ee',
        fontSize: '0.74rem',
        padding: '0.35rem 0.7rem',
        cursor: 'pointer',
    },

    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
    },
    modal: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '1rem',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
    },
    modalTitle: { fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 },
    modalHint: { fontSize: '0.72rem', color: '#475569', margin: 0, lineHeight: 1.5 },
    modalActions: { display: 'flex', gap: '0.625rem' },
};
