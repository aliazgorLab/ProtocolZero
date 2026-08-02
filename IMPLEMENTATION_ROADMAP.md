# Protocol Zero — Implementation Roadmap

**Status:** Living document. Source of truth = `system_architecture.md` reconciled against actual code.
**The golden rule (from §23):** when code and architecture disagree, fix whichever is wrong, then move on. Where the code is an *intentional improvement* (Google Maps, custom email-OTP 2FA), we keep the improved design and update the doc — we do **not** force the old design onto completed, working code.

Current implementation progress estimate: **~38%** of the total build.

---

## Phase 1 — Core Infrastructure & Environmental Hygiene

### Objective
Make the codebase safe and consistent to build on: remove secrets from git, centralize constants, stand up the Socket.io backbone, and unify the client's API/map base URLs. Security at this stage is *foundational* — everything downstream broadcasts/reads through this layer.

### Tasks

**1.1 Remove secrets from git (early, critical)**

- **Built:** `server/routes/.env` and `client/.env` are currently tracked by git (verified with `git ls-files`). Delete the stray `server/routes/.env`, `git rm --cached` both files, create `.env.example` files for both apps, and rotate the committed credentials (Mongo Atlas + Firebase) since they can no longer be considered private.
- **Files:** repo `git ls-files` results, `server/.env`, `server/routes/.env`, `server/.env.example`, `client/.env.example`.
- **Dependencies:** git access; renew MongoDB Atlas user password + FIREBASE_PRIVATE_KEY.
- **Careful:** `.env` is already in both `.gitignore` files — the files being tracked is a historical artifact, so the actual fix is `git rm --cached` + rotate, not gitignore edits.
- **Edge cases:** a fresh clone must boot with only `.env.example` values documented; devs who created a `.env` must not commit a new one.
- **Testing:** `git ls-files | Select-String ".env"` returns nothing; `git status` clean of `.env`.

**1.2 Centralize constants (`constants/system.js`)**

- **Built:** Move magic numbers out of controllers/services: duplicate-detection radii (minor 100m, major 500m), 3-hour duplicate window, earth radius (`6378137`), score weights (`+10 valid / −20 false`), alert threshold (`−40`), vote-suspicion formula constants, `nearby` default radius. Refactor `report.service.js` and `report.controller.js` to import these.
- **Relates:** `server/services/report.service.js`, `server/controllers/report.controller.js`, new `server/constants/system.js`.
- **Dependencies:** none (pure refactor).
- **Careful:** keep names `UPPER_SNAKE_CASE` per §19; do not introduce user-facing behavior changes.
- **Edge cases:** duplicate-radius values must stay the same after extraction to avoid silent behavior shifts.
- **Testing:** unit assertions that `report.service.js` constants match the extracted module.

**1.3 Socket.io backbone (prerequisite for all real-time)**

- **Built:** Server-side Socket.io: initialize `io` in `server.js` (with CORS from `CLIENT_ORIGIN`), middleware to read the Bearer token from the handshake `auth`, resolve the user, and join `geo:<cell>` + `role:<accountType>` rooms. Add a small `server/socket/index.js` with `emit`/`to(room)` helpers and a public `getIo()`. No business events yet — just the transport.
- **Relates:** `server/server.js`, new `server/socket/index.js`, `client/src/services/socket.js`, `client/package.json` (socket.io-server), `server/package.json` (`socket.io` dep).
- **Dependencies:** Node event loop; CORS config already present.
- **Careful:** socket handshake must *not* create a user in the DB (idempotent); on 401 close the socket. Keep the socket module dumb (no business logic).
- **Edge cases:** connection lifecycle, server restart → clients reconnect; `socket.io-client` must send `auth: { token }` in the handshake.
- **Testing:** connect via client, assert room join server-side log, assert 401 on bad token.

**1.4 Client base URL + Vite proxy**

- **Built:** `LiveIncidentMap.jsx` uses raw `axios.get('/api/reports/nearby')`; `authSlice.js` hardcodes `http://localhost:5000/api/...`. Standardize: use `axiosInstance` everywhere, and add a Vite dev `proxy` for `/api` and `/socket.io` to `http://localhost:5000` so no hardcoded origins.
- **Relates:** `client/vite.config.js`, `client/src/api/axiosInstance.js`, `client/src/services/socket.js`, `client/src/components/LiveIncidentMap.jsx`, `client/src/features/auth/authSlice.js`.
- **Dependencies:** 1.3 for socket proxy usage.
- **Careful:** don't change the response envelope shape while switching clients; keep `axiosInstance`'s Bearer interceptor as the single source.
- **Edge cases:** dev vs build (`VITE_API_BASE_URL` in env); CORS double-origin.
- **Testing:** Run client against `npm run dev` + Vite proxy; confirm network tab shows proxied routes and Authorization headers.

