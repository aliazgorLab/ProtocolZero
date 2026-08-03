# Protocol Zero — Master Execution Design Plan (Remaining Scope)

**Status:** Active Master Execution Guide  
**Scope:** Exhaustive engineering guide for completing 100% of remaining Protocol Zero features.

> **CRITICAL NOTE ON EXECUTION ORDER:**  
> Phase 7 (Pre-Registration Email OTP Verification) is strictly placed at the **VERY LAST** position — to be implemented only after all features in Phases 1–6 are fully built, integrated, and verified through testing.

---

# 🚀 Phase 1: Fixed Emergency Resource Taxonomy & Logistics System

### Objective
Eliminate free-text resource entries across the system. Establish a standardized, immutable emergency resource taxonomy in both server and client, enabling Report Authors to specify required supplies from an official catalog, Response Teams to commit official units, and Volunteers to manage personal inventory.

---

### 1.1 Server & Client Resource Taxonomy Definition
Create `server/constants/resources.js` and `client/src/constants/resources.js` with the exact standardized catalog:

```javascript
const RESOURCE_TAXONOMY = [
  { id: "water_bottles", name: "Drinking Water (bottle)", category: "Water", defaultUnit: "bottles" },
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

const RESOURCE_CATEGORIES = ["Water", "Food", "Medical", "Shelter", "Equipment", "Response", "Supplies"];

module.exports = { RESOURCE_TAXONOMY, RESOURCE_CATEGORIES };
```

---

### 1.2 Resource Middleware & Validation (`server/middleware/validators.js`)
- Update `validateReportResources`:
  - Validate that `itemId` exists within `RESOURCE_TAXONOMY`.
  - Validate that `quantity` is a positive integer (`quantity > 0`).
  - Automatically populate `itemName`, `category`, and `unit` from `RESOURCE_TAXONOMY` server-side to prevent payload spoofing.

---

### 1.3 Resource API Endpoints (`server/controllers/resource.controller.js`)
1. **`GET /api/resources/taxonomy`**:
   - Access: Public / Authenticated
   - Response: `{ success: true, data: { taxonomy: RESOURCE_TAXONOMY, categories: RESOURCE_CATEGORIES } }`
2. **`PATCH /api/reports/:id/resources-needed`**:
   - Access: Protected (Report Author or Admin only)
   - Body: `{ resourcesNeeded: [{ itemId: "water_bottles", quantity: 100 }] }`
3. **`PATCH /api/reports/:id/resources`**:
   - Access: Protected (`ResponseTeam` only)
   - Body: `{ resourcesCommitted: [{ itemId: "ambulances", quantity: 2, location: { type: "Point", coordinates: [90.4125, 23.8103] } }] }`
   - Emits real-time Socket.io event `report:resource_committed` to geo room and report detail room.
4. **`PATCH /api/users/inventory/deduct`**:
   - Access: Protected (`Volunteer` or `ResponseTeam`)
   - Deducts items from personal profile inventory upon field deployment.

---

### 1.4 Frontend UI Integration
- **`CreateReport.jsx` & `ReportDetail.jsx`**:
  - Replace text input fields with category-filtered dropdown selectors referencing `RESOURCE_TAXONOMY`.
  - Auto-fill unit badge (e.g. "bottles", "kits", "vehicles") based on selected item.
- **"Official Assets Committed" Panel (`ReportDetail.jsx`)**:
  - Display dedicated logistics card showing committed Response Team assets.
  - Interactive button to highlight asset coordinates directly on the Google Map preview.

---

# 👮 Phase 2: Complete Admin Moderation Console & Verification Workflow

### Objective
Provide a fully functional administration console (`/admin`) for system moderators to review pending professional applications, audit flagged low-trust accounts, and moderate community-reported false incidents.

---

### 2.1 Backend Controller Logic (`server/controllers/admin.controller.js`)
1. **Pending Professional Applications**:
   - `GET /api/admin/pending-users`: Fetches users with `verificationStatus: "pending"`.
   - `PATCH /api/admin/users/:userId/verify`: Body `{ status: "verified" | "rejected", reason?: "string" }`.
     - Updates `user.verificationStatus`.
     - Creates database `Notification` for applicant.
     - Emits real-time socket event `user:verification_updated` to `user:<userId>`.
     - Unlocks full role privileges (`Reporter` or `ResponseTeam`).
2. **Low-Trust Flagged Accounts**:
   - `GET /api/admin/flagged-users`: Queries users with `score <= -40`.
3. **Escalated & Suspicious Reports**:
   - `GET /api/admin/escalated-reports`: Returns reports with `reliability: "false"` or flagged by fake-report detection.
   - `PATCH /api/admin/reports/:id/reliability`: Body `{ reliability: "valid" | "false" }`.
     - Setting `valid`: Restores report, clears flag, resumes citizen alerts.
     - Setting `false`: Permanently closes report as fake and applies -20 penalty to author's score.

---

### 2.2 Frontend Admin Console Layout (`client/src/pages/Admin.jsx`)
Implement 3 main tabs with responsive data tables and action modals:

