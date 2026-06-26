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
| Styling | Inline styles via centralized theme system |
| State | useReducer (auth), useState (page-level) |
| Real-time | usePolling hook (visibility-aware, free-tier friendly) |

---

## Project structure

```
veyu/
├── server/
│   ├── config/
│   │   ├── db.js                   # MongoDB connection with exponential backoff
│   │   ├── cloudinary.js           # Multer + Cloudinary storage configs
│   │   └── jwt.config.js           # JWT secrets, expiry, cookie options
│   │
│   ├── constants/
│   │   └── index.js                # RATE_LIMITS, UPLOAD_LIMITS, DUPLICATE_DETECTION,
│   │                               # CASCADE_RISK, FIELDMESH, REPUTATION, PULSE_GRID,
│   │                               # SILENT_SIGNAL, WARD_HEALTH, PAGINATION
│   │
│   ├── models/
│   │   ├── user.model.js           # Roles: citizen, officer, worker, admin
│   │   ├── complaint.model.js      # GeoJSON location, statusHistory, cascadeRisk
│   │   ├── ward.model.js           # PulseGrid velocity, stress bands, health score
│   │   ├── vote.model.js           # Upvotes (compound unique index)
│   │   ├── assignment.model.js     # Worker task assignments
│   │   ├── observation.model.js    # FieldMesh worker observations
│   │   ├── notification.model.js   # In-app notification feed
│   │   └── forecast.model.js       # SilentSignal predictions
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js      # protect, requireRole, optionalAuth, requireOwnerOrRole
│   │   └── errorHandler.middleware.js  # Mongoose errors, JWT errors, ApiError, 500 fallback
│   │
│   ├── validators/
│   │   ├── auth.validators.js
│   │   ├── complaint.validators.js
│   │   └── officer.validators.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── complaint.controller.js
│   │   └── officer.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js         # Register, login, refresh, password change
│   │   ├── complaint.service.js    # Submit, vote, delete, public stats, map view
│   │   ├── officer.service.js      # Triage queue, status updates, dispatch, reassign
│   │   ├── gemini.service.js       # Classify, score severity, generate title, dedup check
│   │   ├── notification.service.js # Template-based notifications, mark-read, unread count
│   │   └── cascadeRisk.service.js  # Flag nearby road/drainage after water/sewage verify
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── complaint.routes.js
│   │   └── officer.routes.js
│   │
│   └── utils/
│       ├── ApiError.js             # Operational error class with semantic factory methods
│       ├── asyncHandler.js
│       ├── logger.js               # Structured console logger (INFO/OK/WARN/ERROR/DEBUG)
│       └── token.utils.js          # Sign, verify, extract Bearer token
│
└── client/
    ├── src/
    │   ├── theme/
    │   │   └── index.js            # All design tokens: color, font, space, radius, shadow,
    │   │                           # transition, roleConfig, mk (style factories)
    │   │
    │   ├── constants/
    │   │   └── complaint.constants.js  # STATUS_META, CATEGORY_ICONS, STRESS_BAND_META,
    │   │                               # FORECAST_TRIGGER_META, FORECAST_STATUS_META, etc.
    │   │
    │   ├── api/
    │   │   ├── tokenStore.js       # In-memory access token (not localStorage)
    │   │   ├── axios.instance.js   # Axios client + silent refresh interceptor
    │   │   ├── auth.api.js
    │   │   ├── complaints.api.js
    │   │   ├── officer.api.js
    │   │   └── forecast.api.js
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx     # useReducer auth state machine
    │   │
    │   ├── guards/
    │   │   └── RouteGuards.jsx     # ProtectedRoute, RoleRoute, PublicOnlyRoute
    │   │
    │   ├── hooks/
    │   │   ├── useAuthGuards.js    # useCurrentUser, useRequireRole, useLogout, etc.
    │   │   └── usePolling.js       # Visibility-aware polling (pauses on hidden tabs)
    │   │
    │   ├── components/
    │   │   ├── AuthShell.jsx       # Auth page primitives: AuthCard, FormField, PrimaryButton…
    │   │   ├── citizen/
    │   │   │   └── CitizenShell.jsx    # Citizen page primitives: NavBar, StatusBadge…
    │   │   └── officer/
    │   │       └── OfficerShell.jsx    # Officer page primitives: SeverityBar, MetaGrid…
    │   │
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   ├── RegisterPage.jsx
    │   │   │   └── UnauthorizedPage.jsx
    │   │   ├── citizen/
    │   │   │   ├── Dashboard.jsx       # Greeting, city stats, recent reports, quick links
    │   │   │   ├── MyComplaints.jsx    # Filtered list + detail drawer + upvote + delete
    │   │   │   └── SubmitComplaint.jsx # Photo upload, GPS, AI category override, success screen
    │   │   ├── officer/
    │   │   │   ├── WarRoom.jsx         # Triage queue table, cascade risk flags, auto-poll
    │   │   │   ├── ComplaintDetail.jsx # Verify/reject, dispatch worker, status history
    │   │   │   ├── Reports.jsx         # Ward analytics: health score, category bars, leaderboard
    │   │   │   └── Forecasts.jsx       # SilentSignal feed, confidence filter, acknowledge
    │   │   ├── worker/                 # (in progress)
    │   │   │   ├── Tasks.jsx
    │   │   │   ├── TaskDetail.jsx
    │   │   │   └── Observations.jsx
    │   │   ├── admin/
    │   │   │   └── WardManagement.jsx  # (in progress)
    │   │   └── public/
    │   │       └── NerveMap.jsx        # Public complaint heatmap (in progress)
    │   │
    │   └── AppRouter.jsx           # Full route tree with lazy loading + Suspense
    │
    ├── package.json
    └── vite.config.js
```

