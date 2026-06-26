// src/pages/admin/WardManagement.jsx

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import {
    listWardsApi,
    createWardApi,
    assignOfficerApi,
    recomputeAllPulseApi,
    recomputeAllStatsApi,
    parseWardError,
} from '../../api/ward.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavLink,
    NavUser,
    NavLogout,
    StressBand,
    ErrorBanner,
    SuccessMsg,
    SkeletonRows,
    Input,
    BtnPrimary,
    BtnGhost,
    ToolBtn,
    Card,
    Modal,
} from '../../components/admin/AdminShell.jsx';
import { color, font, space, radius } from '../../theme/index.js';

const EMPTY_FORM = { name: '', wardNumber: '', city: '' };

// ── Ward row ──────────────────────────────────────────────────────────────────
function WardRow({ ward, onAssignClick }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[4],
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: `${space[4]} ${space[5]}`,
                flexWrap: 'wrap',
            }}
        >
            {/* Name + meta */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                    minWidth: '140px',
                }}
            >
                <span
                    style={{
                        fontSize: font.size.base,
                        fontWeight: font.weight.semibold,
                        color: color.textPrimary,
                    }}
                >
                    {ward.name}
                </span>
                <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                    Ward {ward.wardNumber} · {ward.city}
                </span>
            </div>

            {/* Stress + health */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <StressBand band={ward.stressBand} />
                <span style={{ fontSize: '0.68rem', color: color.textMuted }}>
                    Health {ward.healthScore}/100
                </span>
            </div>

            {/* Officer + assign */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: space[3], marginLeft: 'auto' }}
            >
                {ward.officerId ? (
                    <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>
                        👤 {ward.officerId.name}
                    </span>
                ) : (
                    <span
                        style={{
                            fontSize: font.size.sm,
                            color: color.textMuted,
                            fontStyle: 'italic',
                        }}
                    >
                        No officer assigned
                    </span>
                )}
                <button
                    onClick={() => onAssignClick(ward)}
                    style={{
                        background: 'none',
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.sm,
                        color: color.accent,
                        fontSize: font.size.xs,
                        padding: `0.3rem 0.65rem`,
                        cursor: 'pointer',
                    }}
                >
                    {ward.officerId ? 'Reassign' : 'Assign'}
                </button>
            </div>
        </div>
    );
}

