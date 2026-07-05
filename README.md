# Protocol Zero

**A Community-Driven Incident Reporting and Emergency Response Coordination Platform.**

Protocol Zero is a robust, real-time platform built to bridge the gap between civilians, volunteer responders, and official response teams during emergencies. It allows citizens to report incidents (accidents, hazards, crimes, medical emergencies) in real time, have them geographically verified by nearby users, and automatically escalates critical reports to registered response teams and volunteers.

## Features

- **Real-Time Incident Reporting:** Submit incidents with geolocation, severity, categorization, and media.
- **Geospatial Verification:** Nearby users can confirm or dispute reports through an upvote/downvote system, establishing trust and filtering noise.
- **Automated Escalation:** High-severity or highly-verified incidents are automatically escalated to assigned Response Teams and Volunteers within a defined radius.
- **SOS Victim Mode:** A single-button hold-to-activate SOS mode for immediate, high-priority self-reporting during personal emergencies.
- **Dynamic Role-Based Access Control (RBAC):** Unified identity system supporting Normal Users, Reporters (verified users), Volunteers, Response Teams, and Regional/Global Admins.
- **Real-Time Map Dashboard:** Live tracking of incidents, response unit locations, and severity clusters.
- **Trust & Reliability Scoring:** Every interaction feeds into a running trust signal, prioritizing reliable reporters and suppressing abuse.

## Tech Stack

**Protocol Zero is built on the MERN stack with real-time capabilities:**

- **Frontend (Client):** React.js (Vite), Tailwind CSS, Redux Toolkit, React Router, Leaflet (Maps), Socket.io-client.
- **Backend (Server):** Node.js, Express.js, Socket.io (Real-time).
- **Database:** MongoDB (Atlas) with Mongoose, utilizing robust GeoJSON geospatial indexing (`2dsphere`).
- **External Services (Planned):** Cloudinary (Media), SMS Gateway (OTP), Push Notifications (FCM).

## Project Structure

The repository is organized into a monolithic workspace containing both frontend and backend domains:

```
ProtocolZero/
├── client/                 # React.js Frontend (Vite)
│   ├── public/             # Static assets
│   └── src/                
│       ├── components/     # Reusable UI components
│       ├── features/       # Redux slices and domain logic
│       ├── layouts/        # Layout shells (e.g., DashboardLayout)
│       ├── pages/          # Full page route components
│       ├── routes/         # React Router configuration
│       └── ...
├── server/                 # Node.js + Express Backend
│   ├── config/             # Environment & DB configuration
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose schemas (User, Report, Vote, etc.)
│   ├── routes/             # API routes
│   ├── services/           # Core business logic & escalation
│   ├── socket/             # Real-time event handlers
│   └── ...
└── system_architecture.md  # Master Blueprint & Architecture Document
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aliazgorLab/ProtocolZero.git
   cd ProtocolZero
   ```

2. **Setup the Client (Frontend):**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The client will run on `http://localhost:5173`.

3. **Setup the Server (Backend):** *(Note: Ensure you have your `.env` configured)*
   ```bash
   cd server
   npm install
   npm run dev
   ```

## Development Status

- **Architecture:** Complete (See `system_architecture.md`)
- **Frontend UI:** Initial static responsive UI complete (Auth, Dashboards, Map, Report Creation, SOS). Routed via React Router.
- **Backend APIs:** *Pending Implementation*
- **Real-Time Integration:** *Pending Implementation*

## Architecture Overview

Protocol Zero is designed with **location as a first-class citizen**. It uses standard RESTful APIs for CRUD operations and heavy data loading, and **Socket.io** for real-time state propagation of active incidents. The database relies heavily on MongoDB's `$near` and `$geoWithin` capabilities for radius-based alerts and assignments.

For deep technical details, schema models, and logic flowcharts, please refer to the [System Architecture Document](./system_architecture.md).

## License

This project is proprietary and intended for the Protocol Zero initiative.
# ProtocolZero