### Why before the next
Without fixed secrets, everything merged leaks credentials. Without the constants module, all scoring/detection phases reference magic numbers. Without the socket backbone and clean base URLs, all business events (Phase 5–6) have nowhere to broadcast.

### Dependencies
- git + Mongo Atlas + Firebase console.

### Expected outcome
- Repo contains zero secrets. Stable shell build passes. Socket.IO connects on page load. All API calls share one configured client and one proxy path.

### Potential pitfalls
- Rotating the Mongo password breaks any old `.env` with the old string until updated.
- Socket.io CORS must mirror Express CORS for dev on 5173.

### Validation checklist
- [ ] `git ls-files` shows no `.env`; fresh clone boots with `.env.example`
- [ ] `npm run build` (client) and `node server.js` (server) both start
- [ ] Client socket connects (polling→websocket in DevTools), socket 401 path handled
- [ ] Every API call in the app goes through `axiosInstance` (grep no `axios.` outside `axiosInstance.js`)

---

## Phase 2 — Authentication & Authorization

### Objective
Close the auth loop completely: fix role-string mismatch (client lowercase vs server PascalCase enums), wire login OTP + `/register` paths with one canonical flow, enforce rate limiting at the auth boundaries, and make the client refresh/handle expired Firebase tokens.

### Tasks

**2.1 Role-string consistency (`constants/roles.js`)**

- **Built:** `client/src/constants/roles.js` exports lowercase keys (`user`, `reporter`...) but server enums are PascalCase (`User`, `Reporter`, `ResponseTeam`...). Standardize: make a single `ROLE` map (e.g. `USER: 'User'`) and strip all lowercase comparisons.
- **Relates:** `client/src/constants/roles.js`, any page doing `role === '...'`, `SelectRole.jsx`, `ResponseTeamSignUp.jsx`, `ReporterSignUp.jsx`.
- **Careful:** the accountType sent to `/auth/register` must be an enum value the server validates (`User | Volunteer | Reporter | ResponseTeam | Admin | SuperAdmin`).
- **Edge cases:** guards when user is null; newly created accounts default to `verified` User.
- **Testing:** render both signup pages, inspect the payload shows PascalCase.

**2.2 Fix ResponseTeam sub-role mismatch**

- **Built:** `ResponseTeamSignUp.jsx` offers sub-role `dispatcher`, but the server `User.role` enum is only `police | firefighter | civilsurgeon`. Replace/eliminate `dispatcher` or extend the enum deliberately.
- **Relates:** `client/src/pages/ResponseTeamSignUp.jsx`, `server/models/User.js`, `server/controllers/auth.controller.js` (`registerVettedProfessional`).
- **Careful:** decide once — extend enum or drop option — and sync both sides.
- **Testing:** submit each role → server accepts without validation error.

**2.3 Unify Login + Email OTP 2FA flow**

- **Built:** server already has `login-check` + `verify-otp` (email 2FA). `Login.jsx` gets in-flow OTP, but `OtpVerification.jsx` exists as a separate route with fake timers. Wire one canonical flow: `login` → if `requiresOtp` → navigate `/otp-verification` → `verifyOtp` action → full app. Remove the in-JSX OTP block.
- **Relates:** `client/src/features/auth/authSlice.js` (`verifyOtp`, `tempToken`), `client/src/pages/Login.jsx`, `client/src/pages/OtpVerification.jsx`.
- **Careful:** keep `tempToken` in Redux for the OTP request; never store it in `localStorage`.
- **Testing:** account with 2FA ON: enter wrong OTP → 401; correct → app. (Real or SMTP-simulated email.)

**2.4 Client-side token expiry handling**

