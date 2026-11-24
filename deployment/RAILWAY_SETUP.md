# Railway Cloud Deployment Guide

This guide explains how to deploy the DevPulse Spring Boot backend and MySQL database to Railway.

---

## Prerequisites
1. A [Railway](https://railway.app/) account.
2. The DevPulse repository pushed to your GitHub account.

---

## Step 1: Create a Railway Project
1. Log in to [Railway Dashboard](https://railway.app/dashboard).
2. Click **New Project**.
3. Select **Provision MySQL**. This provisions a dedicated, managed MySQL database.

---

## Step 2: Add the Spring Boot Backend Service
1. In the same Railway project canvas, click **+ New** (or **Add a Service**).
2. Select **GitHub Repo** and choose your `DevPulse` repository.
3. Railway will create a new service linked to the repository.

---

## Step 3: Configure Backend Service Settings
1. Click on the newly added GitHub service card.
2. Navigate to the **Settings** tab:
   - **Root Directory:** If you want Railway to build from the repository root, leave as `/`. (A root `Dockerfile` and `railway.json` are already provided). Alternatively, you can set it to `backend`.
   - **Build Command / Builder:** Railway will detect `DOCKERFILE` automatically from `railway.json`.
3. Under the **Networking** section:
   - Click **Generate Domain**.
   - Note the generated domain (e.g. `devpulse-backend-production.up.railway.app`). This is your public API URL.

---

## Step 4: Link MySQL Environment Variables
1. Navigate to the **Variables** tab of the backend service.
2. If your MySQL database is in the same Railway project, Railway offers **Reference Variables**:
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
   - `DB_USERNAME`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   *(Or simply let Spring Boot auto-read `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD` which Railway injects automatically).*
3. Add the following application variables:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `JWT_SECRET`: Generate a random 64-character string or base64 key (e.g. `openssl rand -base64 48`).
   - `JWT_COOKIE_SECURE`: `true`
   - `JWT_COOKIE_SAME_SITE`: `None`
   - `CORS_ALLOWED_ORIGINS`: `http://localhost:5173,app://devpulse,https://YOUR_WEB_DOMAIN_IF_ANY`

---

## Step 5: Deploy and Verify
1. Railway automatically triggers a deployment when variables or repository commits change.
2. Go to the **Deployments** tab and click **View Logs**.
3. Look for the startup banner:
   ```
   DevPulse Backend started successfully!
   Active Profile(s)    : [prod]
   Database Connected   : jdbc:mysql://mysql.railway.internal:3306/...
   Health Check URL     : http://localhost:8080/api/health
   ```
4. Test the public health endpoint in your browser or curl:
   ```bash
   curl -i https://YOUR-BACKEND-DOMAIN.up.railway.app/api/health
   ```
   Expected response (HTTP 200):
   ```json
   {
     "status": "UP",
     "service": "DevPulse Backend API",
     "timestamp": "2026-11-23T17:15:00.000Z",
     "database": "CONNECTED"
   }
   ```
