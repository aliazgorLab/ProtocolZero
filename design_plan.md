# Protocol Zero — Master Execution Design Plan (Remaining Scope)

**Status:** Active Master Execution Guide  
**Purpose:** Precise, step-by-step engineering instructions for AI agents and developers to complete all remaining frontend, backend, socket, and database features of Protocol Zero.

---

## 🎯 Executive Overview & Scope

Protocol Zero's core infrastructure (Firebase Auth, Report CRUD, Geospatial 2dsphere indexing, Base Socket.io transport, Google Maps integration, Vetted Registration, and Comment Notifications) is fully built and operating in production.

This document covers **100% of the remaining work** required to take Protocol Zero to complete, production-ready status.

---

# 🚀 Phase 1: Fixed Emergency Resource Taxonomy & Logistics System

### Objective
Eliminate free-text resource input. Establish an immutable, standardized emergency resource taxonomy across server and client, allowing Report Authors to request precise supplies, Response Teams to commit official units, and Volunteers to manage personal emergency inventory.

### 1.1 Server-Side Resource Taxonomy (`server/constants/resources.js`)
Create `server/constants/resources.js` defining the official emergency resource catalog:
```javascript
const RESOURCE_TAXONOMY = [
  { id: "water_packets", name: "Drinking Water (bottle)", category: "Water", defaultUnit: "bottles" },
  { id: "dry_food_kits", name: "Dry Food Rations", category: "Food", defaultUnit: "kits" },
  { id: "first_aid_kits", name: "First Aid Medical Kits", category: "Medical", defaultUnit: "kits" },
  { id: "emergency_blankets", name: "Emergency Blankets", category: "Shelter", defaultUnit: "units" },
  { id: "tarpaulins_tents", name: "Tarpaulins & Tents", category: "Shelter", defaultUnit: "units" },
  { id: "rescue_boats", name: "Rescue Boats", category: "Equipment", defaultUnit: "boats" },
  { id: "ambulances", name: "Ambulance Vehicles", category: "Response", defaultUnit: "vehicles" },
  { id: "fire_trucks", name: "Fire Trucks / Engine Units", category: "Response", defaultUnit: "vehicles" },
  { id: "heavy_excavators", name: "Heavy Excavators / Earthmovers", category: "Equipment", defaultUnit: "vehicles" },
  { id: "portable_generators", name: "Portable Power Generators", category: "Equipment", defaultUnit: "units" },
  { id: "sandbags", name: "Flood Sandbags", category: "Supplies", defaultUnit: "bags" },
];
```

### 1.2 Resource Schema & Validator (`server/middleware/validators.js`)
Update `Report.js` and `validators.js`:
- Validate that any `itemName` submitted in `resourcesNeeded` or `resourcesCommitted` exists within `RESOURCE_TAXONOMY`.
- Ensure `quantity` is a positive integer (`> 0`).

### 1.3 Resource API Endpoints (`server/controllers/resource.controller.js`)
- `GET /api/resources/taxonomy` — Public endpoint returning the `RESOURCE_TAXONOMY` array for dropdowns.
- `PATCH /api/reports/:id/resources-needed` — Restrict to Report Author or Admin. Body: `{ resourcesNeeded: [{ itemId, quantity }] }`.
- `PATCH /api/reports/:id/resources` — Restrict to `ResponseTeam` role only. Body: `{ resourcesCommitted: [{ itemId, quantity, location }] }`. Emits socket event `report:resource_committed` to geo room and report view.
- `PATCH /api/users/inventory/deduct` — Restrict to `Volunteer` role. Deducts deployed supplies from their personal profile inventory when responding.

### 1.4 Frontend Resource UI Integration
- Update `CreateReport.jsx` and `ReportDetail.jsx`: Replace all text inputs for resources with custom searchable dropdowns populated by `RESOURCE_TAXONOMY`.
- Add "Official Assets Committed" visual panel on `ReportDetail.jsx` showing Response Team deployments with live Google Maps coordinate pins.

---

# 🔐 Phase 2: Registration OTP Verification Flow

### Objective
Prevent unverified or fake accounts from ever touching MongoDB by enforcing 6-digit Email OTP verification during the registration step.

