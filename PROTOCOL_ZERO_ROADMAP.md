# Protocol Zero — Implementation Roadmap

A simple, working prototype. Six phases. Nothing here is optional infrastructure — it's either broken and needs fixing, or missing and needed for the demo.

---

# Current Project Understanding

## What it does

Citizens report incidents on a map. Nearby users vote to sort real reports from noise. Vetted Reporters and Response Teams get notified. Someone in danger can attach themselves to an active report as a victim and share GPS, falling back to their saved address if GPS fails.

## Stack

React (Vite) + Redux Toolkit + Tailwind on the client. Express + Mongoose + Socket.io on the server. MongoDB Atlas with three collections (`User`, `Report`, `Notification`). Firebase owns authentication; MongoDB stores profiles only. Map is Google Maps in the code (the doc says Leaflet — see below).

Flow is flat and should stay flat: route → controller → service (only where logic is non-trivial) → model.

## What already works

- **Models** — `User`, `Report`, `Notification`, `PointSchema` with `2dsphere` indexes. Solid, barely needs touching.
- **Auth** — Firebase token verification middleware, idempotent `/auth/register` profile sync, email-OTP 2FA on the backend.
- **Report CRUD** — create, nearby, detail, update, vote, comment, victim-attach. Duplicate-radius check works.
- **Service extraction** — `report.service.js` already holds the geospatial and notification logic.

## What's broken

- `server/routes/.env` and `client/.env` are **tracked by git**.
- Client role strings are lowercase (`reporter`), server enums are PascalCase (`Reporter`). Every client-side role check silently fails.
- `toggleVolunteerMode` guards on `Report.resourcesCommitted`, a field that doesn't exist. Dead code.
- `ResponseTeamSignUp.jsx` offers a `dispatcher` role the schema rejects.
- `<RoleRoute>` is commented out in `AppRoutes.jsx`.
- OTP has two competing client paths (inline in `Login.jsx` plus a separate `OtpVerification.jsx` with fake timers).
- `LiveIncidentMap.jsx` uses raw `axios`; `authSlice.js` hardcodes `localhost:5000`.

## What's missing

Reliability scoring, fake-report detection, Socket.io entirely, notification retrieval endpoints, the resources API, and the admin dashboard.

**Roughly 35–40% done.** The skeleton is good; the interesting parts aren't built.

## Three decisions to make in the first hour

Write them in a comment at the top of the relevant file so nobody re-opens them:

1. **Map** — code uses Google Maps, doc says Leaflet/OSM. If Google already renders markers and clustering, keep it and update the doc. Just restrict the API key by domain. If it's not working yet, switch to Leaflet — it's free and needs no key.
2. **2FA** — code does Firebase password + custom email OTP as a second factor. That's better than what the doc describes. Keep it, update the doc.
3. **Volunteer guard** — add a `resourcesCommitted` array to `Report` so the existing guard becomes real. This also gives you the resources endpoint for free.

---

# Implementation Roadmap

---

## Phase 1 — Fix What's Broken

### Goal
Stop the bleeding and make the codebase consistent before adding anything to it.

### Why now
Committed secrets get worse with every push. And a role-casing mismatch produces bugs that look like business-logic bugs — you don't want to debug that later.

### Tasks

**1.1 Remove and rotate secrets**
- Delete `server/routes/.env`. `git rm --cached` both `.env` files. Add `.env.example` to each package.
- Rotate the MongoDB Atlas password and the Firebase private key — once committed, they're public.
- `.env` is already gitignored; the tracking is historical, so gitignore edits won't help. `rm --cached` + rotate is the fix.
- **Verify:** `git ls-files | grep .env` returns nothing.
- **Tell the team before you rotate** — everyone's local `.env` breaks until they update it.

**1.2 One role vocabulary**
- Rewrite `client/src/constants/roles.js` to match the server exactly: `{ USER: 'User', VOLUNTEER: 'Volunteer', REPORTER: 'Reporter', RESPONSE_TEAM: 'ResponseTeam', ADMIN: 'Admin', SUPER_ADMIN: 'SuperAdmin' }`. Replace every lowercase comparison.
- Remove the `dispatcher` option from `ResponseTeamSignUp.jsx` (or add it to the enum — pick one).
- **Files:** `roles.js`, `SelectRole.jsx`, `ReporterSignUp.jsx`, `ResponseTeamSignUp.jsx`.
- **Verify:** `grep -rn "'reporter'\|'admin'" client/src` is empty; signup payloads show PascalCase.

