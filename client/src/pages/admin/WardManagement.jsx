// src/pages/admin/WardManagement.jsx
// Uses getUserDirectoryApi for real officer dropdown (replaces raw ID input).

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, User, X } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
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
    NavPageTitle,
    NavUser,
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

const EMPTY_FORM = { name: '', wardNumber: '', city: '' };

function WardRow({ ward, onAssignClick }) {
    return (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
            <div className="flex min-w-[140px] flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{ward.name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                    Ward {ward.wardNumber} · {ward.city}
                </span>
            </div>
            <div className="flex flex-col gap-1">
                <StressBand band={ward.stressBand} />
                <span className="text-[0.68rem] text-slate-400 dark:text-slate-500">Health {ward.healthScore}/100</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
                {ward.officerId ? (
                    <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <User className="size-3.5" /> {ward.officerId.name}
                    </span>
                ) : (
                    <span className="text-sm italic text-slate-400 dark:text-slate-500">No officer</span>
                )}
                <button
                    onClick={() => onAssignClick(ward)}
                    className="rounded-md border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
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
            <span className="text-sm font-semibold text-slate-900 dark:text-white">New Ward</span>
            <ErrorBanner message={err} />
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                    <Input value={form.name} onChange={set('name')} placeholder="Ward name" required />
                    <Input
                        value={form.wardNumber}
                        onChange={set('wardNumber')}
                        placeholder="Ward #"
                        type="number"
                        required
                        className="max-w-[100px] flex-none"
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
    }, [fetchWards]);

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
            setRecomputeMsg(`${label} recomputed for ${data.updated} wards.`);
            fetchWards();
        } catch {
            setRecomputeMsg('Recompute failed.');
        } finally {
            setRecomputing(false);
        }
    }

    return (
        <PageShell sidebar>
            <NavBar
                withToggle
                left={<NavPageTitle>Ward Management</NavPageTitle>}
                right={
                    <>
                        <NotificationBell />
                        <NavUser name={user?.name} />
                    </>
                }
            />
            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 pb-16 sm:px-6 xl:px-10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">Wards</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{loading ? 'Loading…' : `${wards.length} active ward${wards.length !== 1 ? 's' : ''}`}</p>
                    </div>
                    <BtnPrimary onClick={() => setShowCreate((v) => !v)}>
                        <span className="flex items-center gap-1.5">
                            {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
                            {showCreate ? 'Cancel' : 'New Ward'}
                        </span>
                    </BtnPrimary>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <ToolBtn onClick={() => handleRecompute(recomputeAllPulseApi, 'PulseGrid')} disabled={recomputing}>
                        <span className="flex items-center gap-1.5">
                            <RefreshCw className="size-3.5" /> Recompute PulseGrid
                        </span>
                    </ToolBtn>
                    <ToolBtn onClick={() => handleRecompute(recomputeAllStatsApi, 'Stats')} disabled={recomputing}>
                        <span className="flex items-center gap-1.5">
                            <RefreshCw className="size-3.5" /> Recompute Stats
                        </span>
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
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ward coverage map</span>
                        <NerveMapView wards={wards} height="320px" />
                    </div>
                )}

                <ErrorBanner message={error} />

                {loading && <SkeletonRows count={3} height="76px" />}

                {!loading && wards.length === 0 && <p className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">No wards yet.</p>}

                {!loading && wards.length > 0 && (
                    <div className="flex flex-col gap-2">
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
                        <p className="text-sm text-slate-400 dark:text-slate-500">Loading officers…</p>
                    ) : officers.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            No officers found. Create one at <strong>/admin/staff</strong>.
                        </p>
                    ) : (
                        <select
                            value={selectedOfficer}
                            onChange={(e) => setSelectedOfficer(e.target.value)}
                            className="w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        >
                            <option value="">Select an officer…</option>
                            {officers.map((o) => (
                                <option key={o._id} value={o._id}>
                                    {o.name} {o.assignedWard ? `(Ward ${o.assignedWard.wardNumber})` : '(unassigned)'}
                                </option>
                            ))}
                        </select>
                    )}
                    <div className="flex gap-3">
                        <BtnPrimary onClick={handleAssign} loading={assigning} loadingText="Assigning…">
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