- **Built:** Firebase ID tokens expire (~1h). Add: on 401 from `axiosInstance` response interceptor → clear auth and redirect `/login`; store `refreshToken` in `localStorage` so `signInWithPassword` can be silently repeated once.
- **Relates:** `client/src/api/axiosInstance.js`, `client/src/features/auth/authSlice.js`.
- **Drop:** do *not* implement server-side token revocation (out of scope); a silent refresh is fine for the capstone.
- **Testing:** set a short expiry on a test token in localStorage; hit a protected route after expiry → auto-redirect.

### Why before the next
Everything later (reports, notifications, sockets, admin) is behind auth; role mismatches would silently break RBAC, and a broken OTP flow would make production testing impossible.

### Dependencies
Phase 1 (env, base URL); for 6.4 nothing else.

### One-outcome
Auth is solid: any user can sign up/log in; vetted roles are pending until Admin approval; OTP path is clean; expired tokens gracefully re-login.

### Pitfalls
- Think global 401 with concurrent errors; only redirect once.
- `verificationStatus: 'pending'` gate in `auth.middleware.js` blocks *all* non-profile API calls for Report/EmicTeam — control demo feedback.

### Validation checklist
- [ ] Register / Login / Logout work in browser.
- [ ] Reporter/ResponseTeam with `pending` are blocked from report APIs (§11 vetting).
- [ ] 2FA OTP fails with wrong code, succeeds with correct (SMTP simulated prints code).
- [ ] No lowercase role strings shown anywhere in the app.

---

## Phase 3 — Database Models & Alignment

### Objectives
Model layer is already strong (`User`, `Report`, `Notification`, `PointSchema` with `2dsphere` indexes). Reinforce four gaps: (a) `resources` support on `Report` to make the Volunteer guard real, (b) verify uniqueness constraints run at DB level, (c) cleanup of stale embedded data, (d) indexes verified against the query engine (esp. `notification` compound, `report` compound).

### Tasks

**3.1 Report resources / commitment tracking**

- **Built:** `user.controller.js`'s `toggleVolunteerMode` checks `"resourcesCommitted.providerId"` on `Report` — but the schema has no such field, so the opt-out guard is dead code. Pick one correct design and implement **once**:
  - Better: add an **embedded** `resources` field on `Report` (`{ providerId, itemName, quantity, unit, createdAt }`), or a light `committedResponders` array and wire the guard to it. This unblocks §13 `PATCH /api/reports/:id/resources`.
  - Share: if you prefer minimal schema, change the guard to `Report.find({ victims: userId, status: 'active' })` (does the volunteer have an active victim attach?) and skip resources entirely. **Choose with the team, then implement.**
- **Relates:** `server/models/Report.js`, `server/models/User.js` (`inventory` exists), `server/controllers/user.controller.js`.
- **Careful:** make a decision in a comment in the code so it's not ambiguous; keep `2dsphere` index unaffected.
- **Edge case:** volunteer assigned to multiple active reports.
- **Testing:** unit test that `toggleVolunteerMode` returns 409 when resources exist, 200 otherwise.

**3.2 Composite uniqueness & indexes verification**

- **Built:** `User.phone`/`User.email` already `unique: true` (good). Verify `Report` has `{ location: 2dsphere }` + `{ status, type, createdAt }` + `{impactAreas.coordinate}` (present in source). Ensure real CRUD operations actually use them (`explain()`).
- **Relates:** `server/models/User.js`, `server/models/Report.js`, `server/models/Notification.js` — index definitions.
- **Careful:** adding a new index to an existing collection while it only runs with `--create-autoIndexes` (mongoose defaults); for staging, run `createIndexes()` explicit once.
- **Testing:** execute typical queries (`findOne({phone})`, `find({location: {$near: …}})`) and capture each `explain` plan uses the index.

**3.3 Notifications & stale fields cleanup**

