# Protocol Zero Frontend Blueprint & Navigation Guide

> **Note for Frontend Designers & Developers:**  
> This document is a **pure structural guide** for building the UI using **dummy data only** (no API integration yet).  
> It outlines the exact pages, layout elements, fields (required vs optional), modals, action buttons, and navigation destinations.

---

## Global Navigation Shell

All authenticated pages share a top app bar and a persistent bottom navigation bar (mobile) or side drawer (desktop).

### 1. Top Header Bar
- **App Logo & Title:** Clicking navigates to `/home`.
- **Search Bar:** Input field for searching reports by keyword or ID.
- **Notification Bell Icon:** Displays unread badge count. Clicking opens the **Notification Drawer** (`/notifications`).
- **User Avatar / Profile Icon:** Displays user role badge. Clicking navigates to `/profile`.

### 2. Persistent Navigation Bar
- **Feed / Home Icon:** Navigates to `/home`.
- **Map Icon:** Navigates to `/map`.
- **Create Report Icon (`+`):** Navigates to `/reports/create`.
- **Emergency SOS Button (Floating & Prominent):** Stays visible across screens. Clicking navigates to `/sos`.
- **Response Team Dash (Responders Only):** Navigates to `/response-team/dashboard`.
- **Admin Console (Admins Only):** Navigates to `/admin`.

---

## Page-by-Page Skeletal Guide

### 1. Onboarding (`/`)
- **Layout:** App Logo, Headline, Mission Subtitle.
- **Buttons & Navigation:**
  - **`Get Started` Button:** Navigates to `/signup/select-role`.
  - **`Sign In` Button:** Navigates to `/login`.

---

### 2. Login (`/login`)
- **Fields:**
  - `Email` (Required, text input)
  - `Password` (Required, password input with Show/Hide toggle)
- **Buttons & Navigation:**
  - **`Log In` Button:** Submits form -> Navigates to `/otp-verification`.
  - **`Forgot Password?` Link:** Opens **Password Reset Modal** (`Email` input + `Send Reset Link` button).
  - **`Don't have an account? Sign Up` Link:** Navigates to `/signup/select-role`.

---

### 3. OTP Verification (`/otp-verification`)
- **Fields & Display:**
  - `6-Digit OTP Code` (Required, 6 individual digit boxes)
  - Countdown Timer readout (e.g., `00:59`)
- **Buttons & Navigation:**
  - **`Verify OTP` Button:** Navigates to `/home`.
  - **`Resend Code` Button:** Resets countdown timer.
  - **`Back to Login` Link:** Navigates to `/login`.

---

### 4. Select Role (`/signup/select-role`)
- **Layout:** 3 Role Cards with titles and descriptions.
- **Role Cards & Navigation:**
  - **`Citizen / Volunteer` Card:** Navigates to `/signup`.
  - **`Vetted Reporter` Card:** Navigates to `/signup/reporter`.
  - **`Response Team` Card:** Navigates to `/signup/response-team`.

---

### 5. Citizen / Volunteer Sign Up (`/signup`)
- **Fields:**
  - `Full Name` (Required)
  - `Account Type` (Required toggle: `User` vs `Volunteer`)
  - `Phone Number` (Required)
  - `Email Address` (Required)
  - `Password` (Required)
  - `Home Address` (Optional)
- **Buttons & Navigation:**
  - **`Create Account` Button:** Submits form -> Navigates to `/otp-verification`.
  - **`Already have an account? Log In` Link:** Navigates to `/login`.

---

### 6. Reporter Sign Up (`/signup/reporter`)
- **Fields:**
  - `Full Legal Name` (Required)
  - `Phone Number` (Required)
  - `Work Email` (Required)
  - `Password` (Required)
  - `Office / Agency / Precinct Name` (Required)
  - `Office Address` (Required)
  - `NID Number` (Required)
  - `Face Photo / ID Document` (Required, File upload)
- **Buttons & Navigation:**
  - **`Submit for Verification` Button:** Opens confirmation dialog ("Application Pending Verification") -> Navigates to `/login`.
  - **`Back` Button:** Navigates to `/signup/select-role`.

---

### 7. Response Team Sign Up (`/signup/response-team`)
- **Fields:**
  - `Full Name` (Required)
  - `Phone Number` (Required)
  - `Work Email` (Required)
  - `Password` (Required)
  - `Sub-Role` (Required dropdown: `Police`, `Firefighter`, `Civil Surgeon`)
  - `Office / Station Name` (Required)
  - `Office Address` (Required)
  - `NID Number` (Required)
  - `ID Badge / Official Photo` (Required, File upload)