#### **Tab 1: Pending Applications (`/admin#pending`)**
- Application Card showing: Applicant Name, Account Type (`Reporter` or `ResponseTeam`), Sub-Role (`police`/`firefighter`/`civilsurgeon`), NID Number, Agency/Station Name, Office Address.
- Modal Viewer for uploaded facial verification / ID photo.
- Action Buttons:
  - **`Approve`** (Green): Confirms approval, displays success toast.
  - **`Reject`** (Red): Opens modal prompt for optional rejection reason before submitting.

#### **Tab 2: Flagged Accounts (`/admin#flagged`)**
- User Card showing: Name, Email, Phone, Current Score (e.g. `-50`), Total Reports Issued, False Report Count.
- Action Buttons:
  - **`Reset Score to 0`**: Clears penalty flags.
  - **`Suspend Account`**: Marks user as `verificationStatus: "rejected"`.

#### **Tab 3: Escalated Reports (`/admin#escalated`)**
- Report Moderation Card showing: Post ID, Category, Author Name, Upvotes vs Downvotes ratio, and list of downvote comments.
- Action Buttons:
  - **`Restore Report (Mark Valid)`**: Restores status to `valid`.
  - **`Confirm Fake & Close`**: Closes report as false, penalizes author.

---

# 🏠 Phase 3: User Profile & Geolocation Address Management

### Objective
Enable users to manage their personal profiles, toggle volunteer mode, manage emergency inventory, and set saved `homeAddress` and `currentAddress` with interactive Google Map pickers.

---

### 3.1 Backend Profile Controller (`server/controllers/user.controller.js`)
- Update `PATCH /api/users/profile` to accept:
  - `homeAddress` (string) & `homeAddressGps` (GeoJSON `Point`)
  - `currentAddress` (string) & `currentAddressGps` (GeoJSON `Point`)
- Validate coordinate array structure `[longitude, latitude]`.

---

### 3.2 Frontend User Profile Page (`client/src/pages/UserProfile.jsx`)
1. **Identity & Status Card**:
   - Displays Avatar, Name, Email, Phone, Account Type Badge, and `Verification Status Chip` (`verified`/`pending`/`rejected`).
2. **Reliability Score Dial (Citizens/Volunteers)**:
   - Visual score indicator (+10, -20). Red warning banner if `score <= -40`.
3. **Saved Addresses Card (Interactive Google Map)**:
   - Two location sections: 🏠 **Home Address** and 📍 **Current Address**.
   - Search input box with Google Places autocomplete or manual pin placement on embedded map.
   - Clicking map sets `[longitude, latitude]` coordinates and populates address string.
4. **Volunteer Inventory Management**:
   - Tab for `Volunteer` and `ResponseTeam` accounts.
   - Add/Remove items using `RESOURCE_TAXONOMY` dropdowns and specify stock quantity.
5. **Role Mode Toggle**:
   - Switch between standard `User` and `Volunteer`.
   - Backend guard blocks switching to `User` if currently assigned as a responder to an active report.

---

### 3.3 Map Component Integration (`client/src/pages/InteractiveMap.jsx`)
- Add toggle overlay switches:
  - 🏠 **Show My Home Address Pin**
  - 📍 **Show My Current Location Pin**
- Render distinct visual marker icons for home and current position alongside active incident markers.

---

# 🚑 Phase 4: Response Team Operations Command Dashboard

### Objective
Provide a real-time operational command center (`/response-team/dashboard`) specifically tailored for Police, Firefighters, and Civil Surgeons.

---

### 4.1 Dual-Pane Operational Interface (`client/src/pages/ResponseTeamDash.jsx`)
- **Left Pane (Live Emergency Queue)**:
  - Incident cards sorted by distance and urgency (Major reports & SOS alerts at top).
  - Displays Post ID, Category, Distance (km), Victim Count, and Committed Assets.
- **Right Pane (Google Command Map)**:
  - Full interactive Google Map with live incident markers, victim pins, and deployed units.
  - Clicking an incident centers map and filters queue.

---

### 4.2 Victim Details & Asset Commitment Modals
- **Victim Info Drawer**:
  - Clicking victim count on an incident opens full victim profile drawer.
  - Displays Victim Name, Photo, Phone Number, Home Address, and Live GPS status.
  - Highlights clear warning badge if location is a **Registered Address Fallback** rather than a live signal.
- **One-Click Asset Commitment Modal**:
  - Response teams click "Deploy Assets".
  - Select item from `RESOURCE_TAXONOMY` (e.g. `Ambulance Vehicles` or `Fire Trucks`).
  - Specify quantity and click map to place deployment coordinates.
  - Sends `PATCH /api/reports/:id/resources`, updates report state, and broadcasts real-time socket event.

---

# 🔔 Phase 5: Notification Center, Real-Time Navigation & UI Polish

### Objective
Ensure all database notifications and socket alerts provide seamless deep-linking to target pages, coupled with end-to-end visual polish.

---

