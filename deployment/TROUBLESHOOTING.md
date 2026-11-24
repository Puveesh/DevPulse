# Production Troubleshooting Guide

Solutions for common operational and deployment issues with DevPulse.

---

## 1. Backend Connectivity & Startup Issues

### Problem: Railway application fails to start or crashes immediately
- **Cause:** Missing required production environment variables.
- **Solution:** Check Railway deployment logs. Ensure `SPRING_PROFILES_ACTIVE=prod` and that database variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` or `MYSQL_URL`) and `JWT_SECRET` are configured.

### Problem: Backend cannot connect to MySQL (`CommunicationsException`)
- **Cause:** Incorrect database host, port, or password; or database service still starting.
- **Solution:** 
  - Ensure the MySQL service in Railway is active.
  - If using variable references, confirm `${{MySQL.MYSQLHOST}}` resolves to internal service name (e.g. `mysql.railway.internal`).
  - Check that the backend and MySQL are within the same Railway project environment.

### Problem: Health check returns 503 (`database: "DISCONNECTED"`)
- **Cause:** The database was unreachable during the connection test query.
- **Solution:** Check Railway logs for HikariPool connection timeouts or authentication failures. Ensure credentials match the MySQL service variables.

---

## 2. API & Security Issues

### Problem: API returns 401 Unauthorized for valid requests
- **Cause:** Token expired or `JWT_SECRET` was changed while client retained old session token.
- **Solution:** Log out of the client and log back in to generate a fresh token signed with the current secret key.

### Problem: CORS error when making API requests from Web browser
- **Cause:** The browser origin is not in `CORS_ALLOWED_ORIGINS`.
- **Solution:** In Railway, update `CORS_ALLOWED_ORIGINS` to include your web frontend domain (e.g. `https://devpulse.vercel.app,http://localhost:5173`).

---

## 3. Desktop Client (Electron) Issues

### Problem: Packaged Electron app still makes requests to `localhost`
- **Cause:** The frontend was compiled without setting `VITE_API_BASE_URL` in `frontend/.env.production`.
- **Solution:** 
  1. Open `frontend/.env.production`.
  2. Set `VITE_API_BASE_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app`.
  3. Rebuild and repackage: `npm --prefix frontend run build && npm --prefix frontend run dist`.

### Problem: Blank white screen on application launch
- **Cause:** Single Page Application (SPA) asset loading error.
- **Solution:** DevPulse uses a custom standard `app://` protocol handler in `frontend/electron/main.ts` that automatically falls back to `index.html` for client-side routing. Verify that `frontend/out/renderer/index.html` exists before running `npm run dist`.

### Problem: Avatar uploads fail in packaged desktop client
- **Cause:** Exceeding upload limits or network timeout.
- **Solution:** Avatars up to 5MB are accepted. The Spring Boot backend accepts multipart requests up to 10MB (`spring.servlet.multipart.max-file-size: 10MB`).