- **Buttons & Navigation:**
  - **`Submit Application` Button:** Opens confirmation dialog -> Navigates to `/login`.
  - **`Back` Button:** Navigates to `/signup/select-role`.

---

### 8. Home Feed (`/home`)
- **Top Widget:** Compact Map Preview box + **`Open Full Map`** button (Navigates to `/map`).
- **Filter Bar:**
  - Search Input
  - Status Filter Dropdown (`All`, `Active`, `Closed`)
  - Type Filter Dropdown (`All`, `Minor`, `Major`)
- **Incident Cards Stream:**
  - Each Card displays:
    - Post ID (e.g., `#REP-8492`)
    - `Type Badge` (`Minor` or `Major`)
    - `Status Badge` (`Active`, `Closed`, `Suspicious`)
    - `Category` (e.g., Fire, Medical, Flood)
    - `Headline / Description snippet`
    - `Timestamp` & `Author Info` (Name, Role Badge)
    - Upvote Count & Downvote Count
  - **Buttons per Card:**
    - **`Upvote` Button:** Increments count state.
    - **`Downvote` Button:** Opens **Downvote Modal** (`Comment / Reason` text area [Required] + `Submit Downvote` button).
    - **`Comments` Button:** Navigates to `/reports/:id#comments`.
    - **`View Details` Button:** Navigates to `/reports/:id`.

---

### 9. Interactive Map (`/map`)
- **Layout:** Full-screen Interactive Map canvas with incident pins.
- **Controls & Overlay:**
  - `Search Location` input
  - `Filter Chips` (`All`, `Minor`, `Major`, `Responders`)
  - **`My Location` Button:** Centers map on current position.
- **Marker Click Popup / Sheet:**
  - Shows: Incident Title, Post ID, Type Badge, Category, Distance.
  - **`View Report Details` Button:** Navigates to `/reports/:id`.

---

### 10. Create Report (`/reports/create`)
- **Fields:**
  - `Report Type` (Required radio: `Minor` vs `Major`).  
    *Note: If logged in as Citizen/Volunteer, `Major` option is disabled with notice: "Only verified Reporters can issue Major broadcasts."*
  - `Category` (Required dropdown: `General Hazard`, `Fire`, `Medical`, `Crime`, `Flood`, `Infrastructure`)
  - `Description` (Required text area)
  - `Location` (Required map picker or Lat/Lng coordinates input)
  - `Impact Areas` (Required tag list if Type is `Major`, hidden if `Minor`)
  - `Images` (Optional multi-file upload)
- **Buttons & Navigation:**
  - **`Broadcast Report` Button:** Validates fields -> Navigates to `/reports/:id`.
  - **`Cancel` Button:** Navigates to `/home`.

---

### 11. Report Detail (`/reports/:id`)
- **Header Section:**
  - Post ID, Title, Category, `Type Badge` (`Minor`/`Major`), `Status Badge` (`Active`/`Closed`), `Reliability Badge` (`Valid`/`Suspicious`/`False`).
- **Issuer Card:**
  - Author Name, Role Badge, Avatar/Face Photo.
- **Body Content:**
  - Full Description, Image Gallery grid, Location Coordinates & Map View, Impact Areas list (if Major), Timestamps.
- **Interactive Action Bar:**
  - **`Upvote` Button & Counter**
  - **`Downvote` Button** -> Opens **Downvote Modal** (`Comment` text area [Required] + `Submit` button).
  - **`Edit History` Button:** Opens **Edit History Drawer** (Lists past revisions: Editor Name, Timestamp, Previous Description/Location snapshot).
- **Sub-Section A: Victim Section**
  - Displays list of registered victims.  
    *(Citizen view: Name & Photo only. Responder/Reporter view: Name, Photo, Phone, Address, GPS Status).*
  - **`I Am A Victim (Attach Me)` Button:** Opens **Victim Attachment Modal**:
    - `GPS Status Toggle` (`Success` vs `Failed`)
    - If `Failed`: `Fallback Address Selector` (`Home Address` vs `Manual Entry` [Required])
    - `Confirm Attachment` button -> Adds user to victim list.
