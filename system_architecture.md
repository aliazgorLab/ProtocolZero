# Protocol Zero — System Architecture

**Status:** Official Architecture Document
**Scope:** University MERN capstone project — built for clarity and delivery, not enterprise scale.

---

## 1. Introduction

Protocol Zero is a real-time, community-driven emergency reporting and response coordination platform. It closes the gap between an incident happening and help being notified, by combining crowdsourced incident reports with geospatial routing to volunteers, vetted reporters, and official response teams.

This document is the single source of truth for how the system is built. It replaces and reconciles the earlier overview notes and blueprint draft into one consistent reference. Any developer on the team should be able to read this document and understand the whole system within a day.

---

## 2. Project Vision

- Let ordinary citizens report incidents (fires, floods, accidents, etc.) in seconds, from a map.
- Let vetted professionals (journalists, institutional reporters) issue high-trust, wide-area alerts.
- Route incidents in real time to nearby volunteers and official response teams.
- Use community voting to separate real incidents from noise, without needing manual moderation for every report.
- Never let a broken GPS block someone from calling for help — degrade gracefully, not silently.

---

## 3. Design Principles

1. **Simplicity first.** No microservices, no unnecessary layers, no speculative abstraction. A controller talking to a Mongoose model is enough unless there's a real reason to add a service file.
2. **One citizen, one account.** Enforced with unique constraints on email and phone.
3. **Geospatial data is first-class.** Every user and every report carries a GeoJSON `Point`, indexed with MongoDB `2dsphere` for fast radius queries.
4. **Fail safe, not fail silent.** If GPS fails during a crisis, the system falls back to known addresses and flags the degraded state — it never just blocks the report.
5. **Offload what you can.** Authentication, password handling, and OTP delivery are delegated to Firebase, so the Express backend stays focused on business logic.
6. **Readability over cleverness.** Small functions, clear names, no giant controllers or components.

---

## 4. Technology Stack

**Frontend**
- React (Vite)
- React Router
- Redux Toolkit
- Tailwind CSS
- Axios
- Leaflet + OpenStreetMap (via `react-leaflet`, clustering via `react-leaflet-cluster`)
- Socket.io Client

**Backend**
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- Firebase Admin SDK
- Socket.io

**Authentication**
- Firebase Authentication (email/password + Email OTP)
- Firebase-issued JWT ID tokens, verified server-side

**Maps**
- Leaflet with free OpenStreetMap tiles (zero hosting cost)

---

## 5. High-Level Architecture

```
[React / Vite Client]  <--(HTTP REST + Socket.io)-->  [Express / Node Server]
        |                                                      |
   Firebase Auth SDK                                    Firebase Admin SDK
        |                                                      |
        v                                                      v
 [Firebase Auth Service]                              [MongoDB Atlas]
 (OTP, password, tokens)                        (users, reports, notifications)
```

The client never talks to MongoDB directly, and the server never issues passwords or OTPs itself — both trust Firebase for identity, and MongoDB for everything else.

**Request flow:** Presentation (React) → API layer (Express routes) → Business logic (controllers, with a `services/` helper only where math or multi-step logic warrants it) → Database (MongoDB via Mongoose).

---

## 6. System Flow (Core Loop)

1. A citizen opens the app and sees nearby incidents on a live map (`GET /api/reports/nearby`), fed by a `2dsphere` radius query.
2. They submit a report → the backend runs a duplicate check first, then saves it and broadcasts it via Socket.io to everyone in that map region.
3. Nearby users vote and comment, which shifts the report's community-driven credibility score.
4. If a report's vote pattern looks suspicious, the system quietly stops notifying regular citizens about it but still flags it to Admins and Reporters for review.
5. A Reporter or Admin can validate, edit, or close the report — closing it recalculates the reporting user's reliability score.
6. If someone marks themselves a victim on an active report, response teams and reporters instantly see their live location (or a safe fallback if GPS failed).

---

## 7. Folder Structure

Kept intentionally small — only folders that are actually used.

