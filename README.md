# Veyu — Civic Intelligence Platform

> A full-stack civic issue management system built for Indian municipalities. Citizens report infrastructure problems; AI classifies, deduplicates, and scores them; officers triage and dispatch; field workers resolve on the ground.

---

## What it is

Veyu is a four-role civic platform that turns scattered pothole photos and water leakage complaints into a structured, AI-assisted resolution pipeline. The system tracks every complaint from submission to resolution, predicts issue spikes before they happen, and gives officers real-time visibility into ward health.

Three novel systems sit on top of the core complaint pipeline:

- **PulseGrid** — measures complaint velocity per ward over 48-hour windows and computes a stress band (Calm → Stable → Rising → Critical → Emergency). Officers see which wards are heating up before the queue overflows.
- **SilentSignal** — predictive forecasting that cross-references seasonal complaint history with live weather data to alert officers to issues (drainage, sewage, potholes) that historically spike in the next 10 days, before a single citizen has reported one.
- **FieldMesh** — proactive sensing by field workers. Workers submit photo observations of deteriorating infrastructure they notice on the ground. AI scores confidence; high-confidence observations auto-elevate into complaints; low-confidence ones go to the officer review queue.

---

## Tech stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 20 |
| Framework | Express.js |
| Database | MongoDB Atlas via Mongoose |
| Auth | JWT (access + refresh tokens, httpOnly cookies) |
| Image storage | Cloudinary (multer-storage-cloudinary) |
| AI | Google Gemini 2.0 Flash Lite |
| Rate limiting | express-rate-limit |
| Validation | express-validator |
| Scheduling | node-cron (PulseGrid recompute, SilentSignal daily forecast) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Routing | React Router DOM v7 |
| HTTP client | Axios (with silent token refresh interceptor) |
| Build tool | Vite 8 |
| Styling | Inline styles via centralized theme system (`src/theme/index.js`) |
| State | useReducer (auth), useState (page-level) |
| Real-time | usePolling hook (visibility-aware, free-tier friendly) |

---

## Project structure

