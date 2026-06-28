// src/AppRouter.jsx — complete route tree for Veyu. Every backend route has a frontend page.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from './guards/RouteGuards.jsx';
import { lazy, Suspense } from 'react';

// ── Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const UnauthorizedPage = lazy(() => import('./pages/auth/UnauthorizedPage.jsx'));
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage.jsx'));

// ── Citizen
const CitizenDashboard = lazy(() => import('./pages/citizen/Dashboard.jsx'));
const SubmitComplaint = lazy(() => import('./pages/citizen/SubmitComplaint.jsx'));
const MyComplaints = lazy(() => import('./pages/citizen/MyComplaints.jsx'));

// ── Officer / Admin
const OfficerWarRoom = lazy(() => import('./pages/officer/WarRoom.jsx'));
const OfficerComplaintDetail = lazy(() => import('./pages/officer/ComplaintDetail.jsx'));
const OfficerReports = lazy(() => import('./pages/officer/Reports.jsx'));
const OfficerForecasts = lazy(() => import('./pages/officer/Forecasts.jsx'));

// ── Field Worker
const WorkerTasks = lazy(() => import('./pages/worker/Tasks.jsx'));
const WorkerTaskDetail = lazy(() => import('./pages/worker/TaskDetail.jsx'));
const WorkerObservations = lazy(() => import('./pages/worker/Observations.jsx'));

// ── Public
const PublicNerveMap = lazy(() => import('./pages/public/NerveMap.jsx'));

// ── Admin
const WardManagement = lazy(() => import('./pages/admin/WardManagement.jsx'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement.jsx'));
const CreateStaffPage = lazy(() => import('./pages/admin/CreateStaffPage.jsx'));

function PageFallback() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#09111f',
                color: '#6e93b8',
                fontFamily: "'Inter', system-ui, sans-serif",
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
                        {/* ── Public ──────────────────────────────────────── */}
                        <Route path="/map" element={<PublicNerveMap />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        {/* ── Auth (redirect if logged in) ─────────────────── */}
                        <Route element={<PublicOnlyRoute />}>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                        </Route>

                        {/* ── All authenticated roles — profile + password ──── */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/profile" element={<ProfilePage />} />
                        </Route>

                        {/* ── Citizen ─────────────────────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route
                                element={<RoleRoute roles={['citizen']} redirectTo="/war-room" />}
                            >
                                <Route path="/dashboard" element={<CitizenDashboard />} />
                                <Route path="/report" element={<SubmitComplaint />} />
                                <Route path="/my-reports" element={<MyComplaints />} />
                            </Route>
                        </Route>

                        {/* ── Officer / Admin ──────────────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RoleRoute roles={['officer', 'admin']} />}>
                                <Route path="/war-room" element={<OfficerWarRoom />} />
                                <Route path="/war-room/:id" element={<OfficerComplaintDetail />} />
                                <Route path="/reports" element={<OfficerReports />} />
                                <Route path="/forecasts" element={<OfficerForecasts />} />
                            </Route>
                        </Route>

                        {/* ── Admin only ───────────────────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RoleRoute roles={['admin']} />}>
                                <Route path="/admin/wards" element={<WardManagement />} />
                                <Route path="/admin/users" element={<UserManagement />} />
                                <Route path="/admin/staff" element={<CreateStaffPage />} />
                            </Route>
                        </Route>

                        {/* ── Field Worker ────────────────────────────────── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RoleRoute roles={['worker']} />}>
                                <Route path="/tasks" element={<WorkerTasks />} />
                                <Route path="/tasks/:id" element={<WorkerTaskDetail />} />
                                <Route path="/observations" element={<WorkerObservations />} />
                            </Route>
                        </Route>

                        {/* ── Fallbacks ─────────────────────────────────────── */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}