```
protocol-zero/
├── client/                    # React + Vite app
│   └── src/
│       ├── api/                # Axios instance + API wrapper functions
│       ├── components/         # Reusable UI (Navbar, ReportCard, MapBadge...)
│       ├── features/           # Redux slices by domain (auth, reports, map, notifications)
│       ├── hooks/               # useAuth, useGeolocation, useSocket
│       ├── layouts/             # DashboardLayout, MapLayout
│       └── routes/              # Route table + <RoleRoute> guard
│
└── server/                    # Express + Node app
    ├── config/                 # db.js (Mongo connection), firebase.js (Admin SDK init)
    ├── controllers/            # Request handling, response formatting
    ├── middleware/              # Auth verification, RBAC guards, rate limiter
    ├── models/                  # User.js, Report.js, Notification.js, PointSchema.js
    ├── routes/                  # Express route definitions + input validation
    ├── services/                 # Business logic that's more than a one-liner (scoring, duplicate-radius checks)
    ├── socket/                   # Socket.io event listeners/emitters
    ├── constants/                 # Shared constants (radius thresholds, score weights)
    └── server.js                  # Entry point
```

No repository pattern, no dependency injection framework, no generic "utils grab-bag" — logic lives close to where it's used.

---

## 8. Frontend Architecture

- **Routing:** React Router with a `<RoleRoute>` wrapper that redirects based on `accountType` — no separate route files per role.
- **State:** Redux Toolkit, sliced by domain (`authSlice`, `reportsSlice`, `notificationsSlice`). Server data is kept in slices rather than re-fetched everywhere.
- **Data fetching:** A single configured Axios instance in `api/` attaches the Firebase ID token to every request automatically.
- **Real-time:** A `useSocket` hook opens one Socket.io connection per session and joins the relevant geolocation and role rooms; components subscribe to just the events they need.
- **Map:** Leaflet renders markers color-coded by report type/status (see §16), clustered at low zoom, updated live as socket events arrive.

---

## 9. Backend Architecture

- **Controllers** handle one thing each: parse the request, call the model/service, format the response. No controller should be handling more than one resource.
- **Services** exist only where logic is non-trivial and reused: duplicate-report radius checks, reliability score math, notification-matching logic. Simple CRUD stays in the controller.
- **Middleware** handles cross-cutting concerns: Firebase token verification, RBAC role checks, and rate limiting on login attempts.
- **Response format** is consistent across every endpoint:

```json
{
  "success": true,
  "message": "Report created successfully.",
  "data": { }
}
```

---

## 10. Database Design

Three core collections plus one reusable sub-schema — deliberately not normalized further, since MongoDB is used the way it's meant to be used (embed what you read together).

### 10.1 `PointSchema` (reusable, not a top-level collection)
A GeoJSON Point: a `type` fixed to `"Point"` and a `coordinates` array validated to always be exactly `[longitude, latitude]`. Used inside `User` (for `gps`) and `Report` (for `location` and `impactAreas`).

### 10.2 `User` — one collection for every account type
Rather than separate collections per role, all accounts (citizen, volunteer, reporter, response team, admin) live in one `User` collection, distinguished by an `accountType` field. Fields that only apply to certain roles (e.g. `nid`, `officeName`) are simply left null for roles that don't need them.

| Field | Notes |
|---|---|
| `name`, `phone` (unique), `email` (unique) | Core identity — enforces one citizen = one account |
| `currentAddress`, `homeAddress`, `gps` | Location data; `gps` is a `2dsphere`-indexed Point |
| `accountType` | `User \| Volunteer \| Reporter \| ResponseTeam \| Admin \| SuperAdmin` |
| `verificationStatus` | `verified \| pending \| rejected` — Reporters/Response Teams start `pending` until Admin approval |
| `score` | Reliability score; applies only to `User`/`Volunteer` (see §17.3) |
| `victimReportID` | Set if the user has an active Victim Mode attachment |
| `inventory` | Array of `{ itemName, quantity, unit }` — manual resource tracking for Volunteers/Response Teams |
| `nid`, `face` | Required for `Reporter`/`ResponseTeam` — identity verification |
| `officeName`, `officeAddress`, `role` (`police \| firefighter \| civilsurgeon`) | Response Team-specific |

Note: no `password` field is stored in MongoDB — Firebase Authentication owns credentials entirely; MongoDB only stores profile data.

### 10.3 `Report` — one collection for every incident
Minor reports, major reports, and (future) predictive hazard reports all share this schema, distinguished by `type`.

