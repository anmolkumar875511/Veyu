// ─────────────────────────────────────────────────────────────────────────────
// src/AppRouter.jsx
// Complete route tree — single source of truth for all routes in Nagarik.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from './guards/RouteGuards.jsx';
import { lazy, Suspense } from 'react';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const UnauthorizedPage = lazy(() => import('./pages/auth/UnauthorizedPage.jsx'));

// Citizen
const CitizenDashboard = lazy(() => import('./pages/citizen/Dashboard.jsx'));
const SubmitComplaint = lazy(() => import('./pages/citizen/SubmitComplaint.jsx'));
const MyComplaints = lazy(() => import('./pages/citizen/MyComplaints.jsx'));

// Officer / Admin
const OfficerWarRoom = lazy(() => import('./pages/officer/WarRoom.jsx'));
const OfficerComplaintDetail = lazy(() => import('./pages/officer/ComplaintDetail.jsx'));
const OfficerReports = lazy(() => import('./pages/officer/Reports.jsx'));

// Field Worker
const WorkerTasks = lazy(() => import('./pages/worker/Tasks.jsx'));
const WorkerTaskDetail = lazy(() => import('./pages/worker/TaskDetail.jsx'));
const WorkerObservations = lazy(() => import('./pages/worker/Observations.jsx'));

// Public
// const PublicNerveMap   = lazy(() => import("./pages/public/NerveMap.jsx"));

function PageFallback() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0f172a',
                color: '#94a3b8',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '0.875rem',
            }}
        >
            Loading…
        </div>
    );
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<PageFallback />}>
                    <Routes>
                        {/* ── Public (no login required) ───────────────────────────── */}
                        {/*<Route path="/map"          element={<PublicNerveMap />} /> */}
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        {/* ── Auth pages (redirect if already logged in) ────────────── */}
                        <Route element={<PublicOnlyRoute />}>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                        </Route>

                        {/* ── Citizen ──────────────────────────────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route
                                element={<RoleRoute roles={['citizen']} redirectTo="/war-room" />}
                            >
                                <Route path="/dashboard" element={<CitizenDashboard />} />
                                <Route path="/report" element={<SubmitComplaint />} />
                                <Route path="/my-reports" element={<MyComplaints />} />
                            </Route>
                        </Route>

                        {/* ── Officer / Admin ───────────────────────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RoleRoute roles={['officer', 'admin']} />}>
                                <Route path="/war-room" element={<OfficerWarRoom />} />
                                <Route path="/war-room/:id" element={<OfficerComplaintDetail />} />
                                <Route path="/reports" element={<OfficerReports />} />
                            </Route>
                        </Route>

                        {/* ── Field Worker ──────────────────────────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RoleRoute roles={['worker']} />}>
                                <Route path="/tasks" element={<WorkerTasks />} />
                                <Route path="/tasks/:id" element={<WorkerTaskDetail />} />
                                <Route path="/observations" element={<WorkerObservations />} />
                            </Route>
                        </Route>

                        {/* ── Fallbacks ─────────────────────────────────────────────── */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}
