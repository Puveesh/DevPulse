# DevPulse — Developer Worklog & Analytics Platform

DevPulse is a developer productivity workspace designed to track coding sessions, manage project repositories, record worklogs, and analyze personal developer velocity over time.

---

## 1. Project Overview & Architecture

DevPulse is architected as an extensible monorepo with an independent React + Vite frontend and a Spring Boot 3 backend running against MySQL with automated Flyway database migrations.

### Tech Stack

- **Desktop Runtime:** Electron, electron-vite, Electron Builder.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, React Router v7, TanStack Query v5, React Hook Form, Zod, Axios.
- **Backend:** Java 21, Spring Boot 3.4.2, Spring Security, Spring Data JPA, Spring Boot Validation, Flyway Migrations, JJWT 0.12.6, Springdoc OpenAPI 3.
- **Database:** MySQL 8.0+ (with Docker Compose and Flyway schema versioning).

---

## 2. Monorepo Structure

```
devpulse/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/devpulse/
│   │   │   │   ├── DevPulseApplication.java
│   │   │   │   ├── auth/          # Authentication controllers, services, and DTOs
│   │   │   │   ├── common/        # Global exceptions, ApiResponse, error handlers
│   │   │   │   ├── config/        # Security, CORS, JWT, and OpenAPI configuration
│   │   │   │   ├── project/       # Project entity, service, controller, and DTOs
│   │   │   │   ├── security/      # JWT provider, auth filter, UserPrincipal, cookies
│   │   │   │   ├── task/          # Task entity and repository foundation
│   │   │   │   ├── user/          # User entity and repository
│   │   │   │   └── worklog/       # WorkSession, DailyNote, and AttachmentMetadata
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/
│   │   │           └── V1__init_schema.sql
│   │   └── test/
│   │       ├── java/com/devpulse/ # Integration tests for Auth, Projects, and JWT
│   │       └── resources/
│   │           └── application-test.yml
│   ├── .env.example
│   ├── .gitignore
│   └── pom.xml
├── frontend/
│   ├── electron/
│   │   ├── main.ts                # Electron main process (lifecycle, IPC, window management)
│   │   ├── preload.ts             # ContextBridge isolated API bridge
│   │   ├── tray.ts                # System tray architecture
│   │   └── dev.mjs                # Development runner with clean environment isolation
│   ├── resources/
│   │   ├── icon.ico               # Windows application and installer icon
│   │   └── icon.png               # High-res application icon
│   ├── src/
│   │   ├── components/            # ProtectedRoute, AppLayout, UI components
│   │   ├── contexts/              # AuthContext for session & authentication state
│   │   ├── features/              # Auth, Dashboard, Projects, Settings
│   │   ├── hooks/                 # TanStack Query custom hooks
│   │   ├── lib/                   # Axios API client, utils
│   │   ├── types/                 # TypeScript interfaces and electronAPI types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── electron.vite.config.ts    # Electron Vite bundler configuration
│   ├── electron-builder.json      # Windows NSIS packaging configuration
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml             # Local MySQL 8.0 container setup
├── .gitignore
├── .env.example
├── LICENSE
└── README.md
```

---

## 3. Database Schema Summary (Flyway Migration `V1`)

