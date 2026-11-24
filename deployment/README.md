# DevPulse Production Architecture & Deployment Overview

This directory provides the operational documentation to deploy DevPulse to production and package the Windows Electron installer.

---

## 1. High-Level Architecture

```
+-------------------------------------------------------------+
|               Windows Laptop / End User                     |
|                                                             |
|  +-------------------------------------------------------+  |
|  |     DevPulse Desktop Client (Electron EXE)            |  |
|  |     - Bundled React 19 + Vite Renderer (app://)       |  |
|  |     - Node.js / Java / MySQL NOT required on client   |  |
|  +---------------------------+---------------------------+  |
+------------------------------|------------------------------+
                               | HTTPS / WSS
                               v
+-------------------------------------------------------------+
|                    Railway Cloud Platform                   |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  Spring Boot Backend Container (Java 21 JRE)          |  |
|  |  - REST API (/api/v1/...)                             |  |
|  |  - Health Monitoring (/api/health)                    |  |
|  |  - Automatic Flyway Migrations (V1 -> V4)             |  |
|  +---------------------------+---------------------------+  |
|                              | Internal TCP (Port 3306)     |
|                              v                              |
|  +-------------------------------------------------------+  |
|  |  Managed MySQL 8.0 Database Service                   |  |
|  |  - Isolated persistent storage volume                 |  |
|  |  - Automatic database initialization via Flyway       |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 2. Component Breakdown

| Layer | Technology | Hosting / Distribution | Role |
|---|---|---|---|
| **Desktop Client** | Electron + React 19 + Vite | Windows NSIS Installer (`.exe`) | Standalone desktop application distributed to developers. Zero local database/runtime dependencies. |
| **Backend API** | Spring Boot 3.4.2 (Java 21) | Railway Docker Container | Business logic, authentication, JWT verification, telemetry calculations, Flyway migrations. |
| **Database** | MySQL 8.0+ | Railway Managed Service | Persistent storage for users, projects, work sessions, daily notes, and tasks. |

---

## 3. Deployment Guides Directory

- [RAILWAY_SETUP.md](file:///e:/Projects/DevPulse%20Desktop%20Version/deployment/RAILWAY_SETUP.md) — Step-by-step instructions for deploying MySQL and Spring Boot on Railway.
- [ENVIRONMENT_VARIABLES.md](file:///e:/Projects/DevPulse%20Desktop%20Version/deployment/ENVIRONMENT_VARIABLES.md) — Complete specification of development and production environment variables.
- [MYSQL_SETUP.md](file:///e:/Projects/DevPulse%20Desktop%20Version/deployment/MYSQL_SETUP.md) — Schema migrations, fresh database initialization, and backup/restore procedures.
- [ELECTRON_BUILD.md](file:///e:/Projects/DevPulse%20Desktop%20Version/deployment/ELECTRON_BUILD.md) — Compiling React and building the Windows executable (`.exe`).
- [DEPLOYMENT_CHECKLIST.md](file:///e:/Projects/DevPulse%20Desktop%20Version/deployment/DEPLOYMENT_CHECKLIST.md) — Verification checklist across infrastructure, security, and packaging.
- [TROUBLESHOOTING.md](file:///e:/Projects/DevPulse%20Desktop%20Version/deployment/TROUBLESHOOTING.md) — Diagnosing connectivity, database, CORS, and desktop build issues.
