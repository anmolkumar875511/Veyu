# Veyu — Civic Intelligence Platform

### A full-stack, AI-assisted civic complaint management system for Indian municipalities

**Built by:** Anmol Kumar Shaharwal

---

## 1. What Veyu Is

Veyu turns scattered citizen complaints — potholes, water leakage, garbage, streetlight failures — into a structured, AI-assisted resolution pipeline. It's a four-role platform (Citizen, Officer, Field Worker, Admin) where every complaint is tracked end-to-end: submission → AI classification → officer triage → worker dispatch → resolution.

What sets it apart from a generic ticketing system is three predictive/proactive layers sitting on top of the core pipeline:

| System | What it does |
|---|---|
| **PulseGrid** | Measures complaint velocity per ward over rolling 48-hour windows and classifies each ward into a stress band — **Calm → Stable → Rising → Critical → Emergency** — so officers can see which areas are heating up *before* the queue overflows. |
| **SilentSignal** | Predictive forecasting. Cross-references seasonal complaint history with live weather data to warn officers about issues (drainage, sewage, potholes) that have historically spiked in similar conditions — before a single citizen has reported one. |
| **FieldMesh** | Proactive sensing by field workers. Workers photograph deteriorating infrastructure they notice on the ground (not tied to an existing complaint). AI scores confidence in the observation; high-confidence ones auto-elevate into real complaints, low-confidence ones go to an officer review queue. |

---

## 2. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT — access + refresh tokens, httpOnly cookies |
| Image storage | Cloudinary (via multer-storage-cloudinary) |
| AI | Google Gemini 2.0 Flash Lite |
| Rate limiting | express-rate-limit |
| Validation | express-validator |
| Scheduling | node-cron (PulseGrid recompute, SilentSignal daily forecast) |
| Weather data | OpenWeather API (SilentSignal correlation) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 |
| Routing | React Router DOM v7 (lazy-loaded routes + Suspense) |
| HTTP client | Axios with a silent token-refresh interceptor |
| Build tool | Vite |
| Styling | Inline styles via a centralized theme system (`theme/index.js`) — no CSS files, no magic strings |
| State | `useReducer` for auth, `useState` for page-level state |
| Real-time-ish updates | Custom `usePolling` hook — visibility-aware, pauses when the tab is hidden (free-tier friendly, no WebSockets) |

### Deployment
Both frontend and backend deploy to **Vercel** as separate projects — the client as a static Vite build, the server as serverless functions (`api/index.js` wraps the Express app), with a cron job for daily SilentSignal forecasting.

---

## 3. The Four Roles

| Role | Core routes | What they can do |
|---|---|---|
| **Citizen** | `/dashboard`, `/report`, `/my-reports`, `/profile` | Submit complaints with photo + GPS, upvote others' reports, track resolution status, edit profile |
| **Officer** | `/war-room`, `/war-room/:id`, `/reports`, `/forecasts`, `/profile` | Triage incoming complaints, verify/reject, dispatch to workers, view SilentSignal alerts, ward analytics |
| **Field Worker** | `/tasks`, `/tasks/:id`, `/observations`, `/profile` | Work an assigned task queue, advance status, upload completion proof, submit FieldMesh observations |
| **Admin** | Everything officers have + `/admin/wards`, `/admin/users`, `/admin/staff` | Manage wards, create officer/worker accounts, activate/deactivate users, change roles |
| **Public (unauthenticated)** | `/map`, `/login`, `/register` | View a live city health map, register as a citizen |

---

## 4. Core Complaint Lifecycle

This is the heart of the system — every complaint moves through the same pipeline:

```
Citizen submits photo + description
        │
        ▼
Gemini AI: classifies category, scores severity, generates a title
        │
        ▼
Duplicate detection (geo proximity + semantic text similarity)
        │
   ┌────┴─────┐
   ▼          ▼
Duplicate   Unique → complaint created, ward auto-resolved via
found         geo boundary, citizen earns +5 reputation
   │                   │
Citizen                ▼
notified      Officer sees it in the triage queue (War Room)
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
           Verify               Reject
              │              (citizen notified)
              ▼
   Cascade risk check
   (nearby road/drainage auto-flagged
    if a water/sewage issue is verified)
              │
              ▼
   Officer dispatches to a worker
   (assignment created, worker notified)
              │
              ▼
   Worker: pending → acknowledged → en_route → on_site
              │
              ▼
   Worker completes task + uploads proof photo
   → Complaint marked Resolved
   → Citizen notified
   → Worker earns +10 field points
```