**1.3 Constants file**
- `server/constants/system.js`: duplicate radii, 3-hour window, score weights (+10/−20), flag threshold (−40), default nearby radius.
- Copy the values **out of the existing code** — don't guess. Plan A said 50m, Plan B said 100m; go look.
- **Verify:** duplicate detection still returns 409 for the same test coordinates.

**1.4 One HTTP client**
- Everything through `axiosInstance`. Delete the hardcoded `localhost:5000` and the raw `axios.get`. Add a Vite proxy for `/api` and `/socket.io`.
- **Files:** `vite.config.js`, `axiosInstance.js`, `authSlice.js`, `LiveIncidentMap.jsx`.
- **Verify:** `grep -rn "axios\." client/src | grep -v axiosInstance` is empty.

**1.5 Turn RBAC back on**
- Uncomment `<RoleRoute>` in `AppRoutes.jsx`, wire it to 1.2's constants.
- Frontend guards are UX only — the server middleware stays the real gate.
- **Verify:** log in as `User`, hit `/admin` directly → redirected.

**1.6 Seed a SuperAdmin**
- `server/scripts/seedAdmin.js` + an `npm run seed:admin` script. Idempotent.
- You can't test anything admin-related without this. Do it now, not later.

---

## Phase 2 — Finish the Backend API

### Goal
Every endpoint in §13 exists, role-guarded, returning `{ success, message, data }`.

### Why now
The frontend and the business logic both code against these. Freeze the contracts once.

### Tasks

**2.1 Schema fixes**
- Add `resourcesNeeded: [{ itemName, quantity, unit }]` to `Report`.
- Add `resourcesCommitted: [{ providerId, itemName, quantity, unit, createdAt, location }]` to `Report`.
- Add `editHistory: [{ editorId, editedAt, previousState }]`, plus `updaterId`, `closedBy`, and `closedAt` to `Report` for robust accountability.
- Add `gpsStatus` and `gpsFallback` to the victim entries in `Report` — the fallback has nowhere to be stored right now.
- **Careful:** turning `victims[]` into subdocuments breaks any `.populate('victims')` — becomes `.populate('victims.userId')`.

**2.2 Shared geo helper**
- `utils/geo.js` on both client and server (same file, copied): `toPoint(lng, lat)`, `fromPoint()`, `geoCell(lng, lat)` → `` `geo:${lat.toFixed(1)}:${lng.toFixed(1)}` ``, and `neighborCells()` returning the 9 surrounding cells.
- GeoJSON is `[longitude, latitude]` — backwards from how everyone speaks. Never write a bare coordinate array anywhere else.
- **Verify:** a known coordinate produces the expected cell; its own cell is in its neighbor list.

**2.3 Notifications API**
- `GET /api/notifications` (paginated, `sort: { read: 1, createdAt: -1 }`) and `PATCH /api/notifications/:id/read`.
- **Files:** new `notification.controller.js`, `notification.routes.js`, mount in `server.js`.
- User comes from `req.user._id`, never the body. Check ownership before marking read.
- **Verify:** seed 5, GET unread-first, mark 2, GET again.

**2.4 Resources API (Decoupled Logic)**
- `PATCH /api/reports/:id/resources-needed`: Only the Report Author can list/decrease required supplies. No automated math.
- `PATCH /api/reports/:id/resources`: **ResponseTeam only.** Pushes official assets (e.g., firetrucks) with their coordinates publicly.
- `PATCH /api/resources/inventory/deduct`: **Volunteers only.** Deducts supplies from their personal profile inventory when they deploy. They do not edit the report directly; coordination is done purely through the comments array.

**2.5 Report Edits & Close Route**
- **Strict RBAC Rule:** If authored by a Reporter, only that Author or Admin can edit/close. If authored by a User/Volunteer, the Author, ANY Reporter, or Admin can edit/close.
- **Edit History:** `updateReport` must take a full snapshot of the report's current state and push it into `editHistory` before saving changes.
- **Close Route:** Pulled closing out into `PATCH /api/reports/:id/close`. Sets `closedBy`, `closedAt`, and a final `reliability` of `valid` or `false`. Closing an already-closed report → 409.

**2.6 Admin endpoints**
- `GET /api/admin/flagged-users` (score below threshold) and `PATCH /api/admin/reports/:id/reliability` so a wrongly-flagged report can be restored. Without the second one, a false positive is permanent.

