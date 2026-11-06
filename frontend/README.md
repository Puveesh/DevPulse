# DevPulse Desktop Client

The desktop runtime for DevPulse, built with React 19, TypeScript, Tailwind CSS, Vite, and Electron.

## Scripts

- `npm run dev`: Launch the DevPulse Desktop Client in development mode with live Vite HMR.
- `npm run dev:web`: Launch the frontend independently in a standard web browser.
- `npm run build`: Build production desktop main, preload, and renderer packages into `out/`.
- `npm run build:web`: Build the web bundle into `dist/`.
- `npm run dist`: Package the Windows NSIS installer wizard (`DevPulse Desktop Client Setup 0.1.0.exe`).
- `npm run dist:dir`: Package an unpacked directory with `DevPulse Desktop Client.exe`.
- `npm test`: Run Vitest unit tests.