- **Built:** introduce a TTL/cleanup approach (see also Phase 6): schema for `Notification` may keep `read`; the OTP fields (`emailOtp`, `otpExpires`) should be cleared after use (already done in `verifyEmailOtp`).
- **Relates:** `server/models/Notification.js`, `auth.controller.js`.
- **Could do opt:` `CreatedAt` TTL index on `otpExpires` with `expireAfterSeconds: 0`? Not necessary since cleared on use; but if someone never verifies, the tombstone remains — it's harmless.
- **Testing:** verify-opt sets `emailOtp = null` after both success/failure paths.

### Why/Relationship
Auth (Phase 2) pins role + account flows. Correct schema (esp. the guard + indexes) is a prerequisite for API (Phase 4) and business logic (Phase 5) to work without rewriting.

### Expected outcome
All model semantics stable; no schema drift; `toggleVolunteerMode` is truthful; the geospatial queries stay fast.

### Potential pitfalls
- Changing a `unique` index while old duplicates exist → write failure on registration. Check with a migration script for the team DB.
- 2dsphere index building needs a small lat/lng bounding to validate.

### Validation checklist
- [ ] `Report` has `resources` (committed view), guard verified, tests green.
- [ ] Duplicate unique key errors are caught (`11000`) → `409`.
- [ ] All queries listed among execute use the intended indexes (`explain`).
- [ ] `reset`/`verify` OTP leaves no residue.

---

## Phase 4 — API Layer Completion

### Objective
Implement full REST surface planned in §13-§14 that is still missing, keeping the `{ success, message, data }` envelope.

### Tasks

**4.1 Notifications API**

- **Built, missing:** `GET /api/notifications` (paginated, unread-first) and `PATCH /api/notifications/:id/read`.
- **Files:** new `server/controllers/notification.controller.js`, `server/routes/notification.routes.js`, mount in `server.js` (protected).
- **Dependencies:** Phase 3 model (unchanged), Phase 1 constants not needed.
- **Careful:** `userId` from `req.user._id`; never trust body `userId`; paginate with `limit/offset`, `sort: { read: 1, createdAt: -1 }` (index exists).
- **Edge cases:** empty list, stale `referenceId` (deleted report), a scalar Enum.
- **Testing:** seed notifications; GET; mark 2 read; GET again.

**4.2 Resources API**

- **Built (decisions from 3.1):**
  - `PATCH /api/resources/inventory` — Volunteer/ResponseTeam set their `inventory`.
  - `PATCH /api/reports/:id/resources` — add/update committed resources with `providerId` from `req.user`.
- **Security:** Volunteer/ResponseTeam only (RBAC middleware).
- **Testing:** `PATCH inventory`, then 2 resources on a report, assert `toggleVolunteerMode` guard behavior.

**4.3 Admin APIs**

- **Built, missing:** `GET /api/admin/flagged-users` (score < threshold) in addition to existing `pending-users` + `verifyUser`. Add `POST /api/admin/users/:id/unflag` or a reset, clearly documented.
- **Careful:** admin endpoints behind `authorizeRoles('Admin','SuperAdmin')` (already in `admin.routes.js`).
- **Testing:** create a low-score user and verify it shows.

**4.4 Report closing cleaner**

- **Built:** close is currently handled inline inside `updateReport`. Extract an explicit `PATCH /api/reports/:id/close` route (Restricted to Reporter/Admin/SuperAdmin) that sets `closedBy`, `closedAt`, `status: pending?` and triggers the score update (Phase 5 sets up).
- **Relates:** `server/controllers/report.controller.js`.
- **Testing:** non-reporter gets 403 on close; valid close sets audit fields.

### Full rationale (see above for each task) 
API defines precise behavior business logic then races into; so Phase 4 finishes the wire contract before Phase 5 logic.

---

## Phase 5 — Business Logic Services

### Objective
Implement the three "differentiating" workflows from §3 that are entirely absent today: reliability scoring (§17.3), fake-report detection (§17.4), and victory GPS fallback (§17.2).

### Tasks

**5.1 Reliability scoring (service)**

- **Built:** new `server/services/scoring.service.js`: when a report is closed, for its issuer (if `User`/`Volunteer`): `score += (validReports * 10) - (falseReports * 20)`; if `score < -40` → create `account_flagged` notification per **Regional Admin** (admins with region matching issuer — fallback `accountType:['Admin','SuperAdmin']`).
- **Relates:** `report.controller.js` (`close`), new service, `Notification.js`.
- **Careful:** score only applies to `User`/`Volunteer`; track "valid" vs "false" — use `reliability` on the report (`valid` vs `false`).
- **Edge cases:** issuer deleted; same report closed twice (guard re-entry).
- **Testing:** two closed reports (one valid, one false) → score `0 → -10`; then below-threshold creates admin alert.

**5.2 Fake-report detection**

- **`services/reliability.service.js`:** after each vote, if author isn't `Reporter`, evaluate suspicion rule:
  `(u == 0 && d < 2) || (u < d && u > 2 && d > 2) || (u == d && u > 2 && d > 2)`
  On funny match → set `report.reliability='false'`, emit `report:escalated` (socket from 1.3) to `role:reporter` + `role:admin` rooms, create a `report_escalated` notification to Reporters/Admins, and *stop* sending citizen `report:new` / `report:escalated` notifications about it until a Reporter/Admin flips `reliability` back to `valid`.
- **Relates:** `report.controller.js` (vote), `server/services/*`, `server/socket/index.js` (`emit`).
- **Careful:** the condition must be evaluated with `Number` up/down votes; skip entirely for `Reporter`/Admin/Emitting Teams (they're admin). Find "bypass" path in `report.controller.js` (`isTrustedAuthor`).
- **Edge cases:** u/d 0/0 at creation; alignment with vote change (both arrays).
- **Testing:** unit-test the 3 formula cases; integration: vote `4 up, 6 down` on a User's report → `report:escalated` emitted; citizen notifications suppressed.

**11.3 Victim GPS fallback**

- **Built:** `POST /api/reports/:id/victim` currently ignores `gpsStatus`. Accept request `{ gps, gpsStatus: 'ok'|'failed' }`: verify by saving `gpsStatus`, and if `failed`, use issuer's `currentAddressGps`/`homeAddressGps` as fallback coordinates and set a `gpsFallback: true` flag on the report's victim embed so Response Teams > display "registered address, not live signal" (matching UX concept in §17.2).
- **Edge:** both GPS and addresses all missing → return 400 with a clear message (and never silently store nothing).
- **Testing:** victim attach with `gpsStatus:'failed'` → report shows fallback flag for responder view, excluded for non-vetted.

### Full rationale
These are the system's "trust" layer and its real-time value; they're also the largest logic risk, so we build them on a clean API reference (Phase 4) — sequentially, not stacked on each other.

### Per-pitfalls
- Scoring must never mutate for `Reporter/Admin` (frozen).
- Evaluate suspicion synchronously after `save` of `vote` (not in the same request path).
- Be careful `claimingEmail` fails; wrap in DB transaction when adding score + notification together.

### Validation checklist
- [ ] Scoring unit tests pass (10 / -20 math; < -40 alert).
- [ ] Suspicion formula spot-check suites pass for all 3 clauses + bypass for Reporters.
- [ ] Output: graph of `gpsStatus`; `gpsFallback` flag.
- [ ] Socket `report:escalated` visible for reporter/admin rooms only.

---

## Phase 6 — Background Jobs & Scheduled Ops

### Objective
Introduce minimal, useful scheduled work without turning the capstone into a distributed system. Priority: (a) notifier dedup/read cleanup, (b) OAuth/time token refresh, (c) optional stale report hygiene.

### Tasks

**6.1 Notifications read-pruning (optional upkeep)**

- **What:** small interval (e.g. every 6h) deletes notifications older than N days *and* read (or archive). Keeps collection bounded for demo DB.
- **Files:** new `server/jobs/cleanup.js` started in `server.js`; uses `Notification.deleteMany({ read:true, createdAt: {$lt …} })`.
- **Careful:** run *after* index (Phase 3) to avoid lockbacks; no deletion of `account_flagged` (keep ones referencing active report).
- **Testing:** seed—run—assert count drops.

**6.2 Schedule of refresh for OTP expiry**

- **Built:** OTP is 10-min expiry; leftover `emailOtp`/`otpExpires` rows persist. A lightweight `cron` (via `node-cron`, small dep) or a TTL index on `otpExpires` to zero out — implement TTL index (simplest) `{ emailOtp: 'expiret '}` if we keep plaintext OTP in DB.
  **Decision point:** Storing raw OTP in `User` is a small risk; better: store a hash? For capstone grade, document it as acceptable, keep plaintext, rely on TTL.

**6.3 Optional: report staleness**

- If a report stays `active` beyond X hours without votes, it's fine to leave as-is (closed manually). Not required — skip unless surface demands.

### Parallelize
6.1 and 6.2 are independent and Parallelizable (separate jobs, no shared runtime beyond server.js start).

### Validation
- `npm run` jobs startup without breaking server boot; cleanup/deep-cron functional.

---

## Phase 7 — Firebase Integration & Identity Polish

### Objective
Solidify Firebase boundary: proper client auth error mapping, honest email acceptance, admin user bootstrap (seed a SuperAdmin), and make the identity contract explicit in both `READ` document and `ENSECODE` adherence.

### Tasks

**7.1 Break client error messages into domain text**

- Map Firebase REST errors in `authSlice.js` (`EMAIL_EXISTS`, `EMAIL_NOT_FOUND`, `INVALID_PASSWORD`, `USER_DISABLED`, `INVALID_ID_TOKEN`) to human-facing messages on SignUp/Login.
- **Files:** `authSlice.js`, `Login.jsx`, `SignUp.jsx`.
- **Careful:** don't leak internal tokens/URLs to toast.

**7.2 SuperAdmin/Admin seed script**

- Create `server/scripts/seedAdmin.js`: given a Firebase UID/email ensure a SuperAdmin `User` document exists (idempotent) so the team can always get into admin UI.
- **Testing:** npm script `seed:admin` creates user with `accountType:'SuperAdmin'`, `score:0`.

**7.3 Firestore not needed** — state explicitly in docs (Mongo only).

### Deployment considerations
- All Firebase client calls go through `VITE_FIREBASE_API_KEY` (present) and are never hardcoded elsewhere.
- Server-side `config/firebase.js` uses admin credentials — nothing to change.

---

## Phase 8 — Frontend: Citizen & Volunteer Experience

### Objective (main milestone)
Replace the static demo pages with live wired flows: Homewith live nearby reports + live map markers; create report; report detail with comment/vote; victim (SOS) attach with real GPS; notifications drawer fed by the notifications API + socket `report:new` events; the slices that carry them.

### Specific wiring tasks

**8.1 `reports` + `notifications` Redux slices**

- AsyncThunks calling `axiosInstance` `/reports/nearby`, `/reports`, `/reports/:id`, `/reports/:id/vote`, `/reports/:id/comment`, `/reports/:id/victim`, `/notifications`.
- Register in `store.js` (currently has only `auth`).
- **Careful:** notification socket events append to slice state; `home` must not refetch everything on each event — dedupe by `_id`.

**8.2 Live map on real data**

- Update `LiveIncidentMap.jsx`: consume `axiosInstance.get('/reports/nearby?lng&lat&radius')` (fix the `.data.reports` vs `.data` issue), color markers by `type`/`status` (§16 palette), render markers/InfoWindows; subscribe `report:new` (add) / `report:update` / `report:escalated` from the Phase 1 socket.
- Path: `client/src/components/LiveIncidentMap.jsx`.

**8.3 Hook: `useGeolocation`**

- `client/src/hooks/useGeolocation.js` — react hook returning `{coords, error, loading}` with timeout fallback to `currentAddressGps`/`homeAddressGps` when GPS fails → ties directly to Phase 5.3 `gpsStatus`.
- Used by SOS/create-report.

**8.4 SOS victim flow with real GPS fallback**

- `client/src/pages/SosFlow.jsx` → `dispatch(registerVictim({ id, gps, gpsStatus }))`, redirect to `/reports/:id`, show "you're attached" state; include the fallback UI ($13.2).
- Only exist on an *existing* report (per §17.2).

**8.5 Create report & duplicate UX**

- `CreateReport.jsx` dispatch `createReport`; on `409` (duplicate detection) navigate / upvote the existing report instead of showing a generic error.

**8.6 Response/team + profile keep static but now reachable**

- `UserProfile.jsx` already toggles 2FA; add inventory editing (via 4.2 resources API when Live), 2FA status display.

### Phase parallelism
- Phase 5 (business logic) and Phase 8 (frontend) can proceed with `tasks 8.1–8.3` in parallel once Phase 4 API contracts are frozen — mark `8.4`++* (victim path) depends on 5.3.

### Expected outcome
A citizen can: open map → see incidents → create report (minor)→ vote/comment → markself as victim in SOS with GPS (or safe fallback) → the map updates for others via socket.

### Possible pitfalls
- GeoJSON basics: always [lng, lat] ordering — create a shared helper to avoid swaps.
- Bug on `/reports/:id/vote`: comment required when downvoting → keep UI so.
- Socket cleanup `socket.off(...)` in effects to avoid duplicates.

### Validation checklist
- [ ] Home shows live nearby papers (real data).
- [ ] Create mini-report appears on the map.
- [ ] Duplicate show (constraint) redirects to existing report.
- [ ] SOS coordinates reflected to responders, fallback flagged.
- [ ] 2FA toggle — profile reports.

---

## Phase 9 — Admin & Response Team Panels

**Objective:** Build the live admin console (pending-user approve/reject, flagged list, resolution actions) and upgrade `ResponseTeamDash` to live data.

### Tasks

**9.1 Admin UI**

- Route `/admin` (admin-only via RoleRoute from Phase 2). Lists: pending users (with NID/face, approve/reject + reason → `POST /api/admin/authenticate`), flagged users (from 4.3, show score), and report moderation list to flip `reliability` to `valid` after review.
- **Files:** new `client/src/pages/admin/*`, `AppRoutes.jsx`.
- **Dependency:** Phase 5 emssion/`flagged` API.
- **Careful:** both `Report` and `User` moderation actions must use `axiosInstance` with admin role checks.

**9.2 Response Team dashboard (live)**

- Replace static table with `GET /reports` filtered `nearby` (their region) + `victims` visible (vetted path shows address/∉ and GPS) in `ResponseTeamDash.jsx`.
- Socket: `victim:attached` event → show live SOS popup (socket from Phase 1).

**9.3 Administrative recommendation / optional**

- `client/src/pages/ResponseTeamDash.jsx` — react live; keeps role gating.

Parallelizable: 9.1 and 9.2 independent (different pages/APIs).

**Validation:** admin can verify a Reporter → Reporter immediately can create major (already exists); flagged users appear and can be cleared.

---

## Phase 10 — Performance Optimization

**10.1 DB query audits**

- `getNearbyReports`: add `limit(100)` + `select()` to avoid shipping megabytes of rads.
- Notifications listing `limit/offset` already respected.
- Add proper compound indexes validated during Phase 3.
- Index `Report.vote.upvoterId/downvoterId`? Already array checks, fine.

**10.2 Client perf**

- Virtualize/cluster big marker lists (clustering already with `@googlemaps/markerclusterer`).
- Add `React.lazy` to pages in `<AppRoutes>` for lower initial bundle.
- Reduce socket event re-render (append-only).

**10.3 Mongo memory**

- Add `lean()` where read-only, `populate` limited to `name accountType face`.

## Phase 11 — Security Hardening

Tasks:
- **Rate limiting:** (middleware) `express-rate-limit` on `/auth/login-check` + `/verify-otp` + `/register` (e.g. 10 req / 15 min) per §11.
- **Validation everywhere:** add express-validator to `register-vetted`, `vote`, `victim`, `resources`; ensure no BSON-injection.
- **Roles & privacy (§12):** re-verify `getReportById` scrubs victim full data for non-vetted (done), and that socket broadcasts never expose victim PII.
- **Helmet** already active; confirm CSP not breaking maps API (add `connect-src` for Google domains).
- **No secret printing** — grep for `${process.env.` logging.
- **Input**: victim `phone` checked against token's identity (don't trust the body's phone alone).

## Phase 12 — Testing

- **Backend:** `jest` + `supertest`: unit `scoring/`, `reliability/`, duplicate detection; integration: auth, roles, reports CRUD, vote/comment/victim, notifications; socket (mock io) emit assertions.
- **Frontend:** Vitest for slices (`authSlice`, `reportsSlice`) and hooks (`useGeolocation`).
- **E2E optionally**: Playwright happy-path (signup→create report→open). Keep scope realistic for capstone.
- Include `npm test` in both packages.

## Phase 13 — Documentation

- Update `system_architecture.md`: reconcile decisions validated above (roles enum, mail-OTP 2FA, Google Maps provider, `resources` guard, real-time event list §14).
- Write `README.md` at root (setup, env, scripts).
- API reference (table in `README`).

## Phase 14 — Deployment Readiness

- One-click boot: `npm install` per package, explicit `.env.example`.
- MongoDB Atlas already configured; commit no secrets.
- Host: optionally Render/Railway / Vercel for the client preview — or keep as lab machines; write a small `DEPLOY.md` note.
- Smoke test on live URL: health check, register/login, first report, socket connection.
- Removal: `.env` files, the stray `server/routes/.env`, hardcoded URLs.

---

## Remaining project completion estimate

| | Current | After remaining |
|---|---|---|
| Backend core (auth, report CRUD, models, RBAC) | ~70% | 100% |
| Backend "trust" logic (scoring, detection, victim-fallback) | 5% | 100% |
| Backend full API (notifications, resources, closes, admin) | ~35% | 100% |
| Socket.io (server+client) | 10% | 100% |
| Frontend live data (build Citizen/Volunteer) | ~20% | 100% |
| Admin + ResponseTeam live | 0% | 100% |
| Security / performance / tests / docs / deploy | 5-10% | 100% |

**Today: ~38%** overall. **Planned end state: 100%** achieved after Phases 1–14.

## Highest-risk areas
1. **Socket.io integration (hub + + frontend events)** — freedom of many event types; mistakes desync when a 404 raceboard. Mitigate: define/dedup event contract in Phase 3 (documented events) and build proof-of-concept in Phase 1.
2. **Fake-report detection thresholds / scoring** — intertwined; one number wrong flips §17.3-17.4 everywhere. Mitigate: formula in a single service with unit tests and commentary.
3. **Geospatial correctness (lng/lat order)** — silent bug in every map/spatial query. Mitigate: shared `geo` helper + tests.
4. **Runsecurity of stored OTP + the `pending` gate UX** — either too restrictive or insecure. Mitigate: decision documented + per-role error panels.

## Recommended implementation order
Follow Phases 1 → 14 exactly. Within the first 6 phases, **do not skip** Phase 1.3 (socket backbone) or Phase 5 (trust logic) else the whole real-time/Uber premise disappears.

Feasible parallel bands (team of 3):
- Band A (Socket backend + surface) : Phase 1.3 → Phase 5 → 6
- Band B (Auth + models + APIs): Phase 2 → 3 → 4 (+ 9.1 admin flags)
- Band C (Frontend): Phase 7 → 8 (ce hitting Phases after contract frozen), → 9.2
Sync for Band boundaries after Phase 4 and 5.

## Milestones
- **M1 (Phase 2 done)** — "You can build the account and roles." Solves core.
- **M2 (Phase 4 done)** — "Fresh full REST surface" — first TRUE full-stack demo (map live + vote).
- **M3 (Phase 5 done)** — "Trust engine live": scoring + detection + victim privileges.
- **M4 (Phase 8 done)** — "Live citizen experience: create-report → map → comment → SOS w/ fallback, live updates."
- **M5 (Phase 9 done)** — Admin & ResponseTeam panels live; role lifecycle complete.
- **M6 (Phase 12 done)** — Meaningful test coverage green.
- **M7 (Phase 14 done)** — Deployed (or verified dep script), no secrets, docs aligned.

## Definition of Now Done (project DoD)
The project is DONE when all the following are true:

1. **No secrets** in the repo or history; env guides in `.env.example`.
2. **Auth** — Firebase register/login, email-OTP 2FA path, identity persistence, 401→refresh works; vetted roles pending→admin-approved.
3. **RBAC** honored everywhere (Registered major gate, victim-privacy s&v, volunteer exit guard, reporter edit boundaries, admin-only admin actions).
4. **APIs** — all defined §13 endpoints implemented with the `{success, message, data}` envelope; 404/401/403/409/422 semantics consistent.
5. **Business logic** — scoring (§17.3), suspicion detection (§17.4) with by-rise/reporter room notifications, close route with audit trail (§17.5), victim GPS fallback (§17.2).
6. **Real-time** — client map reflects `report:new | update | escalate`, `victim:attached` for responders via Socket.IO with room scoping.
7. **Notifications** — SITS: read drawer; get/read routes; polymorphic (report/account).
8. **Frontend** — citizen/user/volunteer flows, dashboard UI all driven by API + state, admin/respond tom dashboards functional.
9. **Performance** — geo queries index-mapped, client maps cluster, pages lazy.
10. **Security** — rate limits, validators everywhere, no PII/PII-leak through sockets, CSP compatible with maps.
11. **Tests** — unit (scoring/reliability/dedup) + integration (auth/RBAC/reports/notify) pass; `npm test` green for server & client.
12. **Docs** — `README.md` (setup + env + API table + deploy note); `system.md` updated to match shipped design.
13. **Deployment loss overnight** — boot empty ````, `npm run build`, start; health check passes on Production URL; **zero warnings/secrets**.
```

When every check above is a verified `✓`, **Protocol Zero is feature-complete**. That's your finish line.
```