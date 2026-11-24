# Production Environment Variables Specification

This document lists all environment variables used by the DevPulse backend and frontend.

---

## 1. Backend Service Variables (Configure in Railway)

| Variable Name | Required | Default / Example | Purpose | Secret? |
|---|---|---|---|---|
| `PORT` | Yes (Auto) | `8080` | Port assigned by Railway container runner. | No |
| `SPRING_PROFILES_ACTIVE` | Yes | `prod` | Activates production configuration profile (`application-prod.yml`). | No |
| `DB_HOST` | Yes | `${{MySQL.MYSQLHOST}}` | MySQL service internal hostname (e.g. `mysql.railway.internal`). | No |
| `DB_PORT` | Yes | `${{MySQL.MYSQLPORT}}` or `3306` | MySQL port. | No |
| `DB_NAME` | Yes | `${{MySQL.MYSQLDATABASE}}` or `railway` | Database schema name. | No |
| `DB_USERNAME` | Yes | `${{MySQL.MYSQLUSER}}` or `root` | Database username. | Yes |
| `DB_PASSWORD` | Yes | `${{MySQL.MYSQLPASSWORD}}` | Database password. | Yes |
| `JWT_SECRET` | Yes | (Random 256-bit+ base64 key) | Cryptographic key used to sign and verify JWT authentication tokens. | **Yes** |
| `JWT_EXPIRATION_MS` | No | `86400000` (24h) | JWT validity duration in milliseconds. | No |
| `JWT_COOKIE_SECURE` | Yes | `true` | Enforces `Secure` flag on authentication cookies over HTTPS. | No |
| `JWT_COOKIE_SAME_SITE` | Yes | `None` | `SameSite` cookie policy for cross-origin HTTPS requests. | No |
| `CORS_ALLOWED_ORIGINS` | Yes | `http://localhost:5173,app://devpulse` | Comma-separated list of allowed origins. | No |

> [!TIP]
> The backend automatically falls back to Railway-native variables (`MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQL_URL`) if `DB_*` variables are omitted in Railway.

---

## 2. Frontend / Desktop Client Variables (Build-Time)

Configure these variables in `frontend/.env.production` before building the production Electron executable.

| Variable Name | Required | Example | Purpose | Secret? |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `https://devpulse-backend.up.railway.app` | Base URL pointing to the deployed Railway Spring Boot API. | No |

> [!IMPORTANT]
> Vite embeds `VITE_*` variables into client assets at compile time. Whenever your backend URL changes, re-run `npm run build && npm run dist` to produce a new installer.
