# DevPulse Production Deployment Checklist

Use this checklist before and after deploying DevPulse to production.

---

## 1. Local Codebase Preparation
- [x] Backend compiles and passes all unit and integration tests (`mvn clean test`).
- [x] Fresh database Flyway migrations validated (`V1` to `V4`).
- [x] Production Spring profile configured (`application-prod.yml`).
- [x] Dockerfile and container configuration created for Railway.
- [x] Frontend passes all unit tests and builds without errors (`npm test`, `npm run build`).
- [x] `normalizeApiUrl` supports environment-driven API URLs (`VITE_API_BASE_URL`).
- [x] `.env.development.example` and `.env.production.example` added.
- [x] `.gitignore` verified to protect secrets and local environment files.

---

## 2. Railway Infrastructure Setup
- [ ] Create Railway Project and provision a MySQL database.
- [ ] Connect the GitHub repository to create the backend service.
- [ ] Set `Root Directory` in service settings (or use root Dockerfile).
- [ ] Generate public domain for the backend service (under Networking).
- [ ] Configure Environment Variables in Railway:
  - `SPRING_PROFILES_ACTIVE`: `prod`
  - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
  - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
  - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
  - `DB_USERNAME`: `${{MySQL.MYSQLUSER}}`
  - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
  - `JWT_SECRET`: (Strong 256-bit+ random base64 secret)
  - `JWT_COOKIE_SECURE`: `true`
  - `JWT_COOKIE_SAME_SITE`: `None`
  - `CORS_ALLOWED_ORIGINS`: `http://localhost:5173,app://devpulse`

---

## 3. Backend Verification
- [ ] Railway deployment build status is **Active** (green).
- [ ] Verify startup logs indicate profile `[prod]` and database connection.
- [ ] Access public health endpoint: `https://YOUR-BACKEND.up.railway.app/api/health`.
  - HTTP 200 with `status: "UP"` and `database: "CONNECTED"`.

---

## 4. Electron Desktop Client Packaging
- [ ] Update `frontend/.env.production` with the live Railway backend URL.
- [ ] If bumping release version, run `npm version patch` (or update `package.json`).
- [ ] Build client: `npm --prefix frontend run build`.
- [ ] Package Windows installer: `npm --prefix frontend run dist`.
- [ ] Verify installer in `frontend/dist-electron/DevPulse Desktop Client Setup <version>.exe`.

---

## 5. End-to-End Testing on Clean PC
- [ ] Run installer on a PC without Java, Node.js, or MySQL.
- [ ] Register a new user account.
- [ ] Create a project and start a work session timer.
- [ ] Log out, close app, and re-login to verify data persistence across sessions.