| Field | Notes |
|---|---|
| `postId` (unique), `issuerId`, `updaterId`, `closedBy`, `closedAt` | Identity & audit trail |
| `type` | `minor \| major \| predictive` |
| `location` | Primary GeoJSON Point |
| `impactAreas` | Array of `{ coordinate, radius }` — used for major/predictive multi-point blast zones |
| `time`, `category`, `description`, `image[]` | Incident details |
| `victims[]` | References to `User` — populated via Victim Mode |
| `vote: { upvote, downvote, upvoterId[], downvoterId[] }` | Embedded voting — prevents duplicate votes via the voter ID arrays |
| `score` (virtual) | `upvote - downvote`, computed on read, not stored |
| `reliability` | `none \| valid \| false` |
| `status` | `active \| closed` |
| `comments[]` | Embedded `{ text, commenterId, createdAt }` |

Indexes: `2dsphere` on `location`, `2dsphere` on `impactAreas.coordinate`, and a compound `{ status, type, createdAt }` index for dashboard feeds.

### 10.4 `Notification` — one collection for every alert type
Polymorphic by design: `referenceId` + `referenceModel` (`Report` or `User`) lets the same collection and the same drawer UI handle both incident alerts ("new report 500m away") and account alerts ("your NID was approved").

| Field | Notes |
|---|---|
| `recipientId` | References `User` |
| `referenceId` / `referenceModel` | Polymorphic pointer to the triggering `Report` or `User` |
| `type` | e.g. `report_created`, `report_escalated`, `account_flagged` |
| `message`, `read` | Content + read state |

Indexed on `{ recipientId, read, createdAt }` for fast "unread, newest first" queries.

---

## 11. Authentication Flow

Firebase Authentication owns the entire credential lifecycle — the backend never stores or checks a password.

1. **Register/Login (client):** User enters email + password on the React app; Firebase sends a 6-digit Email OTP.
2. **Token issuance:** Once OTP is confirmed, Firebase returns a signed JWT ID token to the client.
3. **Authenticated requests:** React attaches the token as `Authorization: Bearer <firebase_id_token>` on every API call.
4. **Server-side verification:** Express middleware calls `admin.auth().verifyIdToken()` via the Firebase Admin SDK, confirms the signature, and matches the token's email against the `users` collection.
5. **Onboarding sync:** `POST /api/auth/register` writes the user's profile (name, phone, email, accountType, and role-specific fields) into MongoDB on first login. It's idempotent — calling it twice just returns the existing record.
6. **Vetting gate:** Reporters and Response Teams register with `verificationStatus: pending` and cannot call any protected endpoint until an Admin approves them.
7. **Forgot password / wrong-password handling:** Forgot-password uses Firebase's OTP reset flow. Repeated wrong-password attempts are rate-limited client-side against Firebase's own throttling (3 attempts → 30s lockout, escalating on repeat failures).

Both `email` and `phone` are enforced unique at the database level, so a burner email can't be paired with a phone number already in use.

---

## 12. Authorization (RBAC)

Enforced centrally as Express middleware that reads `req.user.accountType` — not scattered through individual controllers.

| Role | Can do |
|---|---|
| **User** | View nearby reports, submit Minor Reports, vote, comment, activate Victim Mode |
| **Volunteer** | Everything a User can, plus appears as a responder candidate. Can opt out anytime *unless* currently assigned to an active task |
| **Reporter** | Vetted (NID + office required). The only role that can submit **Major** Reports. Reports are `valid` by default and bypass fake-report detection |
| **Response Team** | Official units (police/firefighter/civilsurgeon). Full victim contact + GPS visibility, resource allocation |
| **Admin / SuperAdmin** | Reviews flagged accounts, resolves disputes, manages regional/global oversight |

**Key permission rules:**
- **Major Report gate:** only `Reporter` accounts can POST a `type: major` report — enforced with a 403 for everyone else.
- **Victim privacy scrubbing:** Users/Volunteers fetching a report see only the victim's name and photo. Reporters/Response Teams/Admins see full contact info and live GPS.
- **Volunteer exit guard:** A Volunteer can't revert to `User` while assigned to an active task — the update is blocked until they complete or unassign.
- **Reporter edit boundary:** A Reporter can validate/edit a citizen's report, but cannot edit another Reporter's report.

---

## 13. API Design

REST, predictable, consistent envelope (see §9). Grouped by resource:

### `/api/auth`
- `POST /api/auth/register` — sync a newly authenticated Firebase user into MongoDB