**2.7 Basic validation**
- `express-validator` on create-report, vote, victim, resources, register-vetted. Reject keys with `$` or `.` in them.
- One shared error-handler middleware formats failures — don't repeat try/catch in every controller.
- Status codes: 400 malformed, 401 unauthenticated, 403 wrong role, 404 missing, 409 conflict.

---

## Phase 3 — Real-Time (Socket.io)

### Goal
Authenticated, room-scoped broadcasting.

### Why now
Phase 4 needs to emit escalation events. Build the transport first so you debug "does the socket work" separately from "is the formula right."

### Tasks

**3.1 Server side**
- Init `io` in `server.js` with CORS from `CLIENT_ORIGIN`. Handshake middleware reads the token from `socket.handshake.auth.token`, verifies it via the Admin SDK, joins `role:<accountType>` and the user's `geoCell`.
- `server/socket/index.js` exposes `getIo()` and `emitToRoom()`. Transport only — no business logic in here.
- The handshake authenticates an existing user; it must never create one. Bad token → disconnect cleanly.

**3.2 Client side**
- `client/src/services/socket.js` (singleton, sends `auth: { token }`) and `hooks/useSocket.js`.
- **Always `socket.off()` in effect cleanup** — otherwise you get duplicate handlers and reports appearing twice.

**3.3 Wire three events**
- `report:new` and `report:vote` → the 9 cells around the report. `victim:attached` → `role:ResponseTeam` and `role:Reporter`.
- Emit **after** the DB write succeeds.
- Send a small payload — id, type, status, coordinates, vote counts. **Never a populated document**, or you'll broadcast victim phone numbers to everyone listening.
- **Verify:** two browsers, same area — create in one, marker appears in the other.

---

## Phase 4 — Business Logic

### Goal
The three workflows that make this project more than a map with pins.

### Why now
API and sockets are stable, so a failure here is a logic failure and nothing else. This is the highest-value phase — protect time for it.

### Tasks

