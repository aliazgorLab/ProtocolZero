# Protocol Zero — Implementation Plan

This document outlines the current state of the Protocol Zero project compared to its original `system_architecture.md` vision, followed by a phased execution roadmap to reach production readiness.

## 1. Architectural Analysis & Current State

### 1.1 Completed
* **Database Design & Geospatial Core:** `User`, `Report`, `Notification`, and `PointSchema` match the architecture perfectly. `2dsphere` indexes are correctly configured.
* **Authentication Engine:** Firebase integration is solid. The backend correctly verifies JWTs via middleware. The opt-in 2FA (Email OTP) with auto-recovery for synchronization failures works flawlessly.
* **Core API (REST):** The `auth`, `report`, and `user` domains are functional. Duplicate radius checks (50m/500m) successfully prevent redundant map pins.
* **Backend Refactoring:** Business logic (math, geospatial queries, notification building) has been cleanly extracted into `services/report.service.js`, honoring the architecture's separation of concerns.
* **SOS / Victim Mode:** The API successfully attaches users to incidents and handles GPS vs. address fallbacks.

### 1.2 Completed but Needs Refinement
* **Frontend Routing & RBAC:** Basic routing is in place, but `<RoleRoute>` is commented out in `AppRoutes.jsx`. Frontend views aren't strictly gated by user `accountType`.
* **Report Verification Math:** The backend allows upvoting/downvoting and closing reports, but it **misses two crucial algorithms**:
  1. *Fake Report Detection* (`u == 0 AND d < 2...`) during voting.
  2. *Reliability Score Recalculation* (`+10 / -20`) when a report is closed.
* **Interactive Map:** The frontend map component exists but relies entirely on HTTP polling/refreshing. It lacks real-time Socket.io injection.

### 1.3 Partially Implemented
* **Notifications:** The backend creates `Notification` documents during report creation, but there is no `GET /api/notifications` or `PATCH /api/notifications/:id/read` endpoint to actually retrieve them. The frontend lacks a notification drawer.
* **Admin Verification:** The `admin` controller exists, but the frontend lacks an Admin dashboard to approve `pending` Reporters and Response Teams.

### 1.4 Not Implemented
* **Socket.io Real-Time Engine:** The `server/socket/` layer and frontend `useSocket` hooks are completely missing.
* **Resource Management:** No endpoints exist for Volunteers/Response Teams to update their `inventory` or allocate resources to active incidents.

---

## 2. Implementation Roadmap

The following phases are ordered by dependency to ensure a stable build at every step.

### Phase 1: Core Intelligence & Business Rules
*We must finish the backend's core logic before wiring up the frontend dashboards.*
- [ ] **Implement Fake Report Detection:** Update `voteOnReport` to apply the vote-ratio algorithm. If triggered, flag the report and generate an admin notification.
- [ ] **Implement Reliability Scoring:** Update `updateReport` (or a dedicated `PATCH /api/reports/:id/close` endpoint) to calculate and apply the `+10` or `-20` score modifier to the reporting user when a report closes.
- [ ] **Implement Notification API:** Create `GET /api/notifications` and `PATCH /api/notifications/:id/read` in a new `notification.routes.js`.
- [ ] **Implement Resource API:** Create `PATCH /api/users/inventory` to allow responders to update their available items.

### Phase 2: Real-Time Engine (Socket.io)
*Crucial for the "live" aspect of the map and SOS flows.*
- [ ] **Backend Setup:** Install `socket.io`. Create `server/socket/index.js` to handle connections, auth, and room joins (`geo:[region]` and `role:[role]`).
- [ ] **Backend Emitters:** Wire up emitters in `report.service.js` and controllers to broadcast `report:new`, `report:vote`, and `victim:attached`.
- [ ] **Frontend Hook:** Create `client/src/hooks/useSocket.js` to manage the singleton connection and auto-reconnect logic using the Firebase token.
- [ ] **Map Integration:** Update `InteractiveMap.jsx` and `ReportDetail.jsx` to listen for socket events and update Redux/local state without a full page refresh.

### Phase 3: Frontend Polish & Dashboards
*Surfacing the backend capabilities to the users.*
- [ ] **Strict Frontend RBAC:** Re-enable and configure `<RoleRoute>` in `AppRoutes.jsx` to protect Admin, Reporter, and Response Team views.
- [ ] **Admin Dashboard:** Build a simple UI for Admins to view `flagged-users` and approve `pending` Reporter/Response Team registrations.
- [ ] **Notification Drawer:** Implement a UI component in the `DashboardLayout` header to poll/receive and display unread notifications.
- [ ] **Inventory UI:** Update the `UserProfile` or `ResponseTeamDash` to allow users to add/remove items from their resource inventory.

### Phase 4: Final QA & Edge Cases
- [ ] **GPS Degradation Testing:** Manually test the SOS flow using browser dev tools to block location access, ensuring the fallback UI behaves perfectly.
- [ ] **Token Expiration:** Ensure Axios interceptors on the frontend gracefully handle Firebase token expiry by refreshing the token automatically.

## User Review Required
Please review the categorization of the current state and the proposed roadmap. 

> [!NOTE]
> Are there any features from the roadmap (like Admin dashboards or specific real-time map behaviors) that you want to prioritize or adjust? Once approved, we will begin executing **Phase 1**.