// ── Create ward form ──────────────────────────────────────────────────────────
function CreateWardForm({ onCreated }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setErr(null);
        setCreating(true);
        try {
            await createWardApi({
                name: form.name.trim(),
                wardNumber: parseInt(form.wardNumber, 10),
                city: form.city.trim(),
            });
            setForm(EMPTY_FORM);
            onCreated();
        } catch (e) {
            setErr(parseWardError(e));
        } finally {
            setCreating(false);
        }
    }

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    return (
        <Card>
            <span
                style={{
                    fontSize: font.size.sm,
                    fontWeight: font.weight.semibold,
                    color: color.textPrimary,
                }}
            >
                New Ward
            </span>
            <ErrorBanner message={err} />
            <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}
            >
                <div style={{ display: 'flex', gap: space[3], flexWrap: 'wrap' }}>
                    <Input
                        value={form.name}
                        onChange={set('name')}
                        placeholder="Ward name (e.g. Civil Lines)"
                        required
                    />
                    <Input
                        value={form.wardNumber}
                        onChange={set('wardNumber')}
                        placeholder="Ward #"
                        type="number"
                        required
                        style={{ maxWidth: '100px', flex: 'none' }}
                    />
                    <Input value={form.city} onChange={set('city')} placeholder="City" required />
                </div>
                <div style={{ display: 'flex', gap: space[3] }}>
                    <BtnPrimary type="submit" loading={creating} loadingText="Creating…">
                        Create Ward
                    </BtnPrimary>
                </div>
            </form>
        </Card>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WardManagement() {
    const user = useCurrentUser();
    const logout = useLogout();

    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [assignTarget, setAssignTarget] = useState(null);
    const [officerInput, setOfficerInput] = useState('');
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

    async function handleAssign() {
        if (!officerInput.trim()) {
            setAssignErr('Enter an officer ID.');
            return;
        }
        setAssigning(true);
        setAssignErr(null);
        try {
            await assignOfficerApi(assignTarget._id, officerInput.trim());
            setAssignTarget(null);
            setOfficerInput('');
            fetchWards();
        } catch (e) {
            setAssignErr(parseWardError(e));
        } finally {
            setAssigning(false);
        }
    }

    async function handleRecompute(fn, label) {
        setRecomputing(true);
        setRecomputeMsg(null);
        try {
            const data = await fn();
            setRecomputeMsg(`✓ ${label} recomputed for ${data.updated} wards.`);
            fetchWards();
        } catch {
            setRecomputeMsg(`✗ Recompute failed.`);
        } finally {
            setRecomputing(false);
        }
    }

    return (
        <PageShell>
            <NavBar
                left={<NavBrand sub="Ward Management" />}
                right={
                    <>
                        <NavLink to="/war-room">War Room</NavLink>
                        <NavUser name={user?.name} />
                        <NavLogout onClick={logout} />
                    </>
                }
            />

            <main
                style={{
                    maxWidth: '800px',
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
                            Wards
                        </h1>
                        <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                            {loading
                                ? 'Loading…'
                                : `${wards.length} active ward${wards.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <BtnPrimary onClick={() => setShowCreate((v) => !v)}>
                        {showCreate ? '✕ Cancel' : '+ New Ward'}
                    </BtnPrimary>
                </div>

                {/* Recompute toolbar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: space[3],
                        flexWrap: 'wrap',
                    }}
                >
                    <ToolBtn
                        onClick={() => handleRecompute(recomputeAllPulseApi, 'PulseGrid')}
                        disabled={recomputing}
                    >
                        🔄 Recompute PulseGrid
                    </ToolBtn>
                    <ToolBtn
                        onClick={() => handleRecompute(recomputeAllStatsApi, 'Stats')}
                        disabled={recomputing}
                    >
                        🔄 Recompute All Stats
                    </ToolBtn>
                    <SuccessMsg message={recomputeMsg} />
                </div>

                {/* Create form */}
                {showCreate && (
                    <CreateWardForm
                        onCreated={() => {
                            setShowCreate(false);
                            fetchWards();
                        }}
                    />
                )}

                <ErrorBanner message={error} />

                {/* Ward list */}
                {loading && <SkeletonRows count={3} height="76px" />}

                {!loading && wards.length === 0 && (
                    <p
                        style={{
                            fontSize: font.size.sm,
                            color: color.textMuted,
                            textAlign: 'center',
                            padding: space[8],
                        }}
                    >
                        No wards yet. Create the first one above.
                    </p>
                )}

                {!loading && wards.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                        {wards.map((w) => (
                            <WardRow key={w._id} ward={w} onAssignClick={setAssignTarget} />
                        ))}
                    </div>
                )}
            </main>

            {/* Assign officer modal */}
            {assignTarget && (
                <Modal
                    title={`Assign Officer — ${assignTarget.name}`}
                    onClose={() => {
                        setAssignTarget(null);
                        setOfficerInput('');
                        setAssignErr(null);
                    }}
                >
                    <ErrorBanner message={assignErr} />
                    <Input
                        value={officerInput}
                        onChange={(e) => setOfficerInput(e.target.value)}
                        placeholder="Officer user ID (MongoDB ObjectId)"
                    />
                    <p
                        style={{
                            fontSize: font.size.xs,
                            color: color.textMuted,
                            margin: 0,
                            lineHeight: 1.6,
                        }}
                    >
                        Paste the officer's MongoDB user ID. A searchable dropdown will replace this
                        once a user directory endpoint is added.
                    </p>
                    <div style={{ display: 'flex', gap: space[3] }}>
                        <BtnPrimary
                            onClick={handleAssign}
                            loading={assigning}
                            loadingText="Assigning…"
                        >
                            Confirm
                        </BtnPrimary>
                        <BtnGhost
                            onClick={() => {
                                setAssignTarget(null);
                                setOfficerInput('');
                                setAssignErr(null);
                            }}
                        >
                            Cancel
                        </BtnGhost>
                    </div>
                </Modal>
            )}
        </PageShell>
    );
}