---

## Roles

| Role | Access |
|------|--------|
| **Citizen** | Submit complaints, track own reports, upvote, view public map |
| **Officer** | Triage queue, verify/reject/dispatch, ward reports, SilentSignal forecasts |
| **Field Worker** | View assigned tasks, update task status, submit FieldMesh observations |
| **Admin** | All officer access + create staff accounts, manage wards |

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
        │ duplicate?          │ unique?
        ▼                     ▼
Linked to existing      Complaint created
complaint               Ward resolved via geo boundary
                              │
                              ▼
                        Officer sees complaint in triage queue
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
                 Verify              Reject
                    │
                    ▼
            Cascade risk check
            (nearby road/drainage flagged if water/sewage verified)
                    │
                    ▼
            Dispatch to field worker
                    │
                    ▼
          Worker updates task status
          (en_route → on_site → completed + resolution photo)
                    │
                    ▼
                Resolved
          Citizen notified in-app
```

---

## AI pipeline (Gemini 2.0 Flash Lite)

| Function | Input | Output |
|----------|-------|--------|
| `classifyComplaint` | Description text | Category + confidence score |
| `scoreSeverity` | Complaint image (base64) | Severity 1–10 + reason |
| `generateTitle` | Description text | Short factual title (≤10 words) |
| `checkDuplicateText` | Two descriptions | isDuplicate + similarity score |
| `classifyObservation` | Worker photo + note | Category + severity + confidence |

All AI calls fail gracefully — every function has a fallback value so a Gemini outage never blocks complaint submission.

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
cd client
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
| PATCH | `/password` | Protected | Change password (invalidates session) |
| POST | `/staff` | Admin | Create officer or worker account |

### Complaints — `/api/complaints`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats/public` | Public | City-wide open count, resolved today, avg resolution |
| GET | `/map` | Public | Complaint list for public map view |
| POST | `/` | Citizen | Submit complaint (multipart: image + fields) |
| GET | `/mine` | Citizen | Own complaints with pagination + status filter |
| GET | `/:id` | Optional | Single complaint detail |
| POST | `/:id/upvote` | Protected | Toggle upvote |
| DELETE | `/:id` | Citizen | Delete own unverified complaint |

### Officer — `/api/officer`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/queue` | Officer/Admin | Triage queue with filters |
| GET | `/complaints/:id` | Officer/Admin | Detail with assignment info |
| PATCH | `/complaints/:id/status` | Officer/Admin | Verify / reject / update status |
| POST | `/complaints/:id/dispatch` | Officer/Admin | Assign to worker |
| POST | `/complaints/:id/reassign` | Officer/Admin | Reassign to different worker |
| GET | `/observations` | Officer/Admin | FieldMesh review queue |
| PATCH | `/observations/:id/review` | Officer/Admin | Elevate or dismiss observation |
| GET | `/wards/:wardId/report` | Officer/Admin | Ward analytics report |
| GET | `/workers/available` | Officer/Admin | Available workers for dispatch dropdown |

---

## Security model

- Access tokens expire in **15 minutes**, stored in memory only (never localStorage)
- Refresh tokens expire in **7 days**, stored in **httpOnly, SameSite=Strict, Secure** cookie scoped to `/api/auth`
- Silent refresh happens automatically via the Axios response interceptor on `TOKEN_EXPIRED` 401s — concurrent requests queue behind a single in-flight refresh
- Passwords hashed with bcrypt at **12 salt rounds**
- JWT signed with **separate secrets** for access and refresh tokens; startup validation enforces they are different
- Rate limiting on auth (10 attempts / 15 min) and complaint submission (10 / 15 min)
- Image uploads validated by MIME type and capped at 8MB

---

## Key design decisions

**No WebSockets** — the frontend uses a `usePolling` hook instead. It pauses automatically when the browser tab is hidden, making it viable on free-tier hosting where persistent connections get killed.

**In-memory access tokens** — access tokens are never written to localStorage or sessionStorage. They live in a JS module variable and die with the tab. On reload, the httpOnly refresh cookie silently restores the session.

**AI as enhancement, never a blocker** — every Gemini call is wrapped in try/catch with a sensible fallback. A Gemini API failure defaults to `category: 'Other', severity: 5`. Complaints always go through.

**Single theme module** — every color, font size, spacing value, and shadow lives in `src/theme/index.js`. No magic strings anywhere in component files. Changing the accent color is a one-line edit.

**statusHistory via `.save()`** — complaint status transitions must use the `complaint.transitionStatus(status, changedBy, note)` instance method followed by `.save()` to populate the audit trail. Direct `updateOne()` calls bypass the pre-save hook and will silently skip history recording.

---

## Built by

Anmol Kumar Shaharwal — B.Tech Biotechnology, MNNIT Allahabad + B.S. Data Science & Applications, IIT Madras