---

## 5. AI Pipeline (Google Gemini 2.0 Flash Lite)

| Function | Input | Output | Used where |
|---|---|---|---|
| `classifyComplaint` | Complaint description | Category + confidence score | On complaint submission |
| `scoreSeverity` | Complaint photo | Severity rating 1–10 + reasoning | On complaint submission |
| `generateTitle` | Complaint description | Short auto-generated title (≤10 words) | On complaint submission |
| `checkDuplicateText` | Two complaint descriptions | isDuplicate flag + similarity score | Deduplication on submit |
| `classifyObservation` | Worker photo + note | Category + severity + confidence | FieldMesh proactive sensing |

**Design principle:** AI is an enhancement, never a blocker. Every Gemini call has a typed fallback (e.g. `category: 'Other', severity: 5`). If Gemini is down or rate-limited, complaint submission still succeeds — it just skips the smart defaults.

---

## 6. Notification System

Every meaningful event in the system fires an in-app notification to the relevant user's bell feed. Notifications auto-expire after 60 days via a MongoDB TTL index.

| Event | Recipient |
|---|---|
| Complaint verified / assigned / in-progress / resolved / rejected | Citizen |
| Upvote received on their complaint | Complaint owner |
| Duplicate detected on their submission | Submitting citizen |
| Reputation earned | Citizen |
| New complaint filed in their ward | Officer |
| Ward stress band elevated | Officer |
| SilentSignal forecast generated | Officer |
| Cascade risk flagged | Officer |
| FieldMesh observation needs review | Officer |
| Task assigned / reassigned | Worker |
| Field points awarded | Worker |

The bell icon in the UI polls every 30 seconds for unread notifications.

---

## 7. Frontend Feature Tour, Page by Page

### Auth
- **Login / Register** — standard email/password flow, redirects if already logged in
- **Google OAuth** — separate flow, backend redirects to `/auth/google/success?token=...` which the client picks up and stores in memory
- **Profile page** — edit name/phone/avatar, change password (invalidates the session)

### Citizen
- **Dashboard** — personalized greeting, live city stats cards, recent reports, quick-action links
- **Submit Complaint** — photo upload, GPS capture, AI classification with manual override option, success confirmation screen
- **My Complaints** — filterable list with a detail drawer, upvote, and delete (only allowed pre-verification)

### Officer
- **War Room** — the triage table: incoming complaints, cascade-risk flags, auto-refreshes every 30 seconds
- **Complaint Detail** — verify/reject actions, dispatch to a worker, reassign, full status history timeline
- **Reports** — ward health score, complaint-by-category breakdown, worker performance leaderboard
- **Forecasts** — SilentSignal prediction feed, filterable by confidence, acknowledge action

### Field Worker
- **Tasks** — route-ordered task feed with a stats summary
- **Task Detail** — advance status through the pipeline, upload proof photo on completion
- **Observations** — FieldMesh photo submission form + history of past observations

### Admin
- **Ward Management** — create wards, assign officers via a live dropdown, trigger recompute tools
- **User Management** — search/filter all users, toggle active status, change roles
- **Create Staff** — provision new officer or worker accounts

### Public
- **NerveMap** — public-facing PulseGrid tile view + an accountability leaderboard, no login required

---

## 8. Security Model

- Access tokens expire in **15 minutes**, kept in memory only — never localStorage/sessionStorage (zero XSS token-theft risk)
- Refresh tokens last **7 days**, stored in an **httpOnly, SameSite=Strict, Secure** cookie scoped to `/api/auth`
- Silent refresh: an Axios response interceptor catches `TOKEN_EXPIRED` 401s and refreshes transparently; concurrent requests queue behind a single in-flight refresh call
- Passwords hashed with **bcrypt at 12 salt rounds**
- Access and refresh tokens are signed with **separate secrets**, enforced by a startup validation check
- Rate limiting: auth (10 attempts/15 min), complaint submission (10/15 min), observation submission (20/15 min)
- Image uploads validated by MIME type (JPG/PNG/WEBP), capped at 8MB