**4.1 Reliability scoring** (`services/scoring.service.js`)
- On close, if the issuer is `User` or `Volunteer`: **recompute** `score = (validCount × 10) − (falseCount × 20)` from their closed reports.
- The doc writes this as `score += ...` with totals on the right — read literally, scores compound. Recomputing is idempotent and simpler to test.
- Below −40 → create an `account_flagged` notification for Admins. (The doc says "Regional Admins" but there's no region field — notify all Admins and note it.)
- Reporters, Response Teams and Admins are never scored.
- **Verify:** one valid + one false close → −10. Another false → −30. Another → −50 plus an admin notification.

**4.2 Fake-report detection** (`services/reliability.service.js`)
- Called from the **vote handler only**, after the vote saves. Skip entirely if the author is a Reporter.

```js
function isSuspicious(u, d) {
  if (d === 0) return false;                  // a brand-new 0/0 report is not suspicious
  if (u === 0 && d < 2) return true;
  if (u <= d && u > 2 && d > 2) return true;  // §17.4 clauses 2 and 3 merged
  return false;
}
```

- **Important:** §17.4's first clause as written (`u == 0 AND d < 2`) is true for every freshly created report, which would flag everything and silently kill all citizen notifications. The `d === 0` guard is the fix.
- On a match: set `reliability: 'false'`, emit `report:escalated` to Reporter/Admin rooms, notify them, and stop notifying citizens until an admin restores it via 2.6.
- Read `u`/`d` from the saved document — a vote switch changes both arrays.
- **Verify:** unit test all three clauses plus the 0/0 case and the Reporter bypass.

**4.3 Victim GPS fallback**
- `POST /api/reports/:id/victim` accepts `{ gps, gpsStatus }`. On `'failed'`, use the saved `currentAddress`/`homeAddress` coordinates and set `gpsFallback: true`.
- If GPS failed **and** no saved address exists → 400 with a clear message. Never store a victim with no location.
- Attaches to an existing active report only — never creates one.
- **Verify:** attach with GPS blocked → responder view shows the fallback warning; citizen view still sees only name and photo.

---

## Phase 5 — Frontend

### Goal
The citizen loop working end to end, live.

### Why now
Contracts are frozen. 5.1–5.3 can start in parallel with Phases 3–4 if you have the people.

### Tasks

**5.1 Redux slices** — `reportsSlice` and `notificationsSlice` with thunks over `axiosInstance`. Register both in `store.js` (currently `auth` only). Socket events **append** to state; they don't trigger refetches. Dedupe by `_id`.

**5.2 Live map** — `LiveIncidentMap.jsx` on real data. Fix the `.data.reports` vs `.data` shape mismatch. Add `.limit(100)` and `.lean()` server-side. Subscribe to `report:new`, `report:vote`, `report:escalated`. Marker colors, in priority order: 🔴 active victim → 🟠 major → 🟡 minor unverified → 🟢 verified/closed → ⚫ flagged false. (§16 lists red twice — this resolves it.)

**5.3 `useGeolocation` hook** — returns `{ coords, error, loading, gpsStatus }` with a ~10s timeout that resolves to `failed` instead of hanging. Note: browsers block geolocation on non-HTTPS origins other than `localhost` — test this on the actual demo machine early.

**5.4 SOS flow** — `SosFlow.jsx` dispatches `registerVictim({ id, gps, gpsStatus })`, shows an "attached" state, and displays the "registered address, not a live signal" warning when `gpsFallback` is true.

**5.5 Create report** — on `409`, navigate to the existing report and prompt an upvote instead of showing a generic error. That's the entire point of duplicate detection.

**5.6 Notification drawer** — header component in `DashboardLayout`. Unread count, list, mark-as-read, live append.

**5.7 Login/OTP cleanup** — one path: login → `requiresOtp` → `/otp-verification` → `verifyOtp` → app. Delete the inline OTP block from `Login.jsx` and the fake timers. Keep `tempToken` in Redux, never `localStorage`.

**5.8 Token expiry** — get fresh tokens from the Firebase SDK's `getIdToken()` inside the axios request interceptor. On a real 401, clear auth and redirect once (not once per concurrent request). Don't store a refresh token in `localStorage` — the SDK already handles this.

**5.9 Inventory UI** — add/remove items in `UserProfile` for Volunteers and Response Teams.

---

## Phase 6 — Admin Panels and Wrap-Up

### Goal
Close the role lifecycle and make the project presentable.

### Tasks

**6.1 Admin console** — `/admin`, role-guarded. Three lists: pending Reporters/Response Teams (approve/reject), flagged users, and escalated reports to restore. Without the third, a false positive can only be fixed from a Mongo shell.

**6.2 Response Team dashboard** — replace the static table with live nearby reports, full victim details on the vetted path, and a popup on `victim:attached`.

**6.3 Quick security pass** — half a day, not a phase:
- Rate-limit `/auth/login-check`, `/verify-otp`, `/register` with `express-rate-limit` (~10 per 15 min, loose enough not to trip during a demo).
- Hash the OTP before storing it (`crypto.createHash('sha256')`, no new dependency) and clear it after use.
- Check that socket payloads carry no victim contact info — connect as a citizen and read the frames in DevTools.
- `grep -rn "process.env" server | grep console` → nothing.

**6.4 A few tests** — Jest on the three pure functions where the real risk is: `isSuspicious()` (all clauses + 0/0 + Reporter bypass), the scoring recompute, and `geoCell()`. Skip integration suites and E2E — a manual walkthrough covers those for a fraction of the effort.

**6.5 README and doc reconciliation** — root `README.md`: setup, env vars, scripts, endpoint table, demo steps. Update `system_architecture.md` for the three decisions (map, 2FA, `resourcesCommitted`), the §16 palette, and the §17.4 guard.

**6.6 Smoke test** — from a clean clone: install → configure from `.env.example` → seed admin → register → login with OTP → create report → see it live in a second browser → SOS with GPS blocked → admin approves a Reporter. If that passes on a machine that's never run the project, you're done.

---

# Final Development Sequence

1. Remove and rotate secrets
2. Role vocabulary, constants file, single axios instance, RoleRoute back on, seed admin
3. Schema fixes (`resourcesCommitted`, victim GPS fields) and the geo helper
4. Notifications API, Resources API, close route, admin endpoints, validation ← **contracts frozen**
5. Socket backbone (server + client) and the three base events
6. Reliability scoring
7. Fake-report detection
8. Victim GPS fallback
9. Redux slices, live map, `useGeolocation`
10. SOS flow, duplicate UX, notification drawer, login/OTP cleanup, token expiry
11. Admin console and Response Team dashboard
12. Security pass, tests, README, smoke test

**With three people,** split after step 4:
- **A:** steps 5–8 (sockets + logic)
- **B:** steps 9–10 (citizen frontend)
- **C:** step 11 (admin), then step 12

Sync after step 8, where A's events meet B's and C's listeners.

---

# Milestones

| | Reached when | Meaning |
|---|---|---|
| **M1** | Steps 1–2 | Repo is safe and consistent. Roles work end to end. |
| **M2** | Steps 3–4 | Full API surface. Demoable in Postman. |
| **M3** | Step 5 | Two browsers, one map, live markers. First impressive demo. |
| **M4** | Steps 6–8 | Trust engine works. The project is now distinctive. |
| **M5** | Steps 9–10 | Full citizen story in the browser. |
| **M6** | Steps 11–12 | Every role has a working surface; documented and presentable. |

If time gets tight, **M4 and M5 are the ones that can't be cut.** Tests can shrink to the three unit tests; the admin panel can be minimal. But without scoring, detection, and live updates, this is just a map with pins.

---

# Risks and Things To Avoid

**The four bugs most likely to cost you a day each:**

1. **`[lng, lat]` ordering.** GeoJSON puts longitude first; every map library and every human says latitude first. A swap returns nothing, or drops markers in the ocean, with no error anywhere. Route everything through `utils/geo.js`.
2. **The zero-vote flag.** Implemented literally, §17.4 flags every report at creation and silently disables all citizen notifications. Guard on `d === 0`.
3. **Socket room name drift.** If client and server compute cells differently, everything connects, nothing errors, and no message arrives. One shared helper; log joined rooms server-side while testing.
4. **PII in socket payloads.** §12's privacy scrubbing lives in the controllers — sockets bypass it entirely. Build lean payloads by hand.

**Don't build:**

- Background jobs, cron, TTL cleanup. A demo DB doesn't need pruning.
- A performance phase. `.limit()`, `.lean()`, and `React.lazy` are enough and are already folded in above.
- E2E tests, Playwright, coverage thresholds.
- A refresh token in `localStorage` — Firebase already handles refresh.
- A `services/` file per controller. Services are for scoring, reliability, and geospatial math. Simple CRUD stays in the controller.
- A `utils/` grab-bag. `utils/geo.js` is one focused module, not the start of a collection.
- A regions subsystem for "Regional Admins." Notify all admins.
- Anything from §22 — FCM, OSRM, predictive reports, image moderation. List them as future work.
- A rewrite of the working map to match the doc. Update the doc instead.

**Process:** three people on one repo means pulling before every push. Freeze API contracts at step 4 and treat later changes as a conversation, not a commit.

---

# Definition of Done

**Repo**
- [ ] No `.env` tracked by git; credentials rotated; `.env.example` in both packages
- [ ] No magic numbers outside `constants/system.js`
- [ ] Role strings PascalCase everywhere

**Auth**
- [ ] Register, login, OTP, logout work through one path
- [ ] OTP stored hashed with an expiry, cleared after use
- [ ] Expired tokens refresh silently; real 401s redirect once
- [ ] Pending Reporters/Response Teams blocked until approved
- [ ] Server-side RBAC enforced independently of route guards

**API**
- [ ] Every §13 endpoint exists with the `{ success, message, data }` envelope
- [ ] Consistent status codes (400/401/403/404/409)
- [ ] Duplicate detection returns 409 with the existing report ID

**Logic**
- [ ] Scoring recomputes correctly and can't double-apply
- [ ] Below −40 generates an admin notification
- [ ] Detection runs only on votes, never flags a 0/0 report, bypasses Reporters
- [ ] Escalated reports suppress citizen notifications **and can be restored**
- [ ] Victim fallback works; returns 400 when no location exists at all

**Real-time**
- [ ] Socket authenticates via Firebase token, rejects bad ones
- [ ] Rooms scoped by geo cell and role; no victim PII in any payload
- [ ] All four events deliver to the right rooms

**Frontend**
- [ ] Every request goes through `axiosInstance`
- [ ] Map shows live color-coded reports, updating without refresh
- [ ] Citizen loop works: view → create → vote/comment → SOS with fallback
- [ ] Duplicate submission redirects to the existing report
- [ ] Notification drawer updates live
- [ ] Admin approves, views flagged users, restores escalated reports
- [ ] Response Team sees live SOS with correct fallback labelling

**Delivery**
- [ ] The three unit tests pass
- [ ] README covers setup, env, scripts, endpoints, demo steps
- [ ] `system_architecture.md` matches what shipped
- [ ] Clean clone completes the 6.6 smoke test
