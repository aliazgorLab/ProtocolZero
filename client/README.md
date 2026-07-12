# Protocol Zero - Client Application

This directory contains the frontend React application for Protocol Zero, built with **Vite**, **React**, and **Tailwind CSS**.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)

### Installation & Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

3. **Build for Production:**
   ```bash
   npm run build
   ```

## Architecture

The client follows a feature-sliced and domain-driven structure to keep the codebase scalable:

- `src/pages/` - Full-page route components (e.g., `Home.jsx`, `CreateReport.jsx`, `SosFlow.jsx`).
- `src/routes/` - Route configuration (`AppRoutes.jsx`) and Route Guards (`PrivateRoute`, `RoleRoute`).
- `src/layouts/` - Shared UI shells (`DashboardLayout.jsx`).
- `src/components/` - Reusable presentational components (Buttons, Inputs, Cards).
- `src/features/` - Redux slices and feature-specific logic.

## Routing

Routing is handled by `react-router-dom`. The main entry points are:

- **Public Routes:** `/`, `/login`, `/signup`, `/otp-verification`
- **Private Routes:** `/home`, `/reports/create`, `/sos`, `/map`, `/response-team/dashboard`

## Technologies Used

- **React.js** - UI Library
- **Vite** - Build Tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Redux Toolkit** - State management (Planned integration)
- **Leaflet / React-Leaflet** - Interactive Maps (Planned integration)
- **Socket.io-client** - Real-time websocket connections (Planned integration)

---
*For full system architecture, please see the `system_architecture.md` file in the project root.*