- **`users`:** `id` (UUID), `email` (normalized, unique), `password_hash` (BCrypt), `display_name`, `created_at`, `updated_at`.
- **`projects`:** `id` (UUID), `user_id` (UUID FK to users), `name`, `description`, `repository_url`, `tech_stack`, `status` (`ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`), `created_at`, `updated_at`.
- **`tasks`:** `id` (UUID), `user_id` (UUID FK), `project_id` (UUID FK nullable), `title`, `description`, `status` (`TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `due_date`, `created_at`, `updated_at`.
- **`work_sessions`:** `id` (UUID), `user_id` (UUID FK), `project_id` (UUID FK nullable), `task_id` (UUID FK nullable), `title`, `notes`, `started_at`, `ended_at`, `duration_seconds` (derived), `status` (`ACTIVE`, `COMPLETED`, `CANCELLED`), `created_at`, `updated_at`. Time constraint: `ended_at >= started_at`.
- **`daily_notes`:** `id` (UUID), `user_id` (UUID FK), `project_id` (UUID FK nullable), `note_date`, `content`, `created_at`, `updated_at`.
- **`attachments`:** `id` (UUID), `user_id` (UUID FK), `project_id` (UUID FK nullable), `filename`, `content_type`, `storage_key`, `file_size`, `created_at`. Actual file binaries are decoupled from MySQL and target external object storage.

---

## 4. API Endpoints

All application APIs are versioned under `/api/v1`.

### Authentication & Profile (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new user; returns JWT and sets `devpulse_token` HttpOnly cookie |
| `POST` | `/api/v1/auth/login` | Public | Log in existing user; returns JWT and sets `devpulse_token` HttpOnly cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clears `devpulse_token` cookie and invalidates client session |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieves profile of currently authenticated user |

### Projects (`/api/v1/projects`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/projects` | Authenticated | Create a new project for current user (201 Created) |
| `GET` | `/api/v1/projects` | Authenticated | List current user's projects with status filter & search (200 OK) |
| `GET` | `/api/v1/projects/{id}` | Authenticated | Retrieve project details if owned by current user (200 OK) |
| `PATCH` | `/api/v1/projects/{id}` | Authenticated | Update project details if owned by current user (200 OK) |
| `DELETE` | `/api/v1/projects/{id}` | Authenticated | Delete project if owned by current user (204 No Content) |

### API Documentation
- OpenAPI Spec: `http://localhost:8081/api-docs`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

---

## 5. Security & Isolation Architecture

1. **User-Level Data Isolation:** Every query in `ProjectService`, `WorkSessionRepository`, etc., is strictly bound to `principal.getId()` resolved from the validated JWT. Client-supplied IDs are never trusted for ownership decisions. Attempts to access another user's project return `404 Not Found`.
2. **HttpOnly Cookie + Bearer Dual Authentication:**
   - Web browsers use an `HttpOnly`, `SameSite=Lax`, `Path=/` cookie (`devpulse_token`) with `withCredentials: true`.
   - Programmatic clients, mobile apps, and Swagger UI pass `Authorization: Bearer <token>`.
   - `JwtAuthenticationFilter` validates both seamlessly.
3. **Password Security:** Salted BCrypt password hashing.
4. **Input Sanitization:** Email addresses are normalized (`trim().toLowerCase()`). All incoming requests are validated using Spring Validation annotations and Zod client schemas.
5. **CORS:** Strict origin whitelist (no wildcards allowed with credentials).

---

## 6. Local Setup & Execution Instructions

### Prerequisites
- Java 21+
- Maven 3.9+
- Node.js 20+ and npm
- Docker (for local MySQL container)

### Step 1: Start MySQL Database
```bash
docker-compose up -d
```
Or connect to an existing local MySQL instance on port `3306` with database `devpulse`.

### Step 2: Run the Backend
```bash
# From root:
npm run dev:backend

# Or from backend/:
cd backend
mvn spring-boot:run
```
The backend starts at `http://localhost:8081`. Flyway applies database migrations automatically.

### Step 3: Run the Application

#### Option A: DevPulse Windows Desktop App (Electron with Vite HMR)
```bash
# From root:
npm run dev

# Or from frontend/:
cd frontend
npm run dev
```
Starts the Vite dev server and opens the native DevPulse desktop window. Frontend code updates reload instantly via Vite HMR.

#### Option B: Standalone Web Frontend (Browser Only)
```bash
# From root:
npm run dev:web

# Or from frontend/:
cd frontend
npm run dev:web
```
Runs the standard web application at `http://localhost:5173`.

---

## 7. Packaging the Windows Desktop Application (.exe)

Electron Builder produces an installable Windows NSIS wizard and portable executable:

```bash
# 1. Compile the production bundles
npm run build

# 2. Package the Windows NSIS installer
npm run dist
```

### Generated Artifacts:
- **Installer:** `frontend/dist-electron/DevPulse Setup 0.0.0.exe` (full installation wizard with shortcuts).
- **Standalone:** `frontend/dist-electron/win-unpacked/DevPulse.exe` (unpacked directory executable).

To generate only the unpacked directory without creating the installer package:
```bash
npm run dist:dir
```

---

## 8. Running Tests & Verifying Builds

### Backend Integration Tests
```bash
npm run test:backend
# Or: cd backend && mvn test
```
Result: **12 tests executed, 0 failures, 0 errors**.

### Frontend Unit Tests (Vitest)
```bash
npm test
# Or: npm --prefix frontend run test
```
Result: **13 tests executed, 0 failures**.

### Standalone Web Production Build
```bash
npm run build:web
```

---

## 9. Next Implementation Steps (Phase 2)

- **Timer Engine:** Active work session stopwatch and duration computation.
- **Task Kanban:** Drag-and-drop task workflow boards scoped by project.
- **Daily Journal:** Markdown-powered daily notes with syntax highlighting.
- **External Object Storage:** AWS S3 / MinIO integration for file attachments using `AttachmentMetadata`.
- **Developer Analytics:** Aggregated velocity metrics and weekly report generators.