- **Sub-Section B: Logistics & Resources Section**
  - **Block 1: Resources Needed** (Listed by report author)
    - List of items (`Item Name`, `Quantity`, `Unit`)
    - **`Edit Needed Resources` Button** *(Visible only to Report Author)* -> Opens Modal (`Item Name`, `Quantity`, `Unit`, `+ Add Item` button, `Save` button).
  - **Block 2: Official Resources Committed** (Pushed by Response Teams)
    - List of committed assets (`Item Name`, `Quantity`, `Unit`, `Provider Name`, `Location Coordinates`, `Timestamp`).
    - **`Commit Official Assets` Button** *(Visible only to ResponseTeam role)* -> Opens Modal (`Item Name` [Req], `Quantity` [Req], `Unit` [Req], `Current Lat/Lng Coordinates` [Req], `Submit Commit` button).
- **Sub-Section C: Comments Thread**
  - `Comment Text Area` (Required) + **`Post Comment` Button**.
  - List of comments (`Commenter Name`, `Role Badge`, `Text`, `Timestamp`).
- **Management Bar:**
  - **`Edit Report` Button** *(Visible if user has edit permission based on author type)* -> Navigates to `/reports/:id/edit` or opens Edit Modal.
  - **`Close Report` Button** *(Visible to Author, Reporter, or Admin)* -> Opens **Close Report Modal**:
    - `Reliability Rating` (Required radio: `Valid` vs `False`)
    - `Confirm Close` button -> Updates status to `Closed`.

---

### 12. Emergency SOS Flow (`/sos`)
- **Main View:**
  - Prominent **`HOLD TO ACTIVATE SOS`** button (Requires 3-second hold gesture).
  - `GPS Location Card` (Shows current Lat/Lng or "GPS Failed").
  - If GPS Failed: `Manual / Home Address Selector` (Required dropdown/input).
- **Activated SOS State View:**
  - Active Red Warning Banner ("SOS Alert Active & Transmitted").
  - `Victim Status Summary` (Connected report ID, position).
  - **`Cancel SOS` Button:** Opens confirmation dialog -> Resets SOS state.
  - **`View Associated Incident` Button:** Navigates to `/reports/:id`.

---

### 13. Notifications Center (`/notifications` or Drawer)
- **Header:** Title, **`Mark All as Read` Button**.
- **Notification Rows:**
  - Categories: `Nearby Minor Alert (1km)`, `Major Broadcast`, `Suspicious Escalation Alert`, `Account Flagged Notice`.
  - Content: Title, Message body, Timestamp, Unread dot indicator.
  - Clicking any row -> Navigates to target `/reports/:id` or `/profile`.

---

### 14. User Profile (`/profile`)
- **Identity Card:** Avatar, Name, Email, Phone, Role Badge, `Verification Status Chip` (`verified`, `pending`, `rejected`).
- **Reliability Score Card (Citizens / Volunteers):**
  - Numerical Score Dial (e.g., `+20`, `-10`).
  - *If Score <= -40:* Displays Red Warning Banner ("Account Flagged for Review").
- **Security Card:**
  - `2FA Toggle Switch` ("Enable Email OTP 2FA").
- **Inventory Card (Volunteers & Response Teams):**
  - List of personal supplies (`Item Name`, `Quantity`, `Unit`).
  - **`Add Item` Button:** Opens Modal (`Item Name` [Req], `Quantity` [Req], `Unit` [Req] + `Save` button).
  - **`Deduct Quantity` Button:** Decrements item count.
- **Account Actions:**
  - **`Log Out` Button:** Clears dummy auth session -> Navigates to `/login`.

---

### 15. Response Team Operations Dashboard (`/response-team/dashboard`)
- **Layout:** Split view (Left: Active Incident Queue; Right: Response Map).
- **Incident Queue Cards:**
  - Post ID, Urgency Badge, Location, Victim Count.
  - **`Commit Resources` Button:** Opens Resource Commitment Modal.
  - **`Open Incident Details` Button:** Navigates to `/reports/:id`.

---

### 16. Admin Moderation Console (`/admin`)
- **Tab 1: Pending Vetted Applications**
  - List of pending `Reporter` & `ResponseTeam` accounts (Name, Role, NID, Office Name, ID Document link).
  - **`Approve` Button** -> Updates status to `verified`.
  - **`Reject` Button** -> Updates status to `rejected`.
- **Tab 2: Flagged Accounts**
  - List of users with score <= -40 (User Name, Current Score, False Reports Count).
  - **`Review Activity` Button:** Navigates to user profile.
- **Tab 3: Escalated Reports**
  - List of community-flagged suspicious reports (Report ID, Upvotes/Downvotes count, Author Name).
  - **`Restore Report` Button:** Resets reliability to `valid`.
  - **`Confirm Fake & Close` Button:** Closes report with `false` status.