### 5.1 Interactive Notification Center (`client/src/pages/Alerts.jsx` & Top Drawer)
- **Header**: Unread notification counter, **"Mark All as Read"** button (`PATCH /api/notifications/read-all`).
- **Row Classification & Direct Navigation**:
  - `report_comment` / `report_created` / `report_escalated` → Clicking row navigates directly to `/reports/:id`.
  - `account_verification_pending` / `account_verification_status` → Clicking row navigates to `/profile` or `/admin`.
- **Real-Time Append**: Socket event `notification:new` appends new notification item instantly to Redux state without requiring page reload.

---

### 5.2 Global UI & UX Hardening
- Add loading skeleton states during data fetches.
- Add empty-state illustrations for empty feeds, empty notification drawers, and zero search results.
- Toast notifications for all success/failure API operations via `ToastProvider`.

---

# 🧪 Phase 6: Quality Assurance, Security Hardening & End-to-End Testing

### Objective
Perform strict security auditing, NoSQL sanitization checks, and end-to-end system walkthrough testing before enabling production registration OTP.

---

### 6.1 Security & PII Audit
1. **Socket Payload Scrubbing**: Verify that `report:new`, `report:vote`, and `report:update` socket events contain zero victim PII (phone numbers, NIDs, or face images).
2. **RBAC Guard Verification**: Test that unverified `pending` accounts cannot execute operational POST/PATCH endpoints.
3. **NoSQL Injection Sanitization**: Verify `express-validator` rejects request bodies containing `$` or `.` characters.

---

### 6.2 End-to-End System Walkthrough Script
Execute the full system lifecycle manually or via automated test script:
1. **Admin Seed**: Run `npm run seed:admin`, log into `/admin`.
2. **Vetted Signup**: Register as `Reporter` or `ResponseTeam` at `/signup/vetted` → state becomes `pending` → Admin approves application in `/admin#pending`.
3. **Report Creation & Duplicate Check**: Create Minor report → attempt duplicate creation within 200m/3hr → verify HTTP 409 Conflict intercept.
4. **Voting & Comment Alert**: Downvote report with comment → verify report issuer receives database notification & Socket.io alert.
5. **SOS & Victim Fallback**: Activate SOS with GPS disabled → verify fallback to registered home address → verify Response Team sees fallback indicator on `/response-team/dashboard`.
6. **Logistics Commitment**: Response Team commits `Fire Trucks` from taxonomy → verify real-time update on `ReportDetail.jsx`.

---

# 🔑 Phase 7 (FINAL PHASE): Pre-Registration Email OTP Verification Flow

> **NOTE:** Implement this phase **ONLY** after Phases 1 through 6 are 100% complete and tested.

### Objective
Enforce 6-digit Email OTP verification during user registration, ensuring no unverified account can be written to MongoDB.

---

### 7.1 Server OTP Pre-Registration Controller (`server/controllers/auth.controller.js`)
1. **`POST /api/auth/send-registration-otp`**:
   - Accepts `{ email, phone }`.
   - Generates crypto 6-digit OTP code, hashes it with SHA-256 with a 10-minute expiration.
   - Sends OTP email to user.
   - Returns temporary JWT token: `{ tempRegistrationToken }`.
2. **`POST /api/auth/verify-registration-otp`**:
   - Accepts `{ tempRegistrationToken, otp, registrationPayload }`.
   - Validates OTP against stored hash and expiration.
   - On valid OTP: Creates and persists `User` document in MongoDB, completes authentication session, and returns user profile.

---

### 7.2 Frontend Registration Integration (`client/src/pages/SignUp.jsx` & `VettedRegistration.jsx`)
- Update registration submission flow:
  - Form submit triggers `send-registration-otp`.
  - Stores `tempRegistrationToken` and payload in Redux state.
  - Redirects user to `/otp-verification?mode=registration`.
- Update `OtpVerification.jsx`:
  - Validates 6-digit OTP input.
  - Calls `verify-registration-otp` to finalize MongoDB user creation.
  - Displays success message and navigates to main application dashboard.

---

## 📋 Execution Roadmap Summary Table

| Phase | Core Focus | Key Target Files |
|---|---|---|
| **Phase 1** | Fixed Resource Taxonomy & Allocation | `server/constants/resources.js`, `resource.controller.js`, `CreateReport.jsx`, `ReportDetail.jsx` |
| **Phase 2** | Complete Admin Moderation Console | `admin.controller.js`, `Admin.jsx`, `Notification.js` |
| **Phase 3** | User Profile Address Map & Inventory | `user.controller.js`, `UserProfile.jsx`, `InteractiveMap.jsx` |
| **Phase 4** | Response Team Operations Command Dashboard | `ResponseTeamDash.jsx`, `report.controller.js` |
| **Phase 5** | Notification Center & Deep Linking | `notification.controller.js`, `Alerts.jsx`, `App.jsx` |
| **Phase 6** | Security Pass & End-to-End System Testing | Full Stack Audit & Walkthrough |
| **Phase 7 (LAST)** | Pre-Registration Email OTP Verification | `auth.controller.js`, `SignUp.jsx`, `VettedRegistration.jsx`, `OtpVerification.jsx` |