```
veyu/
├── server/
│   ├── config/
│   │   ├── db.js                     # MongoDB connection with exponential backoff retry
│   │   ├── cloudinary.js             # Multer + Cloudinary storage (complaints, observations, completions)
│   │   └── jwt.config.js             # JWT secrets, expiry, cookie options + startup validation
│   │
│   ├── constants/
│   │   └── index.js                  # RATE_LIMITS, UPLOAD_LIMITS, DUPLICATE_DETECTION,
│   │                                 # CASCADE_RISK, FIELDMESH, REPUTATION, PULSE_GRID,
│   │                                 # SILENT_SIGNAL, WARD_HEALTH, PAGINATION
│   │
│   ├── models/
│   │   ├── user.model.js             # Roles: citizen, officer, worker, admin
│   │   ├── complaint.model.js        # GeoJSON, statusHistory, cascadeRisk, transitionStatus()
│   │   ├── ward.model.js             # PulseGrid velocity, stress bands, health score
│   │   ├── vote.model.js             # Upvotes (compound unique index prevents double-vote)
│   │   ├── assignment.model.js       # Worker task assignments + completion proof
│   │   ├── observation.model.js      # FieldMesh worker observations with AI scoring
│   │   ├── notification.model.js     # In-app notifications with 60-day TTL
│   │   └── forecast.model.js         # SilentSignal predictions with accuracy scoring
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js        # protect, requireRole, optionalAuth, requireOwnerOrRole
│   │   └── errorHandler.middleware.js  # Mongoose, JWT, ApiError, 500 fallback
│   │
│   ├── validators/
│   │   ├── auth.validators.js
│   │   ├── complaint.validators.js
│   │   ├── officer.validators.js
│   │   ├── worker.validators.js
│   │   ├── ward.validators.js
│   │   ├── forecast.validators.js
│   │   ├── notification.validators.js
│   │   └── user.validators.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── complaint.controller.js
│   │   ├── officer.controller.js
│   │   ├── worker.controller.js
│   │   ├── ward.controller.js
│   │   ├── forecast.controller.js
│   │   ├── notification.controller.js
│   │   └── user.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js           # Register, login, refresh, staff creation, password change
│   │   ├── complaint.service.js      # Submit, AI pipeline, dedup, vote, delete, stats, map
│   │   ├── officer.service.js        # Triage queue, status updates, dispatch, reassign, observations
│   │   ├── worker.service.js         # Task feed, status advance, complete, observations
│   │   ├── ward.service.js           # CRUD, officer assign, health score recompute
│   │   ├── pulseGrid.service.js      # Velocity computation, stress band classification
│   │   ├── silentSignal.service.js   # Seasonal pattern detection, weather correlation, forecasts
│   │   ├── weather.service.js        # OpenWeather 5-day forecast aggregation
│   │   ├── cascadeRisk.service.js    # Flag nearby road/drainage after water/sewage verify
│   │   ├── gemini.service.js         # Classify, score severity, generate title, dedup, observation
│   │   └── notification.service.js   # Template-based notifications, mark-read, unread count
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── complaint.routes.js
│   │   ├── officer.routes.js
│   │   ├── worker.routes.js
│   │   ├── ward.routes.js
│   │   ├── forecast.routes.js
│   │   ├── notification.routes.js
│   │   └── user.routes.js
│   │
│   └── utils/
│       ├── ApiError.js               # Operational error class with semantic factory methods
│       ├── asyncHandler.js
│       ├── logger.js                 # Structured console logger (INFO/OK/WARN/ERROR/DEBUG)
│       └── token.utils.js            # Sign, verify, extract Bearer token
│
└── client/
    ├── index.html                    # Entry point — meta tags, Inter font, flash prevention
    ├── src/
    │   ├── AppRouter.jsx             # Full route tree with lazy loading + Suspense
    │   │
    │   ├── theme/
    │   │   └── index.js              # ALL tokens: color, font, space, radius, shadow,
    │   │                             # transition, roleConfig, mk (style factories)
    │   │
    │   ├── constants/
    │   │   └── complaint.constants.js  # STATUS_META, CATEGORY_ICONS, STRESS_BAND_META,
    │   │                               # FORECAST_TRIGGER_META, ASSIGNMENT_STATUS_LABELS, etc.
    │   │
    │   ├── api/
    │   │   ├── tokenStore.js         # In-memory access token (never localStorage)
    │   │   ├── axios.instance.js     # Axios client + silent refresh interceptor
    │   │   ├── auth.api.js
    │   │   ├── complaints.api.js
    │   │   ├── officer.api.js
    │   │   ├── ward.api.js
    │   │   ├── worker.api.js
    │   │   ├── forecast.api.js
    │   │   ├── notification.api.js   # Bell feed, unread count, mark read, delete
    │   │   └── user.api.js           # Profile update, directory, admin CRUD
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx       # useReducer auth state machine
    │   │
    │   ├── guards/
    │   │   └── RouteGuards.jsx       # ProtectedRoute, RoleRoute, PublicOnlyRoute
    │   │
    │   ├── hooks/
    │   │   ├── useAuthGuards.js      # useCurrentUser, useRequireRole, useLogout
    │   │   └── usePolling.js         # Visibility-aware polling (pauses on hidden tabs)
    │   │
    │   ├── components/
    │   │   ├── shared/
    │   │   │   └── NotificationBell.jsx  # Bell icon + dropdown, polls every 30s
    │   │   ├── auth/
    │   │   │   └── AuthShell.jsx     # AuthPage, AuthCard, FormField, TextInput, PrimaryButton…
    │   │   ├── citizen/
    │   │   │   └── CitizenShell.jsx  # NavBar, StatusBadge, SeverityPip, EmptyState, Pagination…
    │   │   ├── officer/
    │   │   │   └── OfficerShell.jsx  # SeverityBar, MetaGrid, FilterTabs, BtnPrimary/Danger…
    │   │   ├── worker/
    │   │   │   └── WorkerShell.jsx   # AssignmentBadge, InstructionsBox, ImagePicker, GpsButton…
    │   │   └── admin/
    │   │       └── AdminShell.jsx    # StressBand, VelocityBar, Modal, ToolBtn…
    │   │
    │   └── pages/
    │       ├── auth/
    │       │   ├── LoginPage.jsx
    │       │   ├── RegisterPage.jsx
    │       │   ├── UnauthorizedPage.jsx
    │       │   └── ProfilePage.jsx       # Edit name/phone/avatar + change password
    │       ├── citizen/
    │       │   ├── Dashboard.jsx         # Greeting, city stats cards, recent reports, quick links
    │       │   ├── MyComplaints.jsx      # Filtered list + detail drawer + upvote + delete
    │       │   └── SubmitComplaint.jsx   # Photo upload, GPS capture, AI override, success screen
    │       ├── officer/
    │       │   ├── WarRoom.jsx           # Triage table, cascade flags, 30s auto-poll
    │       │   ├── ComplaintDetail.jsx   # Verify/reject, dispatch, reassign worker, status history
    │       │   ├── Reports.jsx           # Ward health score, category bars, worker leaderboard
    │       │   └── Forecasts.jsx         # SilentSignal feed, confidence filter, acknowledge
    │       ├── worker/
    │       │   ├── Tasks.jsx             # Route-ordered task feed, stats summary
    │       │   ├── TaskDetail.jsx        # Status advance, completion proof upload
    │       │   └── Observations.jsx      # FieldMesh photo submission + history
    │       ├── admin/
    │       │   ├── WardManagement.jsx    # Create ward, real officer dropdown, recompute tools
    │       │   ├── UserManagement.jsx    # Search/filter users, toggle active, change role
    │       │   └── CreateStaffPage.jsx   # Create officer or worker account
    │       └── public/
    │           └── NerveMap.jsx          # Public PulseGrid tiles + accountability leaderboard
    │
    ├── package.json
    └── vite.config.js
```

