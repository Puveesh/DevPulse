# DevPulse — Developer Worklog & Analytics Platform (Web Application)

DevPulse is a developer productivity workspace designed to track coding sessions, manage project repositories, record worklogs, and analyze personal developer velocity over time.

---

## 1. Project Overview & Architecture

DevPulse is architected as a clean standard web application monorepo with an independent React + Vite frontend and a Spring Boot 3 backend running against MySQL with automated Flyway database migrations.

### Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, React Router v7, TanStack Query v5, React Hook Form, Zod, Axios.
- **Backend:** Java 21, Spring Boot 3.4.2, Spring Security, Spring Data JPA, Spring Boot Validation, Flyway Migrations, JJWT 0.12.6, Springdoc OpenAPI 3.
- **Database:** MySQL 8.0+ (with Docker Compose and Flyway schema versioning).
- **Authentication:** Dual-method with Email/Password (BCrypt) + Google OAuth 2.0 (Authorization Code Flow with PKCE).

---

## 2. Monorepo Structure

```
devpulse/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/devpulse/
│   │   │   │   ├── DevPulseApplication.java
│   │   │   │   ├── auth/          # Authentication controllers, services, OAuth, and DTOs
│   │   │   │   ├── common/        # Global exceptions, ApiResponse, error handlers
│   │   │   │   ├── config/        # Security, CORS, JWT, and OpenAPI configuration
│   │   │   │   ├── project/       # Project entity, service, controller, and DTOs
│   │   │   │   ├── security/      # JWT provider, auth filter, UserPrincipal, cookies
│   │   │   │   ├── task/          # Task entity, service, controller
│   │   │   │   ├── user/          # User entity and repository
│   │   │   │   └── worklog/       # WorkSession, DailyNote, and AttachmentMetadata
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-prod.yml
│   │   │       └── db/migration/  # Flyway database migrations (V1 - V8)
│   │   └── test/
│   │       └── java/com/devpulse/ # Integration tests for Auth, OAuth, Projects, etc.
│   ├── .env.example
│   ├── .gitignore
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/            # ProtectedRoute, AppLayout, UI components
│   │   ├── contexts/              # AuthContext, WorkSessionContext
│   │   ├── features/              # Auth, Dashboard, Projects, Settings, Worklog, Analytics
│   │   ├── hooks/                 # TanStack Query custom hooks
│   │   ├── lib/                   # Axios API client, utils
│   │   ├── types/                 # TypeScript interfaces and API payload types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── docker-compose.yml             # Local MySQL 8.0 container setup
├── commands.txt                   # Quick command reference
├── GOOGLE_OAUTH_SETUP.md          # Google Cloud OAuth 2.0 setup guide
├── .gitignore
├── .env.example
├── LICENSE
└── README.md
```

---

## 3. Database Schema Summary (Flyway Migrations V1 - V8)

- **`users`:** Developer profiles, password hash, avatar image, preferences, timezone, job title.
- **`user_auth_identities`:** External provider identity mappings (Google `sub`, provider email, verification status).
- **`oauth_sessions`:** Cryptographic state tokens and server-side PKCE verifiers.
- **`oauth_tickets`:** Single-use, short-lived hashed tickets for secure post-callback JWT exchange.
- **`projects`:** Developer project repositories, status, tech stack, repository URL.
- **`tasks`:** Task tracking scoped to projects and users with priorities and due dates.
- **`work_sessions`:** Stopwatch work logs, duration, status, notes, pause intervals.
- **`daily_notes`:** Daily developer journal notes with rich text and mentions.
- **`attachments`:** Attachment metadata linked to projects and daily notes.

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
| `POST` | `/api/v1/auth/google/start` | Public | Initiates Google OAuth 2.0 authorization code flow with PKCE |
| `GET` | `/api/v1/auth/google/callback` | Public | Callback endpoint receiving authorization code from Google |
| `POST` | `/api/v1/auth/google/exchange` | Public | Exchanges single-use ticket and PKCE verifier for JWT session |

### Documentation
- OpenAPI Spec: `http://localhost:8081/api-docs`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

---

## 5. Local Setup & Execution

### Prerequisites
- Java 21+
- Maven 3.9+
- Node.js 20+ and npm
- Docker (for local MySQL container) or an existing MySQL server running on port 3306

### Step 1: Start MySQL Database
```bash
docker-compose up -d
```
Database is `devpulse` on `localhost:3306`. Flyway migrations are applied automatically on backend startup.

### Step 2: Run Backend
```bash
npm run dev:backend
# Or: cd backend && mvn spring-boot:run
```
Backend starts at `http://localhost:8081`.

### Step 3: Run Web Frontend
```bash
npm run dev
# Or: cd frontend && npm run dev
```
Web application is available at `http://localhost:5173`.

---

## 6. Running Tests & Verifying Builds

### Backend Integration Tests (Maven / JUnit)
```bash
npm run test:backend
# Or: cd backend && mvn test
```

### Frontend Unit & Integration Tests (Vitest)
```bash
npm test
# Or: cd frontend && npm test
```

### Frontend Web Build
```bash
npm run build
# Or: cd frontend && npm run build
```
Production assets are generated in `frontend/dist/`.
