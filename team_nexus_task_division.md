# Team Nexus — Protocol Zero Task Division

**Deadline:** July 20, 2026
**Start:** July 5, 2026
**Repo:** aliazgorLab/ProtocolZero

**Team:**
- **Ali** — Frontend
- **Zabir** — Auth/Security + Notifications
- **Farhad** — Backend + Real-time

---

## Phase 1: Foundation (Jul 5 – Jul 9)

### Zabir
- [ ] Auth module end-to-end: register → OTP → login → JWT (access + refresh tokens)
- [ ] Refresh token rotation with hashed storage
- [ ] RBAC middleware (role checks per architecture §6)
- [ ] Security baseline: helmet, cors, express-rate-limit, express-mongo-sanitize

### Farhad
- [ ] Project/DB setup (MongoDB Atlas connection, Mongoose config)
- [ ] Folder structure setup per architecture §3
- [ ] Core `Report` model + GeoJSON schema
- [ ] Nearby-query endpoint (geospatial index)
- [ ] Base Express app + error-handling middleware
- [ ] Repository layer pattern

### Ali
- [ ] Vite + React scaffold
- [ ] Folder structure: `/api`, `/store`, `/pages`, `/components`
- [ ] Axios instance + token-refresh interceptor stub
- [ ] Login/Register/OTP UI screens (static, then wire to Zabir's endpoints)

**✅ Checkpoint:** Auth endpoints + Report CRUD skeleton usable by Ali.

---

## Phase 2: Core Features (Jul 10 – Jul 14)

### Zabir
- [ ] Notification system: in-app (DB-backed)
- [ ] FCM push integration
- [ ] SMS/email delivery hooks (Twilio / nodemailer)
- [ ] Wire auth/RBAC into other modules' protected routes

### Farhad
- [ ] Voting/Comments + credibility scoring logic (§8)
- [ ] Socket.io server setup — real-time rooms
- [ ] Report status events (first real-time feature)
- [ ] Volunteer/Response Team schema + basic assignment logic

### Ali
- [ ] Report submission form (with geolocation capture)
- [ ] Report feed UI
- [ ] Wire real Axios calls to Report API
- [ ] Redux slices: auth, reports
- [ ] Socket.io client integration for live report updates

**✅ Checkpoint:** Socket.io events + notification triggers wired in for live UI work.

---

## Phase 3: Integration & Advanced Features (Jul 15 – Jul 18)

### Zabir
- [ ] Full notification delivery testing (push + SMS/email fallback)
- [ ] Security hardening pass: input validation audit
- [ ] Refresh-token edge case testing
- [ ] Rate-limit tuning on sensitive routes (OTP, login)

### Farhad
- [ ] Escalation pipeline: major/minor classification
- [ ] Auto-escalate to Volunteers/Response Teams
- [ ] Parallel Admin notify (architecture decision #5, §17)
- [ ] Socket.io events: escalation, acknowledgment

### Ali
- [ ] Leaflet map integration: report markers
- [ ] Marker clustering (`react-leaflet-cluster`)
- [ ] Heatmap (`leaflet.heat`)
- [ ] Victim-mode UI + escalation status indicators
- [ ] Notification UI (toast + in-app center)

---

## Phase 4: Stabilization & Ship (Jul 19 – Jul 20)

### Everyone
- [ ] Cross-integration testing: auth → report → escalation → notification (end-to-end)
- [ ] Bug triage
- [ ] Final RBAC/permission checks
- [ ] Deployment prep: env vars (§15.3), build client, deploy server

---

## Notes & Risks

- **Blocking chain:** Ali depends on early backend skeletons from Zabir/Farhad — aim for mocked/basic APIs by Jul 7 so frontend isn't idle.
- **Overlap point:** Farhad triggers escalation, Zabir delivers the notification — sync daily starting Phase 2.
- **Out of scope for Jul 20:** Admin dashboard, analytics dashboard, and all of §16 Future Improvements — defer unless ahead of schedule.

---

## Daily Sync Suggestion
15-min standup each morning: what's done, what's blocking, what's next. Especially critical around each Phase checkpoint.