---

## Roles

| Role | Routes | Key capabilities |
|------|--------|-----------------|
| **Citizen** | `/dashboard`, `/report`, `/my-reports`, `/profile` | Submit complaints, upvote, track resolution, edit profile |
| **Officer** | `/war-room`, `/war-room/:id`, `/reports`, `/forecasts`, `/profile` | Triage, verify, dispatch, reassign, view SilentSignal alerts |
| **Field Worker** | `/tasks`, `/tasks/:id`, `/observations`, `/profile` | Advance task status, upload proof, submit FieldMesh observations |
| **Admin** | All officer routes + `/admin/wards`, `/admin/users`, `/admin/staff` | Manage wards, create staff, activate/deactivate users, change roles |
| **Public** | `/map`, `/login`, `/register` | View live city health, register as citizen |

---

## Core data flow

```
Citizen submits photo + description
        │
        ▼
Gemini: classify category + score severity + generate title
        │
        ▼
Duplicate detection (geo proximity + semantic text similarity)
        │ duplicate?              │ unique?
        ▼                         ▼
Linked to existing           Complaint created
complaint                    Ward resolved via geo boundary
Citizen notified             Reputation +5
                                  │
                                  ▼
                         Officer sees in triage queue (WarRoom)
                                  │
                       ┌──────────┴──────────┐
                       ▼                     ▼
                    Verify                Reject
                       │                  Citizen notified
                       ▼
               Cascade risk check
         (nearby road/drainage flagged
          if water/sewage is verified)
                       │
                       ▼
           Officer dispatches to worker
           Assignment created, worker notified
                       │
                       ▼
           Worker: pending → acknowledged
                   → en_route → on_site
                       │
                       ▼
           Worker completes + uploads proof photo
           Complaint → Resolved, citizen notified
           Worker earns +10 field points
```

---

## AI pipeline (Gemini 2.0 Flash Lite)

| Function | Input | Output | Used in |
|----------|-------|--------|---------|
| `classifyComplaint` | Description text | Category + confidence | Complaint submission |
| `scoreSeverity` | Image (base64) | Severity 1–10 + reason | Complaint submission |
| `generateTitle` | Description text | Short title ≤10 words | Complaint submission |
| `checkDuplicateText` | Two descriptions | isDuplicate + similarity | Dedup on submit |
| `classifyObservation` | Worker photo + note | Category + severity + confidence | FieldMesh |

