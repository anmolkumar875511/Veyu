// src/pages/admin/WardManagement.jsx
// Uses getUserDirectoryApi for real officer dropdown (replaces raw ID input).

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
import { getUserDirectoryApi } from '../../api/user.api.js';
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
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { NerveMapView } from '../../components/shared/NerveMapView.jsx';
import { color, font, space, radius } from '../../theme/index.js';

const EMPTY_FORM = { name: '', wardNumber: '', city: '' };

function WardRow({ ward, onAssignClick }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[4],
                flexWrap: 'wrap',
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: `${space[4]} ${space[5]}`,
            }}
        >
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <StressBand band={ward.stressBand} />
                <span style={{ fontSize: '0.68rem', color: color.textMuted }}>
                    Health {ward.healthScore}/100
                </span>
            </div>
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
                        No officer
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

function CreateWardForm({ onCreated }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState(null);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
                        placeholder="Ward name"
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
                <BtnPrimary type="submit" loading={creating} loadingText="Creating…">
                    Create Ward
                </BtnPrimary>
            </form>
        </Card>
    );
}

export default function WardManagement() {
    const user = useCurrentUser();
    const logout = useLogout();

    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [assignTarget, setAssignTarget] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [officersLoading, setOfficersLoading] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState('');
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

    async function openAssignModal(ward) {
        setAssignTarget(ward);
        setSelectedOfficer('');
        setAssignErr(null);
        setOfficersLoading(true);
        try {
            const data = await getUserDirectoryApi('officer');
            setOfficers(data.users ?? []);
        } catch {
            setAssignErr('Could not load officers.');
        } finally {
            setOfficersLoading(false);
        }
    }

    async function handleAssign() {
        if (!selectedOfficer) {
            setAssignErr('Select an officer.');
            return;
        }
        setAssigning(true);
        setAssignErr(null);
        try {
            await assignOfficerApi(assignTarget._id, selectedOfficer);
            setAssignTarget(null);
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
                        <NavLink to="/admin/users">Users</NavLink>
                        <NotificationBell />
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
                        🔄 Recompute Stats
                    </ToolBtn>
                    {recomputeMsg && <SuccessMsg message={recomputeMsg} />}
                </div>

                {showCreate && (
                    <CreateWardForm
                        onCreated={() => {
                            setShowCreate(false);
                            fetchWards();
                        }}
                    />
                )}

                {/* Ward overview map — shows all wards plotted by stress band */}
                {!loading && wards.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                        <span
                            style={{
                                fontSize: font.size.sm,
                                fontWeight: font.weight.semibold,
                                color: color.textSecondary,
                            }}
                        >
                            Ward coverage map
                        </span>
                        <NerveMapView wards={wards} height="320px" />
                    </div>
                )}

                <ErrorBanner message={error} />

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
                        No wards yet.
                    </p>
                )}

                {!loading && wards.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                        {wards.map((w) => (
                            <WardRow key={w._id} ward={w} onAssignClick={openAssignModal} />
                        ))}
                    </div>
                )}
            </main>

            {/* Officer assign modal — uses real directory dropdown */}
            {assignTarget && (
                <Modal
                    title={`Assign Officer — ${assignTarget.name}`}
                    onClose={() => {
                        setAssignTarget(null);
                        setAssignErr(null);
                    }}
                >
                    <ErrorBanner message={assignErr} />
                    {officersLoading ? (
                        <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                            Loading officers…
                        </p>
                    ) : officers.length === 0 ? (
                        <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                            No officers found. Create one at <strong>/admin/staff</strong>.
                        </p>
                    ) : (
                        <select
                            value={selectedOfficer}
                            onChange={(e) => setSelectedOfficer(e.target.value)}
                            style={{
                                background: color.bgPage,
                                border: `1px solid ${color.borderDefault}`,
                                borderRadius: radius.md,
                                color: color.textPrimary,
                                fontSize: font.size.sm,
                                padding: '0.6rem 0.75rem',
                                width: '100%',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="">Select an officer…</option>
                            {officers.map((o) => (
                                <option key={o._id} value={o._id}>
                                    {o.name}{' '}
                                    {o.assignedWard
                                        ? `(Ward ${o.assignedWard.wardNumber})`
                                        : '(unassigned)'}
                                </option>
                            ))}
                        </select>
                    )}
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