### 2.1 OTP Pre-Registration Protocol
1. User completes registration form on `/signup` (Citizen/Volunteer) or `/signup/vetted` (Vetted Professional).
2. Client sends pre-registration request: `POST /api/auth/send-registration-otp` with `{ email, phone }`.
3. Server generates 6-digit OTP, hashes it using SHA-256 with a 10-minute expiry, sends email via Nodemailer/Firebase, and returns `{ tempRegistrationToken }`.
4. Client navigates to `/otp-verification` holding `tempRegistrationToken` and registration payload in Redux state.
5. User enters 6-digit OTP and submits.
6. Client calls `POST /api/auth/verify-registration-otp` with `{ tempRegistrationToken, otp, registrationData }`.
7. Server validates OTP:
   - On mismatch/expiration: returns `400 Bad Request`.
   - On success: clears OTP, registers user profile in MongoDB, and completes auth session.

### 2.2 Frontend Registration Integration
- Update `SignUp.jsx` and `VettedRegistration.jsx` to trigger the OTP modal/screen before final submission.
- Update `OtpVerification.jsx` to support both Login 2FA verification and Registration OTP verification seamlessly.

---

# 👮 Phase 3: Complete Admin Moderation Panel & Verification Workflow

### Objective
Fully operationalize `/admin` for platform administrators to verify vetted professionals, review flagged users, and moderate community-flagged false reports.

### 3.1 Tab 1: Pending Vetted Applications (`/admin#pending`)
- **Backend**: `GET /api/admin/pending-users` (returns users where `verificationStatus == 'pending'`).
- **Backend Action**: `PATCH /api/admin/users/:userId/verify` Body: `{ status: 'verified' | 'rejected', reason?: string }`.
- **Automated Workflow**:
  - Updates `user.verificationStatus`.
  - Creates database `Notification` for applicant.
  - Emits real-time socket event `user:verification_updated` to `user:<userId>`.
  - Upon approval, unlocks full operational privileges (`Reporter` or `ResponseTeam`).
- **UI Components (`Admin.jsx`)**:
  - Verification cards displaying Full Name, Role, NID Number, Agency/Station Name, Office Address, and expandable Facial/ID Document image.
  - Approve & Reject action buttons with optional rejection reason modal.

### 3.2 Tab 2: Flagged Users Review (`/admin#flagged-users`)
- **Backend**: `GET /api/admin/flagged-users` (returns users with `score <= -40`).
- **UI Components (`Admin.jsx`)**:
  - Displays user score, total valid vs false reports issued, phone number, and status.
  - Action buttons: `View User History`, `Issue Official Warning`, `Reset Score`, or `Suspend User`.

### 3.3 Tab 3: Escalated & Suspicious Reports (`/admin#escalated-reports`)
- **Backend**:
  - `GET /api/admin/escalated-reports` (returns reports with `reliability == 'false'` or flagged by fake-report engine).
  - `PATCH /api/admin/reports/:id/reliability` Body: `{ reliability: 'valid' | 'false' }`.
- **UI Components (`Admin.jsx`)**:
  - Reports card displaying Post ID, Category, Author Name, Upvotes vs Downvotes ratio, and community downvote comments.
  - `Restore Report (Mark Valid)` button: Restores report to `reliability: 'valid'`, clears false flag, resumes citizen notifications.
  - `Confirm Fake & Close` button: Permanently closes report as `reliability: 'false'` and applies -20 score penalty to issuer.

---

# 👤 Phase 4: User Profile & Geolocation Address Management

### Objective
Enable users to manage their profile, toggle roles, and configure `homeAddress` and `currentAddress` with interactive map pickers.

### 4.1 Address Geolocation & Map Integration
- **Backend**: `PATCH /api/users/profile` accepts `homeAddress`, `homeAddressGps`, `currentAddress`, `currentAddressGps`.
- **Frontend (`UserProfile.jsx`)**:
  - Add "Location & Addresses" card with interactive Google Map pickers.
  - Users can type an address or click directly on the map to place pins for 🏠 Home Address and 📍 Current Address.
  - Synchronizes lat/lng GeoJSON `Point` coordinates (`[longitude, latitude]`).