All AI calls fail gracefully — every function has a sensible fallback. A Gemini outage never blocks complaint submission.

---

## Notification system

Every key event generates an in-app notification delivered to the relevant user's bell feed. Notifications auto-expire after 60 days (MongoDB TTL index).

| Event | Recipient |
|-------|-----------|
| Complaint verified | Citizen |
| Complaint assigned | Citizen |
| Work in progress | Citizen |
| Complaint resolved | Citizen |
| Complaint rejected | Citizen |
| Upvote received | Complaint owner |
| Duplicate detected | Submitting citizen |
| Reputation earned | Citizen |
| New complaint in ward | Officer |
| Stress band elevated | Officer |
| SilentSignal forecast | Officer |
| Cascade risk flagged | Officer |
| FieldMesh observation needs review | Officer |
| Task assigned | Worker |
| Task reassigned | Worker |
| Field points awarded | Worker |

---

## Environment variables

### Server `.env`
```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/veyu

# JWT — must be different values
JWT_ACCESS_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<different-long-random-string>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Google Gemini
GEMINI_API_KEY=<your-gemini-api-key>

# OpenWeather (optional — SilentSignal weather correlation)
OPENWEATHER_API_KEY=<your-openweather-api-key>
CITY_LAT=<your-city-latitude>
CITY_LON=<your-city-longitude>

# Environment
NODE_ENV=development
PORT=5000
```

### Client `.env`
```env
VITE_API_URL=http://localhost:5000
```

---

## Getting started

```bash
# Clone
git clone https://github.com/your-username/veyu.git
cd veyu

# Server
cd server
npm install
cp .env.example .env        # fill in all values
npm run dev

# Client (separate terminal)
cd ../client
npm install
cp .env.example .env        # set VITE_API_URL
npm run dev
```

Client runs on `http://localhost:5173`, server on `http://localhost:5000`.

---

## API routes

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Register citizen account |
| POST | `/login` | Public | Login, receive access token + set refresh cookie |
| POST | `/refresh` | Public | Silent token refresh via httpOnly cookie |
| POST | `/logout` | Protected | Clear refresh cookie |
| GET | `/me` | Protected | Fetch own user profile |
| PATCH | `/password` | Protected | Change password — invalidates session |
| POST | `/staff` | Admin | Create officer or worker account |

### Complaints — `/api/complaints`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats/public` | Public | Open count, resolved today, avg resolution, top category |
| GET | `/map` | Public | Complaint list for public map view |
| POST | `/` | Citizen | Submit complaint (multipart: image + fields) |
| GET | `/mine` | Citizen | Own complaints with pagination + status filter |
| GET | `/:id` | Optional | Single complaint detail + hasVoted |
| POST | `/:id/upvote` | Protected | Toggle upvote |
| DELETE | `/:id` | Citizen | Delete own unverified complaint |

### Officer — `/api/officer`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/queue` | Officer/Admin | Triage queue with status/category/ward filters |
| GET | `/complaints/:id` | Officer/Admin | Detail with assignment info |
| PATCH | `/complaints/:id/status` | Officer/Admin | Verify / reject / update status |
| POST | `/complaints/:id/dispatch` | Officer/Admin | Assign to worker + create assignment |
| POST | `/complaints/:id/reassign` | Officer/Admin | Reassign to different worker |
| GET | `/observations` | Officer/Admin | FieldMesh review queue |
| PATCH | `/observations/:id/review` | Officer/Admin | Elevate or dismiss observation |
| GET | `/wards/:wardId/report` | Officer/Admin | Ward analytics: health, categories, leaderboard |
| GET | `/workers/available` | Officer/Admin | Available workers for dispatch dropdown |

### Worker — `/api/worker`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tasks` | Worker | Active task feed sorted by queue position |
| GET | `/tasks/:id` | Worker | Task detail with complaint and instructions |
| PATCH | `/tasks/:id/advance` | Worker | Advance: pending → acknowledged → en_route → on_site |
| POST | `/tasks/:id/complete` | Worker | Complete with proof photo — resolves complaint |
| POST | `/observations` | Worker | Submit FieldMesh observation (multipart) |
| GET | `/observations` | Worker | Own observation history |
| GET | `/summary` | Worker | Field points, completed count, pending count |