### `/api/reports`
- `POST /api/reports` — create a report (role-aware: Minor for User/Reporter, Major for Reporter only); runs duplicate-radius check first
- `GET /api/reports/nearby?lng=&lat=&radius=` — active reports within a radius
- `GET /api/reports/:id` — report detail, with role-based victim-data scrubbing
- `PATCH /api/reports/:id` — Reporter/Admin edits (location, time, description, category, reliability, image, victims, status)
- `PATCH /api/reports/:id/vote` — upvote or downvote (guards against duplicate voting)
- `POST /api/reports/:id/comment` — add a comment (required when downvoting)
- `POST /api/reports/:id/victim` — attach the current user as a victim (Victim Mode / SOS), with GPS + fallback status
- `PATCH /api/reports/:id/close` — close a report; triggers reliability score recalculation

### `/api/resources`
- `PATCH /api/resources/inventory` — Volunteers/Response Teams update their personal inventory
- `PATCH /api/reports/:id/resources` — update resources-needed/committed on an active report

### `/api/notifications`
- `GET /api/notifications` — paginated, unread-first
- `PATCH /api/notifications/:id/read` — mark as read

### `/api/admin`
- `GET /api/admin/flagged-users` — users below the reliability threshold

---

## 14. Socket.io Architecture

Used strictly for broadcasting — not for request/response logic. Kept to a small, meaningful set of events rather than one per possible state change.

**Room strategy:** clients join rooms by geolocation cell (e.g. `geo:dhaka_central`) and by role (e.g. `role:response_team`), so broadcasts only reach clients who actually need them.

**Core events:**
| Event | Fires when | Who receives it |
|---|---|---|
| `report:new` | A report is created | Clients in that geo room |
| `report:vote` | Vote counts change | Clients viewing that report / geo room |
| `report:escalated` | A report is flagged suspicious or closed | Reporters + Admins |
| `victim:attached` | A citizen activates Victim Mode | Assigned responders |

---

## 15. Notification System

- **Storage:** every notification is a document in the `notifications` collection, queried via the `{ recipientId, read, createdAt }` compound index — no separate delivery infrastructure needed for the in-app drawer.
- **Two triggers:**
  1. **Suspicious report detection** (§17.4) → notifies Reporters + Admins with report summary data.
  2. **Proximity match** → notifies regular Users/Volunteers when a *non-suspicious* report's location matches their home address, current address, or live GPS.
- **Polymorphic by design:** the same schema and the same drawer UI show both incident alerts and account alerts (e.g. "your NID was approved").
- **Push notifications:** Firebase Cloud Messaging (FCM) token registration is planned but not required for the initial build — the schema is ready for it when needed.

---

## 16. Map System

- **Rendering:** Leaflet with free OpenStreetMap tiles via `react-leaflet` — no paid map API keys required for the shipped product (a Google Maps demo key may be used temporarily during early prototyping, but OSM is the production choice).
- **Marker color coding:**
  - 🔴 Red — Major Report **or** active Victim Mode
  - 🟠 Orange — Standard Major Report
  - 🟡 Yellow — Minor Report, unverified
  - 🟢 Green — Verified/Resolved
  - ⚫ Grey — Flagged as false
- **Clustering:** `react-leaflet-cluster` groups dense incident areas into numbered bubbles at low zoom.
- **Geospatial queries:** all "nearby" lookups use MongoDB `2dsphere` indexes (`$near` / `$geoWithin`) — filtering happens at the database layer, not in application code.

---

## 17. Core Business Workflows

### 17.1 Report Creation & Duplicate Detection
Before saving any new report, the backend checks for an existing **active** report of the same category within a radius, created in the last 3 hours:
- Minor reports: 50–100m radius
- Major reports: 500m–1km radius

If a match is found, creation is aborted with `409 Conflict` and the existing report's ID, so the frontend can redirect the citizen to upvote/comment on the existing report instead of creating a duplicate pin.

### 17.2 Victim Mode (SOS)
A citizen attaches themselves as a victim to an *existing* active report (not a new broadcast) by confirming their phone number and live GPS.

**GPS fallback:** if the device GPS fails or times out, the frontend sends `gpsStatus: 'failed'` and falls back to the user's saved `currentAddress`/`homeAddress`. Responders viewing the victim's profile then see a clear warning that the location shown is a registered address, not a live signal — so they don't waste time going to an empty home.

