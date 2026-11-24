# Building and Distributing the Windows Electron Executable

This guide covers building the standalone DevPulse Windows installer (`.exe`) configured to communicate with your hosted Railway backend.

---

## Prerequisites
- Node.js 18+ and npm installed on your development machine.
- Your Spring Boot backend successfully deployed to Railway with a generated public domain.

---

## Step 1: Set the Hosted Backend URL
In `frontend/.env.production`, set your Railway backend domain:

```properties
VITE_API_BASE_URL=https://YOUR-RAILWAY-BACKEND-DOMAIN.up.railway.app
```

> [!NOTE]
> Do not include trailing slashes. The application automatically resolves and routes requests to the `/api/v1` namespace.

---

## Step 2: Build the Production Client Assets
Compile the React frontend, preload scripts, and Electron main process:

```bash
cd frontend
npm run build
```

This compiles optimized bundles into `frontend/out/`:
- `out/main/main.cjs`
- `out/preload/preload.cjs`
- `out/renderer/` (Single Page Application HTML, CSS, and JS)

---

## Step 3: Package the Windows Executable
Generate the standalone Windows NSIS installer:

```bash
npm run dist
```

Upon completion, your installer is generated in `frontend/dist-electron/`:
- **`DevPulse Desktop Client Setup <version>.exe`**

---

## Step 4: Testing & Distribution
1. Run the generated installer on your machine or copy it to another Windows PC.
2. Complete the setup wizard (creates desktop and start menu shortcuts).
3. Open **DevPulse Desktop Client**.
4. Register a new account or sign in.
5. Notice that the application communicates directly with your remote Railway backend without requiring Java, Node.js, or MySQL to be installed on that computer.