### Wards — `/api/wards`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List active wards |
| GET | `/leaderboard` | Public | Health score ranking |
| GET | `/pulse` | Public | PulseGrid snapshot (velocity + stress bands) |
| GET | `/:id` | Public | Single ward detail |
| POST | `/` | Admin | Create ward |
| PATCH | `/:id` | Admin | Update ward name/city/boundary/active status |
| POST | `/:id/assign-officer` | Admin | Assign officer to ward |
| POST | `/:id/recompute-stats` | Officer/Admin | Recompute health score |
| POST | `/pulse/recompute` | Admin | Recompute PulseGrid for all wards |
| POST | `/stats/recompute-all` | Admin | Recompute health scores for all wards |

### Notifications — `/api/notifications`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Protected | Paginated notification feed |
| GET | `/unread-count` | Protected | Unread badge count |
| PATCH | `/read-all` | Protected | Mark all as read |
| PATCH | `/:id/read` | Protected | Mark single notification as read |
| DELETE | `/:id` | Protected | Delete notification |

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/me` | Protected | Update name, phone, avatar URL |
| GET | `/directory` | Officer/Admin | Users by role (for dropdowns, max 200) |
| GET | `/` | Admin | Paginated user list with search + role filter |
| GET | `/:id` | Admin | Single user detail |
| PATCH | `/:id/active` | Admin | Activate or deactivate account |
| PATCH | `/:id/role` | Admin | Change user role |

### Forecasts — `/api/forecasts`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Officer/Admin | Active forecasts with confidence filter |
| GET | `/accuracy` | Officer/Admin | Historical accuracy rate |
| PATCH | `/:id/acknowledge` | Officer/Admin | Acknowledge a forecast |
| POST | `/generate` | Admin | Manually trigger forecast generation (normally cron) |
| POST | `/expire-and-score` | Admin | Manually score expired forecasts (normally cron) |

---

## Security model

- Access tokens expire in **15 minutes**, stored in memory only — never localStorage or sessionStorage
- Refresh tokens expire in **7 days**, stored in an **httpOnly, SameSite=Strict, Secure** cookie scoped to `/api/auth`
- Silent refresh via Axios response interceptor on `TOKEN_EXPIRED` 401 — concurrent requests queue behind a single in-flight refresh
- Passwords hashed with bcrypt at **12 salt rounds**
- JWT signed with **separate secrets** for access and refresh; startup validation enforces they differ
- Rate limiting: auth (10 attempts / 15 min), complaint submit (10 / 15 min), observation submit (20 / 15 min)
- Image uploads validated by MIME type (JPG/PNG/WEBP) and capped at **8MB**

---

## Key design decisions

**No WebSockets** — `usePolling` hook polls every 30s and pauses automatically when the browser tab is hidden. Viable on free-tier hosting where persistent connections get killed after inactivity.

**In-memory access tokens** — access tokens die with the browser tab. On reload, the httpOnly refresh cookie silently restores the session via `/api/auth/refresh`. No XSS risk from token theft.

**AI as enhancement, never a blocker** — every Gemini call has a typed fallback (`category: 'Other', severity: 5`). A Gemini outage or rate limit never prevents complaint submission.

**Single theme module** — all colors, sizes, and spacing live in `src/theme/index.js`. Zero magic strings in component files. Changing the accent color, background, or typography is a single-file edit.

**statusHistory via `transitionStatus()`** — complaint status changes must use `complaint.transitionStatus(status, changedBy, note)` followed by `.save()` to populate the audit trail. Direct `updateOne()` bypasses the pre-save hook and silently skips history recording.

**Weather fetch once per cron run** — SilentSignal fetches the OpenWeather 5-day forecast once before the pattern loop, not once per ward-category pair. Prevents O(n) API calls that would exhaust free-tier quota.

---

## Built by

Anmol Kumar Shaharwal
B.Tech Biotechnology, MNNIT Allahabad · B.S. Data Science & Applications, IIT Madras