---

## 9. API Surface (Summary)

| Base path | Key operations |
|---|---|
| `/api/auth` | register, login, refresh, logout, get profile, change password, create staff (admin) |
| `/api/complaints` | public stats, public map, submit, list own, get detail, upvote, delete |
| `/api/officer` | triage queue, complaint detail, status update, dispatch, reassign, FieldMesh review, ward report, available workers |
| `/api/worker` | task feed, task detail, advance status, complete + proof upload, submit/list observations, summary stats |
| `/api/wards` | list, leaderboard, PulseGrid snapshot, ward detail, create/update (admin), assign officer, recompute stats |
| `/api/notifications` | feed, unread count, mark read (single/all), delete |
| `/api/users` | update own profile, staff directory, admin list/detail/activate/role-change |
| `/api/forecasts` | active forecasts, accuracy history, acknowledge, manual generate/score (admin) |

---

## 10. Key Design Decisions

- **No WebSockets** — the `usePolling` hook polls every 30s and pauses automatically when the tab is hidden. Keeps the app viable on free-tier hosting where persistent connections get killed after inactivity.
- **In-memory access tokens** — tokens die with the browser tab; reload silently restores the session via the httpOnly refresh cookie. Removes XSS token-theft risk entirely.
- **AI as enhancement, never a blocker** — every Gemini call has a fallback; an AI outage never stops a citizen from filing a complaint.
- **Single theme module** — every color, size, and spacing value lives in one file (`theme/index.js`). Rebranding the whole app is a one-file edit.
- **`transitionStatus()` for status changes** — complaint status changes must go through this model method (not a raw `updateOne()`) so the audit trail (`statusHistory`) is always populated correctly.
- **Weather fetched once per cron run** — SilentSignal pulls the OpenWeather forecast once per run, not once per ward-category pair, to stay within free-tier API quotas.

---

## 11. Project Structure (High Level)

```
veyu/
├── server/
│   ├── config/        # DB connection, Cloudinary, JWT setup
│   ├── constants/      # Rate limits, thresholds for PulseGrid/SilentSignal/FieldMesh
│   ├── models/         # user, complaint, ward, vote, assignment, observation, notification, forecast
│   ├── middleware/     # auth guards, error handling
│   ├── validators/     # express-validator schemas per route group
│   ├── controllers/    # one per route group
│   ├── services/       # business logic — complaint pipeline, PulseGrid, SilentSignal, cascade risk, Gemini, notifications
│   ├── routes/         # one per route group
│   ├── utils/          # ApiError, asyncHandler, logger, token utils
│   └── api/index.js    # Vercel serverless entry point
│
└── client/
    ├── src/
    │   ├── AppRouter.jsx        # full lazy-loaded route tree
    │   ├── theme/                # centralized design tokens
    │   ├── api/                  # axios instance + per-domain API modules
    │   ├── context/              # AuthContext (useReducer state machine)
    │   ├── guards/                # ProtectedRoute, RoleRoute, PublicOnlyRoute
    │   ├── hooks/                 # useCurrentUser, useRequireRole, usePolling
    │   ├── components/            # role-specific shells (Citizen/Officer/Worker/Admin)
    │   └── pages/                 # auth / citizen / officer / worker / admin / public
    └── vercel.json                 # SPA rewrite config
```

---

## 12. Deployment Notes

- **Client** and **server** are separate Vercel projects.
- Server uses `vercel.json` with a catch-all rewrite to `api/index.js` (Express app wrapped as a serverless function) plus a daily cron job for SilentSignal forecast generation.
- Client needs its own `vercel.json` with a SPA fallback rewrite (`"/(.*)" → "/index.html"`) so client-side routes like `/auth/google/success` resolve correctly instead of 404ing on direct load.
- Environment variables split cleanly: server holds Mongo/JWT/Cloudinary/Gemini/OpenWeather secrets; client only needs `VITE_API_URL`.

---

*This document is a high-level architectural and feature walkthrough of Veyu. For exact API contracts, request/response shapes, and route-level auth requirements, see the in-repo README and controller/route source files.*