### 17.3 Reliability Scoring
Applies only to `User` and `Volunteer` accounts (Reporters/Response Teams/Admins are already vetted and don't need it).

- Citizens start at score `0`; scores can go negative.
- When a report is closed by an Admin or Reporter:

  `score += (valid reports × 10) − (false reports × 20)`

- If a user's score drops below **−40**, the backend automatically generates an `account_flagged` notification to Regional Admins.

### 17.4 Fake Report Detection
- **Reporter immunity:** anything submitted by a `Reporter` account is `reliability: valid` by default and skips this check entirely.
- **For Users/Volunteers**, a report is flagged suspicious if its vote pattern matches:

  `(u == 0 AND d < 2) OR (u < d AND u > 2 AND d > 2) OR (u == d AND u > 2 AND d > 2)`

  where `u` = upvotes, `d` = downvotes. Suspicious reports notify Reporters/Admins for review, but stop notifying nearby citizens until resolved.

### 17.5 Report Closing
Closing a report (`PATCH /api/reports/:id/close`) is restricted to Reporters/Admins, records `closedBy` and `closedAt`, and triggers the reliability score recalculation in §17.3.

---

## 18. Development Workflow

- **Branching:** feature branches off `main` — `feat/victim-mode`, `fix/gps-fallback`, `docs/blueprint`. No GitFlow, no release branches.
- **Commits:** Conventional Commits — `feat: add pre-creation duplicate radius check`, `fix: add validator to PointSchema`.
- **Pull before you push, always** — with a 3-person team pushing to the same repo, this is the single most effective habit against merge rejections.
- **Editor setup:** set `git config --global core.editor` to something merge-friendly (`nano` or `code --wait`) to avoid getting stuck in Vim during merge commits.

---

## 19. Coding Standards

- **Naming:** `camelCase` for variables/functions (`calculateScore`, `verifyFirebaseAuth`); `PascalCase` for React components and Mongoose models (`ReportModal.jsx`, `User.js`); `UPPER_SNAKE_CASE` for constants (`MAX_RADIUS_METERS`).
- **No magic numbers:** radius thresholds and score weights live in `constants/system.js`, not scattered inline.
- **Small functions, minimal nesting, no duplicated logic.** If a controller is doing more than "parse → call → respond," it's a candidate for a `services/` extraction.
- **Comments and logs stay professional** — this is an academic deliverable, written for review.

---

## 20. Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend |
| `FIREBASE_ADMIN_PRIVATE_KEY` (+ project ID / client email) | Firebase Admin SDK credentials |

---

## 21. Scalability Strategy

The simplicity of this architecture doesn't come at the cost of headroom:

- **Zero-join reads:** votes, comments, and victims are embedded directly in the `Report` document, so a full incident loads in a single read.
- **Offloaded auth:** Firebase absorbs the CPU cost of password hashing, OTP generation, and token signing — the Express server stays lightweight.
- **Indexed geospatial queries:** `2dsphere` indexes let MongoDB filter thousands of map points in milliseconds at the database layer.

---

## 22. Future Enhancements

Intentionally excluded from the initial build, but the schema already leaves room for them without migrations:

| Feature | Plan |
|---|---|
| **Predictive Reporting** | `type: 'predictive'` is already a valid enum value; a future ML script could ingest weather/flood data and insert predictive hazard zones directly |
| **Automated Routing (OSRM)** | Integrate Open Source Routing Machine to auto-draw the fastest responder route on the map, instead of manual coordination |
| **Automated Resource Allocation** | An algorithmic matching engine to auto-suggest optimal resource distribution (e.g. nearest ambulance to a medical report), replacing today's manual `inventory` tracking |
| **Volunteer opt-in/opt-out refinement** | Formal research into edge cases beyond the basic "can't exit while assigned" rule already in RBAC |
| **Image moderation** | Cloudinary AI moderation webhook to filter explicit/graphic content before it hits the public map |
| **Push notifications (FCM)** | Schema is ready; delivery integration is a follow-up once in-app notifications are stable |

---

## 23. Final Engineering Guidelines

- When two solutions exist, pick the one a student team can build and debug in a semester — not the "textbook correct" one.
- Every new feature should map cleanly onto one of the three collections (`User`, `Report`, `Notification`) before a new collection is even considered.
- If a piece of logic needs explaining more than twice on the team, it's a sign to simplify it, not to document it more.
- This document is the reference for what to build. If the code and this document disagree, that's a bug in one of the two — fix whichever is wrong, then move on.