### 4.2 Volunteer Inventory & Mode Toggle
- Allow Volunteers to add/remove items in their personal inventory using the `RESOURCE_TAXONOMY` catalog.
- Mode Toggle (`User` ↔ `Volunteer`): Prevent reverting to `User` if assigned to an active report victim or resource commitment.

### 4.3 Interactive Map Layer (`InteractiveMap.jsx`)
- Render user's saved 🏠 Home Address and 📍 Current Address as optional reference layers on `InteractiveMap.jsx` with distinct visual pin icons.

---

# 🚑 Phase 5: Response Team Operations Dashboard

### Objective
Provide a dedicated operational command view (`/response-team/dashboard`) for Police, Firefighters, and Civil Surgeons.

### 5.1 Dual-Pane Operational Interface (`ResponseTeamDash.jsx`)
- **Left Pane (Live Incident Queue)**:
  - Lists active emergency reports sorted by proximity and severity (Major first).
  - Shows victim count, committed assets, and SOS alerts.
- **Right Pane (Command Map)**:
  - Google Map displaying active incidents, victim location markers, and committed official units.
  - Click on victim pin shows full contact info & live GPS (or fallback address indicator).

### 5.2 One-Click Asset Deployment Modal
- Response teams click "Commit Official Assets" on any report queue item.
- Select asset type from `RESOURCE_TAXONOMY` (e.g. Ambulance, Fire Truck).
- Pick deployment coordinates on map.
- Submits `PATCH /api/reports/:id/resources`, updates report state, and broadcasts real-time socket event.

---

# 🔔 Phase 6: Notification Drawer & Real-Time Navigation

### Objective
Ensure 100% of system notifications (comments, verification alerts, proximity reports, account flags) route seamlessly to target pages upon user click.

### 6.1 Interactive Notification Drawer & Page (`/notifications`)
- Header badge showing unread count.
- Action: "Mark All as Read" (`PATCH /api/notifications/read-all`).
- Row click handlers:
  - `report_comment` / `report_created` / `report_escalated` → Navigates directly to `/reports/:id`.
  - `account_verification_pending` / `account_verification_status` → Navigates to `/profile` or `/admin`.

---

# 🧪 Phase 7: Quality Assurance, Security Pass & System Verification

### Objective
Perform end-to-end verification, security hardening, and final smoke test.

### 7.1 Security Pass
- Verify no PII (phone numbers, NID, face images) is leaked in public Socket.io broadcasts.
- Ensure all route endpoints enforce strict RBAC middleware.
- Confirm input sanitization against NoSQL injection (`$` and `.`).

### 7.2 End-to-End Walkthrough Script
1. Admin seeds via `npm run seed:admin` and logs into `/admin`.
2. Vetted Reporter registers at `/signup/vetted` → receives OTP → Admin approves application in `/admin#pending`.
3. Citizen creates Minor report → duplicate check intercepts if within 200m/3hr.
4. User downvotes with comment → report issuer receives notification & socket alert.
5. User triggers SOS → fallback to home address if GPS unavailable → Response Team sees live alert on `/response-team/dashboard`.
6. Response Team commits official Fire Truck from taxonomy → updates report in real-time.

---

## 📋 Execution Roadmap Table

| Phase | Core Deliverable | Primary Files Touched |
|---|---|---|
| **Phase 1** | Fixed Resource Taxonomy & Allocation | `server/constants/resources.js`, `resource.controller.js`, `CreateReport.jsx`, `ReportDetail.jsx` |
| **Phase 2** | Pre-Registration Email OTP Verification | `auth.controller.js`, `SignUp.jsx`, `VettedRegistration.jsx`, `OtpVerification.jsx` |
| **Phase 3** | Complete Admin Moderation Console | `admin.controller.js`, `Admin.jsx`, `Notification.js` |
| **Phase 4** | User Profile Address Map & Volunteer Inventory | `user.controller.js`, `UserProfile.jsx`, `InteractiveMap.jsx` |
| **Phase 5** | Response Team Command Dashboard | `ResponseTeamDash.jsx`, `report.controller.js` |
| **Phase 6** | Notification Center & Deep Linking | `notification.controller.js`, `App.jsx`, `Notifications.jsx` |
| **Phase 7** | Security Pass & End-to-End Verification | Full Stack Audit |